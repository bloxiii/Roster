"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Étincelles qui suivent le curseur + petite explosion au clic, façon feu
 * d'artifice (inspiré de hue-code.com). Canvas plein écran, pointer-events:
 * none — ne gêne jamais les interactions en dessous.
 *
 * Désactivé automatiquement :
 * - si l'utilisateur préfère moins de mouvement (prefers-reduced-motion)
 * - sur les appareils tactiles / sans souris précise (hover: none)
 * - sur les pages "outil" (dashboard, outreach, embed) où l'effet ferait
 *   plus gadget que premium et distrairait pendant la saisie.
 */

// Canvas fillStyle ne résout pas var(...) : on duplique ici les valeurs
// hexadécimales des tokens --spark-* de globals.css.
const SPARK_COLORS = ["#c9a66b", "#ddc08a", "#f5c99b", "#ff9f6b", "#4ade80", "#f5f3ee"];

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
  trail: boolean;
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

    function pickColor() {
      return SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
    }

    function spawnTrail(x: number, y: number) {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.9;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          life: 0,
          maxLife: 36 + Math.random() * 18,
          size: 1 + Math.random() * 1.6,
          color: pickColor(),
          trail: true,
        });
      }
      if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES);
      }
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
          trail: false,
        });
      }
      const cap = MAX_PARTICLES * 1.5;
      if (particles.length > cap) particles.splice(0, particles.length - cap);
    }

    let lastX = -1;
    let lastY = -1;
    let lastSpawn = 0;

    function handleMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      if (lastX < 0) {
        lastX = e.clientX;
        lastY = e.clientY;
      }
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > 6 && now - lastSpawn > 16) {
        spawnTrail(e.clientX, e.clientY);
        lastSpawn = now;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    }

    function handleDown(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      spawnBurst(e.clientX, e.clientY);
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });

    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";

      particles = particles.filter((p) => p.life < p.maxLife);
      for (const p of particles) {
        p.life += 1;
        p.vy += p.trail ? 0.012 : 0.05;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        const t = p.life / p.maxLife;
        const alpha = Math.max(1 - t, 0);
        const radius = Math.max(p.size * (p.trail ? 1 - t * 0.4 : 1 - t * 0.15), 0);

        ctx!.beginPath();
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = alpha;
        ctx!.shadowColor = p.color;
        ctx!.shadowBlur = p.trail ? 6 : 11;
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
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
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
