"""
Velinova 3D — worker de reconstruction (pipeline maison, section 03 §Option B
de l'analyse : notre code, exécuté sur du GPU serverless Modal plutôt qu'un
fournisseur tiers ou un cluster GPU auto-géré).

Vidéo → frames (ffmpeg) → poses caméra (COLMAP) → contrôle qualité
→ 3D Gaussian Splatting (gsplat, licence Apache 2.0 — PAS l'implémentation
de référence Inria, qui est non-commerciale, cf. analyse §14) → export
compressé → upload Supabase Storage → webhook vers l'application Next.js.

⚠️ STATUT : code réel, structuré pour être déployé tel quel, mais NON
EXÉCUTÉ — cet environnement de développement n'a ni GPU ni ffmpeg/COLMAP
installés (sandbox CPU seul). L'étape la plus incertaine est
`train_gaussian_splats()` : elle invoque le script d'exemple fourni par
gsplat (`examples/simple_trainer.py` dans le dépôt nerfstudio-project/gsplat)
plutôt que de réimplémenter une boucle d'entraînement à la main — c'est ce
qui existe de plus proche d'un pipeline "clé en main" sous licence
permissive aujourd'hui, mais son interface en ligne de commande évolue
avec les versions de gsplat : à valider avec la version réellement
installée avant tout déploiement en production (voir README.md).

Déploiement : `modal deploy worker/pipeline.py` (voir worker/README.md).
"""

import json
import os
import subprocess
import tempfile
from pathlib import Path

import modal

app = modal.App("velinova-3d-worker")

# gsplat nécessite un torch compilé CUDA — l'image de base Modal avec CUDA
# préinstallé simplifie ça largement par rapport à un pip install générique.
image = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-devel-ubuntu22.04", add_python="3.11")
    .apt_install("ffmpeg", "colmap", "git", "libgl1", "libglib2.0-0")
    .pip_install(
        "torch",
        "torchvision",
        "gsplat",  # nerfstudio-project/gsplat — Apache 2.0, PAS graphdeco-inria/gaussian-splatting
        "requests",
        "numpy",
        "pillow",
        "supabase",
        "fastapi[standard]",  
    )
    # simple_trainer.py n'est pas exposé par le package pip gsplat — on
    # récupère la version du dépôt correspondant à la release installée.
    .run_commands(
        "pip show gsplat | grep Version",
        "git clone --depth 1 https://github.com/nerfstudio-project/gsplat.git /opt/gsplat-src",
    )
)

QUALITY_THRESHOLD = 0.85  # section 06 de l'analyse — sous ce seuil, échec explicite.
FRAME_SAMPLE_FPS = 2.5


def download_video(video_url: str, dest: Path) -> None:
    import requests

    with requests.get(video_url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                f.write(chunk)


def extract_frames(video_path: Path, frames_dir: Path) -> int:
    frames_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-i", str(video_path),
            "-vf", f"fps={FRAME_SAMPLE_FPS}",
            "-q:v", "2",
            str(frames_dir / "frame_%05d.jpg"),
        ],
        check=True, capture_output=True,
    )
    return len(list(frames_dir.glob("frame_*.jpg")))


def run_colmap(frames_dir: Path, workspace: Path) -> Path:
    """Structure-from-Motion — poses caméra + nuage de points épars.

    `sequential_matcher` plutôt que `exhaustive_matcher` : les frames d'une
    vidéo sont déjà temporellement ordonnées, l'appariement séquentiel est
    largement plus rapide et tout aussi fiable dans ce cas (cf. analyse §02).
    """
    db_path = workspace / "database.db"
    sparse_dir = workspace / "sparse"
    sparse_dir.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        ["colmap", "feature_extractor", "--database_path", str(db_path),
         "--image_path", str(frames_dir), "--ImageReader.single_camera", "1"],
        check=True, capture_output=True,
    )
    subprocess.run(
        ["colmap", "sequential_matcher", "--database_path", str(db_path)],
        check=True, capture_output=True,
    )
    subprocess.run(
        ["colmap", "mapper", "--database_path", str(db_path),
         "--image_path", str(frames_dir), "--output_path", str(sparse_dir)],
        check=True, capture_output=True,
    )
    return sparse_dir / "0"  # premier (et normalement unique) modèle reconstruit


