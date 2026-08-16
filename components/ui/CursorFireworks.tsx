"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Petite explosion d'étincelles au clic, façon feu d'artifice (inspiré de
 * hue-code.com). Le suivi continu du curseur est porté par CursorGlow (un
 * halo de couleur plus tape-à-l'œil) — cette couche-ci ne réagit qu'aux
 * clics, pour ne pas dupliquer un effet de traînée en petits points.
 * Canvas plein écran, pointer-events: none — ne gêne jamais les
 * interactions en dessous.
 *
 * Désactivé automatiquement :
 * - si l'utilisateur préfère moins de mouvement (prefers-reduced-motion)
 * - sur les appareils tactiles / sans souris précise (hover: none)
 * - sur les pages "outil" (dashboard, outreach, embed) où l'effet ferait
 *   plus gadget que premium et distrairait pendant la saisie.
 */

// Canvas fillStyle ne résout pas var(...) : on duplique ici les valeurs
// hexadécimales des tokens --spark-* de globals.css. Deux palettes car le
// rendu additif ("lighter", cf. tick()) qui fait le glow sur fond sombre
// délaverait des teintes claires sur fond clair — palette plus saturée /
// foncée là où le thème est clair, avec un mélange normal plutôt qu'additif.
const SPARK_COLORS_DARK = ["#c9a66b", "#ddc08a", "#f5c99b", "#ff9f6b", "#4ade80", "#f5f3ee"];
const SPARK_COLORS_LIGHT = ["#a9793a", "#c9a66b", "#c2703f", "#b3453c", "#15803d", "#3d5a6c"];

const EXCLUDED_PREFIXES = ["/dashboard", "/outreach", "/embed"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

export function CursorFireworks() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const MAX_PARTICLES = 240;
    let particles: Particle[] = [];

    let isLight = document.documentElement.getAttribute("data-theme") === "light";
    const themeObserver = new MutationObserver(() => {
      isLight = document.documentElement.getAttribute("data-theme") === "light";
    });
    themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme"] });

    function pickColor() {
      const palette = isLight ? SPARK_COLORS_LIGHT : SPARK_COLORS_DARK;
      return palette[Math.floor(Math.random() * palette.length)];
    }

    function spawnBurst(x: number, y: number) {
      const count = 26 + Math.floor(Math.random() * 16);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
        const speed = 1.6 + Math.random() * 3.4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 46 + Math.random() * 28,
          size: 1.5 + Math.random() * 2.4,
          color: pickColor(),
        });
      }
      const cap = MAX_PARTICLES * 1.5;
      if (particles.length > cap) particles.splice(0, particles.length - cap);
    }

    function handleDown(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      spawnBurst(e.clientX, e.clientY);
    }

    window.addEventListener("pointerdown", handleDown, { passive: true });

    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, width, height);
      // Additif sur fond sombre (vrai effet "braise" qui brille) ; mélange
      // normal sur fond clair (l'additif délave vers le blanc et rend les
      // étincelles invisibles sur une page claire).
      ctx!.globalCompositeOperation = isLight ? "source-over" : "lighter";

      particles = particles.filter((p) => p.life < p.maxLife);
      for (const p of particles) {
        p.life += 1;
        p.vy += 0.05;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        const t = p.life / p.maxLife;
        const alpha = Math.max(1 - t, 0);
        const radius = Math.max(p.size * (1 - t * 0.15), 0);

        ctx!.beginPath();
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = isLight ? alpha * 0.85 : alpha;
        ctx!.shadowColor = p.color;
        ctx!.shadowBlur = 11;
        ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", handleDown);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
