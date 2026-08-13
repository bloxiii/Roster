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
    .apt_install("ffmpeg", "colmap", "git", "libgl1", "libglib2.0-0", "build-essential")
    # Le compilateur par défaut de cette image pointe vers clang++, absent
    # (et de toute façon incompatible avec le PyTorch précompilé, qui attend
    # g++ — cf. avertissement "compiler ABI"). On force explicitement gcc/g++,
    # nécessaires pour compiler fused-ssim/fused-bilagrid/gsplat plus bas.
    #
    # TORCH_CUDA_ARCH_LIST : sans GPU pendant le build de l'image (normal —
    # le GPU n'est attaché qu'à l'exécution, cf. `gpu="L4"` sur
    # `reconstruct` plus bas), PyTorch essaie de détecter l'architecture
    # CUDA cible automatiquement et plante ("IndexError: list index out of
    # range" — liste vide). "8.9" = architecture Ada Lovelace du GPU L4
    # utilisé par ce worker ; à mettre à jour si le GPU change un jour.
    .env({"CC": "gcc", "CXX": "g++", "TORCH_CUDA_ARCH_LIST": "8.9"})
    # torch/torchvision épinglés en premier — simple_trainer.py (examples/
    # requirements.txt du dépôt gsplat) exige ces versions précises pour
    # éviter qu'une dépendance transitive ne les fasse changer silencieusement.
    .pip_install("torch==2.9.1", "torchvision==0.24.1")
    # simple_trainer.py n'est pas exposé par le package pip `gsplat` — on
    # clone le dépôt pour l'obtenir, PUIS on installe `gsplat` lui-même
    # depuis CE MÊME clone (pas depuis PyPI) juste en dessous : la branche
    # main du dépôt est en avance sur la dernière release PyPI et utilise
    # des fonctions pas encore publiées (ex: gsplat.color_correct),
    # d'où "ModuleNotFoundError: No module named 'gsplat.color_correct'"
    # si on mélange PyPI + examples de main.
    #
    # --branch v1.5.3 (PAS main) : la branche main utilise des fonctions
    # CUDA plus récentes que ce que notre image CUDA 12.4 supporte (ex:
    # cuda::ceil_div, "namespace cuda has no member ceil_div" à la
    # compilation) — v1.5.3 est la version taguée/publiée, figée et cohérente
    # avec CUDA 12.4, et ses examples/ ne référencent pas color_correct
    # puisque cette fonction n'existait pas encore à cette version.
    #
    # --recurse-submodules : gsplat embarque GLM (maths C++) en sous-module
    # git (gsplat/cuda/csrc/third_party/glm) — sans ça, le clone laisse ce
    # dossier vide et la compilation échoue avec "glm/gtc/type_ptr.hpp: No
    # such file or directory".
    .run_commands(
        "git clone --depth 1 --branch v1.5.3 --recurse-submodules --shallow-submodules "
        "https://github.com/nerfstudio-project/gsplat.git /opt/gsplat-src"
    )
    # wheel/setuptools d'abord : nécessaire pour les installs
    # --no-build-isolation qui suivent (gsplat, fused-ssim, fused-bilagrid
    # sont tous des extensions CUDA qui font `import torch` dans leur propre
    # setup.py — l'isolation de build par défaut de pip masque le torch
    # déjà installé ci-dessus, d'où "ModuleNotFoundError: No module named
    # 'torch'" sans --no-build-isolation).
    # Commits fused-ssim/fused-bilagrid alignés sur ceux listés par
    # examples/requirements.txt AU TAG v1.5.3 (différents de ceux de main) —
    # cohérence avec la même version de CUDA que gsplat lui-même.
    .run_commands(
        "pip install wheel setuptools",
        "pip install --no-build-isolation /opt/gsplat-src",  # Apache 2.0, PAS graphdeco-inria/gaussian-splatting
        "pip install --no-build-isolation "
        "git+https://github.com/rahul-goel/fused-ssim@328dc9836f513d00c4b5bc38fe30478b4435cbb5",
        "pip install --no-build-isolation "
        "git+https://github.com/harry7557558/fused-bilagrid@90f9788e57d3545e3a033c1038bb9986549632fe",
    )
    .pip_install(
        # Dépendances de worker/pipeline.py lui-même.
        "requests", "pillow", "supabase", "fastapi[standard]",
        # Dépendances de examples/simple_trainer.py — liste reprise de
        # https://github.com/nerfstudio-project/gsplat/blob/v1.5.3/examples/requirements.txt
        # (torch/torchvision/gsplat déjà installés ci-dessus, omis ici).
        # PAS de "pycolmap" PyPI ici — le fork rmbrualla/pycolmap installé
        # juste en dessous porte le même nom de paquet mais expose une API
        # différente (classe SceneManager, requise par examples/datasets/
        # colmap.py). Les deux "pycolmap" seraient en conflit si listés ici.
        "viser",
        "git+https://github.com/nerfstudio-project/nerfview@4538024fe0d15fd1a0e4d760f3695fc44ca72787",
        "imageio[ffmpeg]",
        "numpy<2.0.0",
        "scipy",
        "scikit-learn",
        "tqdm",
        "torchmetrics[image]",
        "opencv-python-headless",
        "tyro>=0.8.8",
        "tensorboard",
        "tensorly",
        "pyyaml",
        "matplotlib",
        "splines",
    )
    # Fork pur Python (pas de compilation, juste numpy/scipy) qui expose
    # SceneManager — l'API attendue par examples/datasets/colmap.py, absente
    # du paquet "pycolmap" officiel de PyPI (bindings C++ différents,
    # même nom de paquet, code différent).
    .pip_install("git+https://github.com/rmbrualla/pycolmap@cc7ea4b7301720ac29287dbe450952511b32125e")
)