def registered_frame_ratio(sparse_model_dir: Path, total_frames: int) -> float:
    """Signal de qualité (section 06) : % de frames dont la pose a pu être
    estimée. Lit images.txt (format texte COLMAP) plutôt que le format
    binaire — suffisant pour un simple comptage de lignes d'image."""
    images_txt = sparse_model_dir / "images.txt"
    if not images_txt.exists() or total_frames == 0:
        return 0.0
    lines = images_txt.read_text().splitlines()
    # Format COLMAP : 2 lignes par image enregistrée, après les commentaires "#".
    registered = sum(1 for l in lines if l and not l.startswith("#")) // 2
    return min(1.0, registered / total_frames)


def read_camera_centers(sparse_model_dir: Path) -> list[list[float]]:
    """Centres de caméra (positions monde) dans l'ordre du tournage — sert de
    base au placement automatique des waypoints (section 05)."""
    import numpy as np

    images_txt = sparse_model_dir / "images.txt"
    centers = []
    lines = [l for l in images_txt.read_text().splitlines() if l and not l.startswith("#")]
    for i in range(0, len(lines), 2):
        # QW, QX, QY, QZ, TX, TY, TZ, CAMERA_ID, NAME
        parts = lines[i].split()
        qw, qx, qy, qz = map(float, parts[1:5])
        tx, ty, tz = map(float, parts[5:8])
        # COLMAP stocke la pose monde→caméra (R, t) ; le centre caméra dans
        # le repère monde est C = -R^T @ t.
        R = np.array([
            [1 - 2 * (qy**2 + qz**2), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
            [2 * (qx * qy + qz * qw), 1 - 2 * (qx**2 + qz**2), 2 * (qy * qz - qx * qw)],
            [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx**2 + qy**2)],
        ])
        t = np.array([tx, ty, tz])
        C = -R.T @ t
        centers.append(C.tolist())
    return centers


