"use client";

import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { clsx } from "clsx";

/**
 * Composant d'animation premium style Apple.
 * Effets cinématiques : scale, blur, translate, opacity.
 * Transitions lentes et délibérées (800-1200ms).
 */

type AnimationType = 
  | "fade-up"       // Classique fade + translate Y
  | "fade-scale"    // Scale 0.85→1 + fade (style Apple hero)
  | "fade-blur"     // Blur 12px→0 + fade (style Apple product)
  | "slide-right"   // Slide depuis la gauche
  | "slide-left"    // Slide depuis la droite
  | "zoom-in"       // Scale 0.6→1 + fade (dramatique)
  | "reveal-up"     // Clip-path reveal du bas vers le haut
  | "none";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: AnimationType;
  duration?: number;
  once?: boolean;
};

const ANIMATION_STYLES: Record<AnimationType, { hidden: CSSProperties; visible: CSSProperties }> = {
  "fade-up": {
    hidden: { opacity: 0, transform: "translateY(60px)" },
    visible: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-scale": {
    hidden: { opacity: 0, transform: "scale(0.88) translateY(30px)", filter: "blur(4px)" },
    visible: { opacity: 1, transform: "scale(1) translateY(0)", filter: "blur(0px)" },
  },
  "fade-blur": {
    hidden: { opacity: 0, filter: "blur(16px)", transform: "translateY(20px)" },
    visible: { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" },
  },
  "slide-right": {
    hidden: { opacity: 0, transform: "translateX(-80px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
  "slide-left": {
    hidden: { opacity: 0, transform: "translateX(80px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
  "zoom-in": {
    hidden: { opacity: 0, transform: "scale(0.6)", filter: "blur(8px)" },
    visible: { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
  },
  "reveal-up": {
    hidden: { opacity: 0, clipPath: "inset(100% 0 0 0)", transform: "translateY(20px)" },
    visible: { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "translateY(0)" },
  },
  "none": {
    hidden: {},
    visible: {},
  },
};

export function Reveal({
  children,
  className,
  delay = 0,
  animation = "fade-up",
  duration = 900,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Vérifier prefers-reduced-motion
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motionOk) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const styles = ANIMATION_STYLES[animation];
  const currentStyle: CSSProperties = {
    ...(visible ? styles.visible : styles.hidden),
    transitionProperty: "opacity, transform, filter, clip-path",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // ease-out-expo (Apple)
    transitionDelay: `${delay}ms`,
    willChange: visible ? "auto" : "opacity, transform",
  };

  return (
    <div ref={ref} className={className} style={currentStyle}>
      {children}
    </div>
  );
}

/**
 * Compteur animé — les chiffres montent progressivement.
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1500,
  className,
}: {
  value: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          
          // Extraire le nombre de la valeur
          const numMatch = value.match(/-?\d+/);
          if (!numMatch) {
            setDisplayed(value);
            return;
          }
          
          const target = parseInt(numMatch[0], 10);
          const nonNumeric = value.replace(/-?\d+/, "{{NUM}}");
          const start = Date.now();
          
          const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            setDisplayed(nonNumeric.replace("{{NUM}}", String(current)));
            
            if (progress < 1) requestAnimationFrame(animate);
            else setDisplayed(value);
          };
          
          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayed}{suffix}
    </span>
  );
}