QUALITY_THRESHOLD = 0.75  # abaissé temporairement pour le premier test réel (82% obtenu) — remonter à 0.85 ensuite.
FRAME_SAMPLE_FPS = 2.5


def _log(msg: str) -> None:
    """Checkpoint visible dans les logs Modal en direct — sans ça, ffmpeg/
    COLMAP/l'entraînement tournent en silence total (capture_output=True)
    et il est impossible de distinguer "ça travaille" de "c'est bloqué"
    pendant de longues minutes."""
    import time

    print(f"[pipeline] {time.strftime('%H:%M:%S')} — {msg}", flush=True)


def _run(cmd: list, *, label: str, **kwargs) -> subprocess.CompletedProcess:
    """subprocess.run() qui affiche un signe de vie toutes les 20s tant que
    la commande tourne. Sans ça, une étape qui n'imprime rien elle-même
    (export .ply d'une grosse scène, par exemple) est indiscernable d'un
    blocage total pendant plusieurs minutes — c'est exactement ce qui nous
    a fait perdre du temps à essayer de deviner si le pipeline avançait."""
    import threading
    import time as _time

    start = _time.time()
    stop_event = threading.Event()

    def heartbeat():
        while not stop_event.wait(20):
            _log(f"… {label} toujours en cours ({int(_time.time() - start)}s écoulées)")

    t = threading.Thread(target=heartbeat, daemon=True)
    t.start()
    try:
        return subprocess.run(cmd, **kwargs)
    finally:
        stop_event.set()
        t.join(timeout=1)