def build_waypoints(centers: list[list[float]], target_count: int = 6) -> list[dict]:
    """Échantillonne ~`target_count` points de vue le long de la trajectoire
    filmée (un point tous les N mètres environ) — jamais posés à la main,
    cf. section 05 : "zéro intervention humaine"."""
    if not centers:
        return []
    step = max(1, len(centers) // target_count)
    sampled = centers[::step][:target_count]
    waypoints = []
    for i, pos in enumerate(sampled):
        look_idx = min(i * step + step, len(centers) - 1)
        look_at = centers[look_idx]
        waypoints.append({"position": pos, "lookAt": look_at})
    return waypoints


def train_gaussian_splats(frames_dir: Path, sparse_model_dir: Path, output_dir: Path) -> Path:
    """Entraîne la scène 3DGS via le script d'exemple de gsplat.

    ⚠️ C'est le point du pipeline le plus susceptible de nécessiter un
    ajustement : `simple_trainer.py` attend un dataset au format COLMAP
    standard (images/ + sparse/0/) et une organisation de dossier précise
    qui peut varier d'une version de gsplat à l'autre. Valider la commande
    exacte avec `python simple_trainer.py --help` sur l'image buildée avant
    la mise en production.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    dataset_dir = sparse_model_dir.parent.parent  # attend <root>/images + <root>/sparse/0
    subprocess.run(
        [
            "python", "/opt/gsplat-src/examples/simple_trainer.py", "default",
            "--data_dir", str(dataset_dir),
            "--data_factor", "1",
            "--result_dir", str(output_dir),
            "--max_steps", "15000",
        ],
        check=True, capture_output=True,
    )
    ply_candidates = list(output_dir.rglob("*.ply"))
    if not ply_candidates:
        raise RuntimeError("Entraînement terminé mais aucun .ply exporté — vérifier result_dir.")
    return ply_candidates[-1]


def upload_scene(local_ply: Path, tour_id: str) -> str:
    from supabase import create_client

    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    storage_path = f"{tour_id}/scene.ply"
    with open(local_ply, "rb") as f:
        supabase.storage.from_("tour-scenes").upload(
            storage_path, f, {"content-type": "application/octet-stream", "upsert": "true"},
        )
    return supabase.storage.from_("tour-scenes").get_public_url(storage_path)


def notify_webhook(webhook_url: str, secret: str, payload: dict) -> None:
    import requests

    requests.post(
        webhook_url,
        headers={"Content-Type": "application/json", "X-Webhook-Secret": secret},
        data=json.dumps(payload),
        timeout=30,
    )


@app.function(
    image=image,
    gpu="L4",
    timeout=30 * 60,
    secrets=[modal.Secret.from_name("velinova-3d")],
)
def reconstruct(tour_id: str, video_url: str, webhook_url: str, provider_job_id: str) -> None:
    webhook_secret = os.environ["THREED_WEBHOOK_SECRET"]

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        video_path = root / "video.mp4"
        frames_dir = root / "images"          # nom attendu par COLMAP/gsplat
        workspace = root

        try:
            download_video(video_url, video_path)
            total_frames = extract_frames(video_path, frames_dir)
            sparse_model_dir = run_colmap(frames_dir, workspace)

            ratio = registered_frame_ratio(sparse_model_dir, total_frames)
            if ratio < QUALITY_THRESHOLD:
                notify_webhook(webhook_url, webhook_secret, {
                    "tourId": tour_id,
                    "providerJobId": provider_job_id,
                    "status": "failed",
                    "quality": {"registeredFrameRatio": ratio},
                    "error": (
                        f"Seulement {ratio:.0%} de la vidéo a pu être reconstruite "
                        "(minimum requis : 85%). Vérifiez l'éclairage et la stabilité "
                        "du mouvement, puis refilmez."
                    ),
                })
                return

            centers = read_camera_centers(sparse_model_dir)
            waypoints = build_waypoints(centers)

            output_dir = root / "trained"
            ply_path = train_gaussian_splats(frames_dir, sparse_model_dir, output_dir)
            scene_url = upload_scene(ply_path, tour_id)

            notify_webhook(webhook_url, webhook_secret, {
                "tourId": tour_id,
                "providerJobId": provider_job_id,
                "status": "ready",
                "sceneUrl": scene_url,
                "waypoints": waypoints,
                "quality": {"registeredFrameRatio": ratio},
            })

        except subprocess.CalledProcessError as e:
            notify_webhook(webhook_url, webhook_secret, {
                "tourId": tour_id,
                "providerJobId": provider_job_id,
                "status": "failed",
                "error": f"Échec pipeline ({e.cmd[0] if e.cmd else '?'}) : {e.stderr[:500] if e.stderr else ''}",
            })
        except Exception as e:  # noqa: BLE001 — dernier filet, on veut TOUJOURS notifier l'app.
            notify_webhook(webhook_url, webhook_secret, {
                "tourId": tour_id,
                "providerJobId": provider_job_id,
                "status": "failed",
                "error": f"Erreur inattendue du worker : {e}",
            })


@app.function(image=image, secrets=[modal.Secret.from_name("velinova-3d")])
@modal.fastapi_endpoint(method="POST")
def reconstruct_endpoint(payload: dict):
    """POST /reconstruct — appelé par lib/tours/providers/modal.ts.

    Ne fait QUE valider et déléguer via `.spawn()` (asynchrone, ne bloque
    pas) : le job réel tourne dans `reconstruct` ci-dessus, sur GPU, et
    prévient l'application via webhook à la fin — jamais de calcul dans le
    chemin de requête HTTP synchrone.
    """
    from fastapi import HTTPException
    import uuid

    if payload.get("webhook_secret") != os.environ["THREED_WEBHOOK_SECRET"]:
        raise HTTPException(status_code=401, detail="Non autorisé.")

    tour_id = payload.get("tour_id")
    video_url = payload.get("video_url")
    webhook_url = payload.get("webhook_url")
    if not tour_id or not video_url or not webhook_url:
        raise HTTPException(status_code=422, detail="Champs manquants.")

    # On génère nous-mêmes le job_id (plutôt que de dépendre de l'object_id
    # interne du call Modal) : il est passé tel quel à `reconstruct`, qui le
    # renvoie dans le webhook — app/api/tours/webhook le compare ensuite à
    # ce qu'on a stocké ici. Source de vérité unique, aucune introspection
    # fragile de l'API Modal nécessaire.
    job_id = str(uuid.uuid4())
    reconstruct.spawn(tour_id, video_url, webhook_url, job_id)
    return {"job_id": job_id}
