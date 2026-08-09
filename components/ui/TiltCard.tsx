"use client";

import { useRef, type ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Carte avec tilt 3D qui suit le curseur — style Stripe/Linear.
 * Rotation perspective + reflet lumineux qui traque la souris.
 * Désactivé au toucher (pas d'événement mousemove) et si
 * prefers-reduced-motion.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 8,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1

    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - py) * maxTilt * 2;
      el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale3d(1.015, 1.015, 1.015)`;
      el.style.setProperty("--glare-x", `${px * 100}%`);
      el.style.setProperty("--glare-y", `${py * 100}%`);
      el.style.setProperty("--glare-opacity", "1");
    });
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)";
    el.style.setProperty("--glare-opacity", "0");
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx("relative h-full rounded-2xl", className)}
      style={{
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
      <span aria-hidden className="tilt-card-glare" />
    </div>
  );
}
