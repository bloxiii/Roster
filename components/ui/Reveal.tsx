"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Composant d'animation au scroll.
 * Utilise Intersection Observer pour déclencher une transition CSS
 * quand l'élément entre dans le viewport.
 *
 * Respecte prefers-reduced-motion automatiquement via CSS.
 */

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Délai avant l'animation (en ms). Utile pour le stagger. */
  delay?: number;
  /** Direction d'entrée. */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Durée de la transition en ms. */
  duration?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 700,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const translateMap = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={clsx(
        "transition-all ease-out motion-reduce:!transform-none motion-reduce:!opacity-100",
        visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${translateMap[direction]}`,
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Composant pour le stagger d'une liste d'éléments.
 * Chaque enfant reçoit un délai incrémental.
 */
export function RevealGroup({
  children,
  className,
  stagger = 100,
  direction = "up",
}: {
  children: ReactNode[];
  className?: string;
  stagger?: number;
  direction?: RevealProps["direction"];
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={i * stagger} direction={direction}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
