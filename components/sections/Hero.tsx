"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, AnimatedCounter } from "@/components/ui/Reveal";
// import { HeroOrb } from "@/components/ui/HeroOrb"; // Remplacé par LaptopScene
import type { Stat } from "@/types";

export function Hero() {
  const t = useTranslations("Hero");
  const stats = t.raw("stats") as Stat[];

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Grille de fond subtile */}
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />

      {/* 3D gérée par LaptopScene au niveau de la page */}

      {/* Contenu texte par-dessus la 3D */}
      <Container className="relative z-10 flex flex-col items-start py-32 md:py-0">
        <Reveal animation="fade-blur" delay={300} duration={1000}>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
        </Reveal>

        <Reveal animation="fade-scale" delay={500} duration={1200}>
          <h1 className="mt-8 max-w-3xl font-display text-5xl font-semibold leading-[1.04] tracking-tight text-paper sm:text-6xl md:text-7xl lg:text-8xl">
            {t("title")}
          </h1>
        </Reveal>

        <Reveal animation="fade-blur" delay={800} duration={1000}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper-dim md:text-xl">
            {t("subtitle")}
          </p>
        </Reveal>

        <Reveal animation="fade-up" delay={1000} duration={900}>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button href="#contact" className="btn-glow">{t("ctaPrimary")}</Button>
            <Button href="#agents" variant="secondary">{t("ctaSecondary")}</Button>
          </div>
        </Reveal>

        {/* Mini équipe */}
        <Reveal animation="fade-blur" delay={1200} duration={1100}>
          <div className="mt-20 flex items-center gap-4">
            <div className="flex -space-x-3">
              {["E", "L", "S", "M"].map((letter) => (
                <div
                  key={letter}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-brass/20 font-mono text-sm font-medium text-brass backdrop-blur-sm transition-all duration-500 hover:scale-125 hover:bg-brass/30 hover:z-10 hover:border-brass/50"
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status" />
              </span>
              <span className="font-mono text-xs text-status">4 agents en ligne</span>
            </div>
          </div>
        </Reveal>

        {/* Stats avec compteurs animés */}
        <div className="mt-24 grid w-full grid-cols-1 gap-10 border-t border-border/40 pt-12 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} animation="fade-up" delay={1400 + i * 200} duration={900}>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-paper-dim/70">{stat.label}</dt>
                <dd className="mt-3 font-display text-4xl font-semibold text-brass-bright md:text-5xl">
                  <AnimatedCounter value={stat.value} duration={2000} />
                </dd>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Indicateur de scroll */}
      <Reveal animation="fade-up" delay={2200} duration={800}>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-paper-dim/40 font-mono">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-paper-dim/30 to-transparent animate-pulse-slow" />
        </div>
      </Reveal>
    </section>
  );
}
