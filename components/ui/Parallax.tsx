"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ParallaxProps = {
  children: ReactNode;
  speed?: number; // -1 à 1 : négatif = plus lent, positif = plus rapide
  className?: string;
};

/**
 * Wrapper de parallax au scroll.
 * L'élément se déplace plus lentement ou plus vite que le scroll normal,
 * créant un effet de profondeur spatial.
 */
export function Parallax({ children, speed = 0.2, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motionOk) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const el = ref.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const viewCenter = window.innerHeight / 2;
          const delta = (center - viewCenter) * speed;
          setOffset(delta);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
        transition: "transform 0.1s linear",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
