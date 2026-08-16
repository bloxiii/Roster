"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Halo de couleur qui suit le curseur avec un léger retard (spring simple),
 * façon "flashlight" colorée — plus tape-à-l'œil que les étincelles de
 * CursorFireworks, y compris au-dessus du header. Un seul <div> dont on
 * mute directement le transform à chaque frame (pas de re-render React),
 * mix-blend-mode pour se fondre dans ce qu'il survole plutôt que de
 * peindre un disque opaque.
 *
 * Mêmes garde-fous que CursorFireworks : désactivé sur tactile / sans
 * souris précise, sur prefers-reduced-motion, et sur les pages "outil".
 */

const EXCLUDED_PREFIXES = ["/dashboard", "/outreach", "/embed"];

export function CursorGlow() {
  const pathname = usePathname();
  const blobRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  const isToolPage = EXCLUDED_PREFIXES.some((p) => pathname?.includes(p));

  useEffect(() => {
    if (isToolPage) {
      setActive(false);
      return;
    }
    const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setActive(fineHover && !reducedMotion);
  }, [isToolPage]);

  useEffect(() => {
    if (!active) return;
    const blob = blobRef.current;
    if (!blob) return;

    // "screen" (sombre) fait vraiment briller la couleur ; "multiply"
    // (clair) donne un lavis coloré sur les sections claires sans laver
    // le texte vers le blanc. Sur le header/hero, toujours sombres, le
    // rendu reste proche dans les deux cas — cohérent avec le fait que
    // leur fond ne change pas selon le thème.
    function applyBlendForTheme() {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      blob!.style.mixBlendMode = isLight ? "multiply" : "screen";
      blob!.style.opacity = isLight ? "0.5" : "0.65";
    }
    applyBlendForTheme();
    const themeObserver = new MutationObserver(applyBlendForTheme);
    themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme"] });

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let visible = false;

    function handleMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        // Premier mouvement : pas de "vol" depuis le centre de l'écran.
        x = targetX;
        y = targetY;
        visible = true;
        blob!.style.visibility = "visible";
      }
    }
    function handleLeave() {
      visible = false;
      blob!.style.visibility = "hidden";
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);

    let raf = 0;
    function tick() {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      blob!.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={blobRef}
      aria-hidden="true"
      style={{ visibility: "hidden" }}
      className="pointer-events-none fixed left-0 top-0 z-[9998] h-[30rem] w-[30rem] rounded-full blur-[70px]"
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background:
            "radial-gradient(circle, #ffb347 0%, #ff4d6d 38%, #e0409e 62%, transparent 75%)",
        }}
      />
    </div>
  );
}
