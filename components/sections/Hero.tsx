"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, AnimatedCounter } from "@/components/ui/Reveal";
import type { Stat } from "@/types";

export function Hero() {
  const t = useTranslations("Hero");
  const stats = t.raw("stats") as Stat[];

  return (
    <section className="relative overflow-hidden bg-grid">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brass/8 blur-[160px] animate-pulse-slow" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-brass/5 blur-[120px]" />

      <Container className="relative flex flex-col items-start py-28 md:py-40">
        <Reveal animation="fade-blur" delay={0} duration={800}>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
        </Reveal>

        <Reveal animation="fade-scale" delay={150} duration={1100}>
          <h1 className="mt-8 max-w-3xl font-display text-4xl font-semibold leading-[1.06] tracking-tight text-paper sm:text-5xl md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
        </Reveal>

        <Reveal animation="fade-blur" delay={350} duration={900}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper-dim md:text-xl">
            {t("subtitle")}
          </p>
        </Reveal>

        <Reveal animation="fade-up" delay={500} duration={800}>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button href="#contact" className="btn-glow">{t("ctaPrimary")}</Button>
            <Button href="#agents" variant="secondary">{t("ctaSecondary")}</Button>
          </div>
        </Reveal>

        {/* Emplacement vidéo de démonstration */}
        <Reveal animation="fade-scale" delay={600} duration={1100}>
          <div className="mt-16 w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface/50">
            <div className="relative aspect-video flex items-center justify-center bg-ink-soft">
              {/* Remplacer ce placeholder par une vraie vidéo :
                  <video src="/demo.mp4" controls poster="/demo-poster.jpg" /> 
                  ou un embed YouTube/Loom */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brass/20">
                  <svg className="h-6 w-6 text-brass" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-paper-dim/60">
                  Vidéo de démonstration
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal animation="fade-blur" delay={700} duration={1000}>
          <div className="mt-20 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {["E", "L", "S", "M"].map((letter) => (
                <div key={letter} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-brass/20 font-mono text-sm font-medium text-brass transition-all duration-300 hover:scale-110 hover:bg-brass/30 hover:z-10">
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status" />
              </span>
              <span className="font-mono text-xs text-status">4 agents en ligne</span>
            </div>
          </div>
        </Reveal>

        <div className="mt-20 grid w-full grid-cols-1 gap-10 border-t border-border/60 pt-12 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} animation="fade-up" delay={800 + i * 150} duration={900}>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-paper-dim">{stat.label}</dt>
                <dd className="mt-3 font-display text-4xl font-semibold text-brass-bright">
                  <AnimatedCounter value={stat.value} duration={1800} />
                </dd>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