def download_video(video_url: str, dest: Path) -> None:
    import requests

    _log("téléchargement de la vidéo…")
    with requests.get(video_url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                f.write(chunk)
    _log(f"vidéo téléchargée ({dest.stat().st_size / 1e6:.1f} Mo)")


def extract_frames(video_path: Path, frames_dir: Path) -> int:
    _log("extraction des frames (ffmpeg)…")
    frames_dir.mkdir(parents=True, exist_ok=True)
    _run(
        [
            "ffmpeg", "-i", str(video_path),
            "-vf", f"fps={FRAME_SAMPLE_FPS}",
            "-q:v", "2",
            str(frames_dir / "frame_%05d.jpg"),
        ],
        label="ffmpeg", check=True, capture_output=True,
    )
    count = len(list(frames_dir.glob("frame_*.jpg")))
    _log(f"{count} frames extraites")
    return count


def run_colmap(frames_dir: Path, workspace: Path) -> Path:
    """Structure-from-Motion — poses caméra + nuage de points épars.

    `sequential_matcher` plutôt que `exhaustive_matcher` : les frames d'une
    vidéo sont déjà temporellement ordonnées, l'appariement séquentiel est
    largement plus rapide et tout aussi fiable dans ce cas (cf. analyse §02).

    SIFT en CPU (`use_gpu 0`) : le binaire COLMAP installé via apt utilise
    Qt/OpenGL pour le SIFT GPU, ce qui nécessite un affichage — absent dans
    un conteneur headless (erreur "qt.qpa.xcb: could not connect to
    display"). Plus lent, mais évite complètement le problème.
    """
    db_path = workspace / "database.db"
    sparse_dir = workspace / "sparse"
    sparse_dir.mkdir(parents=True, exist_ok=True)

    _log("COLMAP — extraction des features (SIFT, CPU)…")
    _run(
        ["colmap", "feature_extractor", "--database_path", str(db_path),
         "--image_path", str(frames_dir), "--ImageReader.single_camera", "1",
         "--SiftExtraction.use_gpu", "0"],
        label="colmap feature_extractor", check=True, capture_output=True,
    )
    _log("COLMAP — appariement séquentiel des frames…")
    _run(
        ["colmap", "sequential_matcher", "--database_path", str(db_path),
         "--SiftMatching.use_gpu", "0"],
        label="colmap sequential_matcher", check=True, capture_output=True,
    )
    _log("COLMAP — reconstruction (mapper) — étape la plus longue en CPU…")
    _run(
        ["colmap", "mapper", "--database_path", str(db_path),
         "--image_path", str(frames_dir), "--output_path", str(sparse_dir)],
        label="colmap mapper", check=True, capture_output=True,
    )
    _log("COLMAP — mapper terminé")

    model_dir = sparse_dir / "0"  # premier (et normalement unique) modèle reconstruit
    if model_dir.exists():
        # `mapper` écrit en binaire (images.bin, ...) — on exporte aussi en
        # texte pour que registered_frame_ratio()/read_camera_centers()
        # puissent lire images.txt directement.
        _log("COLMAP — export du modèle en texte…")
        _run(
            ["colmap", "model_converter", "--input_path", str(model_dir),
             "--output_path", str(model_dir), "--output_type", "TXT"],
            label="colmap model_converter", check=True, capture_output=True,
        )
    # Si model_dir n'existe pas : reconstruction réellement infructueuse
    # (aucune image enregistrée) — registered_frame_ratio() le détecte déjà
    # via `not images_txt.exists()` et remonte 0%, sans planter ici.
    return model_dir


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
    _log("entraînement gsplat démarré (7000 itérations — voir la barre de progression ci-dessous)…")
    # PAS de capture_output ici, volontairement : la barre de progression
    # tqdm de simple_trainer.py s'affiche en direct dans les logs Modal —
    # c'est le signal le plus utile pour juger du temps restant. 7000
    # itérations plutôt que 15000 pour un premier run plus court/moins
    # coûteux ; qualité à revoir à la hausse une fois le pipeline validé.
    #
    # --strategy.refine_stop_iter 2000 : DefaultStrategy n'a AUCUN plafond
    # sur le nombre de gaussiennes par défaut — la densification continue
    # jusqu'à refine_stop_iter (15 000 par défaut, donc quasi tout
    # l'entraînement chez nous). Sur le premier run réel, la scène a
    # explosé à 1,19 million de gaussiennes pour seulement 97 photos,
    # rendant l'export du .ply extrêmement lent (30+ min, silencieux).
    # On coupe la densification à l'itération 2000 : la scène arrête de
    # grossir puis optimise ce qu'elle a pour le reste du run — beaucoup
    # moins de gaussiennes, export rapide, fichier bien plus léger pour
    # le viewer web.
    _run(
        [
            "python", "/opt/gsplat-src/examples/simple_trainer.py", "default",
            "--data_dir", str(dataset_dir),
            "--data_factor", "1",
            "--result_dir", str(output_dir),
            "--max_steps", "7000",
            "--strategy.refine_stop_iter", "2000",
        ],
        label="entraînement gsplat (simple_trainer.py)", check=True,
    )
    # Checkpoint séparé de "entraînement terminé" ci-dessus : si ça bloque
    # ENTRE la fin de la barre de progression et ce point, c'est dans une
    # étape interne au script (export .ply, sauvegarde de checkpoint...)
    # non couverte par le heartbeat de _run (le sous-process lui-même est
    # fini, on est repassés côté Python).
    _log("commande d'entraînement terminée — recherche du fichier .ply exporté…")
    ply_candidates = list(output_dir.rglob("*.ply"))
    if not ply_candidates:
        raise RuntimeError("Entraînement terminé mais aucun .ply exporté — vérifier result_dir.")
    size_mb = ply_candidates[-1].stat().st_size / 1e6
    _log(f"{len(ply_candidates)} fichier(s) .ply trouvé(s), le plus récent fait {size_mb:.1f} Mo")
    return ply_candidates[-1]


def upload_scene(local_ply: Path, tour_id: str) -> str:
    from supabase import create_client

    _log(f"connexion à Supabase Storage (bucket tour-scenes)…")
    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    storage_path = f"{tour_id}/scene.ply"
    with open(local_ply, "rb") as f:
        _log(f"upload en cours ({local_ply.stat().st_size / 1e6:.1f} Mo)…")
        supabase.storage.from_("tour-scenes").upload(
            storage_path, f, {"content-type": "application/octet-stream", "upsert": "true"},
        )
    _log("upload terminé")
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
    timeout=45 * 60,  # marge portée à 45 min (COLMAP en CPU + entraînement peuvent être lents sur un premier run)
    secrets=[modal.Secret.from_name("velinova-3d")],
)
def reconstruct(tour_id: str, video_url: str, webhook_url: str, provider_job_id: str) -> None:
    webhook_secret = os.environ["THREED_WEBHOOK_SECRET"]
    _log(f"démarrage — tour_id={tour_id}")

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
            _log(f"qualité : {ratio:.0%} de frames enregistrées (seuil {QUALITY_THRESHOLD:.0%})")
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
            _log("upload de la scène vers Supabase Storage…")
            scene_url = upload_scene(ply_path, tour_id)
            _log(f"terminé — scene_url={scene_url}")

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

    Le secret est lu dans le corps JSON (`webhook_secret`), pas dans un
    en-tête : faire injecter l'objet `Request` de FastAPI par
    `@modal.fastapi_endpoint` nécessite une annotation de type résolvable
    au niveau du module (donc `fastapi` importé en haut du fichier), ce qui
    casse `modal deploy` si `fastapi` n'est pas installé localement. Un
    champ du body évite complètement ce problème.
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
