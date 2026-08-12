"use client";

import { useEffect, useRef, useState } from "react";
import type { Waypoint } from "@/lib/tours/types";

type Status = "loading" | "ready" | "error";

const DEFAULT_WAYPOINT: Waypoint = {
  position: [0, 1.6, 4],
  lookAt: [0, 1.4, 0],
};

/**
 * Viewer 3D Gaussian Splatting — navigation hybride (section 05 de
 * l'analyse Velinova 3D) : déplacement en glissement fluide entre points de
 * vue prédéfinis (`waypoints`, dérivés des poses caméra du pipeline de
 * reconstruction) + regard libre à 360° (glisser/toucher) à chaque arrêt.
 *
 * Pas de déplacement libre en 3D : la caméra ne quitte jamais un waypoint
 * en translation, seule sa direction de regard change entre deux
 * déplacements — c'est ce qui évite les artefacts (trous, "floaters") qui
 * apparaissent dès qu'on s'éloigne de la trajectoire réellement filmée.
 */
export function TourViewer({
  sceneUrl,
  waypoints,
}: {
  sceneUrl: string;
  waypoints: Waypoint[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const points = waypoints.length > 0 ? waypoints : [DEFAULT_WAYPOINT];

  // Ref plutôt que state pour l'index cible : lu depuis la boucle de rendu
  // (requestAnimationFrame), qui ne doit pas dépendre du cycle de rendu React.
  const targetIndexRef = useRef(0);

  useEffect(() => {
    targetIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let disposed = false;
    let frameId = 0;
    let renderer: import("three").WebGLRenderer | undefined;
    let viewer: { update: () => void; render: () => void; dispose?: () => void } | undefined;

    // Regard libre (drag/touch) — angles locaux, jamais de translation.
    let yaw = 0;
    let pitch = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    // Animation de glissement entre deux waypoints.
    let animStart = 0;
    let animFrom = points[0].position;
    let animTo = points[0].position;
    let animating = false;
    const ANIM_MS = 900;
    let currentIndex = 0;

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      yaw -= dx * 0.0035;
      pitch -= dy * 0.0035;
      const limit = Math.PI / 2 - 0.08;
      pitch = Math.max(-limit, Math.min(limit, pitch));
    }
    function onPointerUp() {
      dragging = false;
    }

    (async () => {
      try {
        const [THREE, GaussianSplats3D] = await Promise.all([
          import("three"),
          import("@mkkellogg/gaussian-splats-3d"),
        ]);
        if (disposed || !container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);
        const startPos = points[0].position;
        camera.position.set(...startPos);
        camera.up.set(0, 1, 0);
        animFrom = startPos;
        animTo = startPos;

        const gsViewer = new GaussianSplats3D.Viewer({
          selfDrivenMode: false,
          renderer,
          camera,
          useBuiltInControls: false,
          sharedMemoryForWorkers: false,
          gpuAcceleratedSort: false,
        });
        viewer = gsViewer;

        await gsViewer.addSplatScene(sceneUrl, {
          showLoadingUI: false,
          progressiveLoad: true,
        });
        if (disposed) return;

        setStatus("ready");

        function resize() {
          if (!container || !renderer) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
        window.addEventListener("resize", resize);

        container.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);

        const tmpPos = new THREE.Vector3();
        const tmpTarget = new THREE.Vector3();
        const dir = new THREE.Vector3();

        function tick(now: number) {
          frameId = requestAnimationFrame(tick);

          // Démarre une nouvelle transition si l'utilisateur a cliqué un
          // autre waypoint depuis la dernière frame.
          if (targetIndexRef.current !== currentIndex && !animating) {
            animating = true;
            animStart = now;
            animFrom = camera.position.toArray() as [number, number, number];
            animTo = points[targetIndexRef.current].position;
            currentIndex = targetIndexRef.current;
          }

          if (animating) {
            const t = Math.min(1, (now - animStart) / ANIM_MS);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubique
            tmpPos.set(
              animFrom[0] + (animTo[0] - animFrom[0]) * eased,
              animFrom[1] + (animTo[1] - animFrom[1]) * eased,
              animFrom[2] + (animTo[2] - animFrom[2]) * eased,
            );
            camera.position.copy(tmpPos);
            if (t >= 1) animating = false;
          }

          // Regard libre : direction dérivée de yaw/pitch, jamais de
          // translation ajoutée ici — seule la boucle d'animation ci-dessus
          // déplace la caméra, et uniquement entre deux waypoints.
          dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
          tmpTarget.copy(camera.position).add(dir);
          camera.lookAt(tmpTarget);

          gsViewer.update();
          gsViewer.render();
        }
        frameId = requestAnimationFrame(tick);

        return () => {
          window.removeEventListener("resize", resize);
          container.removeEventListener("pointerdown", onPointerDown);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
        };
      } catch (err) {
        console.error("[TourViewer] Échec de chargement de la scène", err);
        if (!disposed) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue.");
        }
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      viewer?.dispose?.();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneUrl]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full touch-none" />

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" />
          <p className="text-sm text-paper-dim">Chargement de la scène 3D…</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink px-6 text-center">
          <p className="text-sm text-paper">Impossible de charger la visite 3D.</p>
          {errorMessage && <p className="max-w-sm text-xs text-paper-dim/60">{errorMessage}</p>}
        </div>
      )}

      {status === "ready" && points.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/60 bg-ink/70 px-3 py-2 backdrop-blur-md">
          {points.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Aller au point de vue ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === activeIndex ? "bg-brass" : "bg-paper-dim/30 hover:bg-paper-dim/60"
              }`}
            />
          ))}
        </div>
      )}

      {status === "ready" && (
        <p className="pointer-events-none absolute bottom-6 right-6 hidden font-mono text-[10px] uppercase tracking-widest text-paper-dim/40 sm:block">
          Glisser pour regarder autour
        </p>
      )}
    </div>
  );
}
