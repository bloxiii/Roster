"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import type { Stat } from "@/types";

export function Hero() {
  const t = useTranslations("Hero");
  const stats = t.raw("stats") as Stat[];

  return (
    <section className="relative overflow-hidden bg-grid">
      {/* Glow ambiant */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brass/8 blur-[140px] animate-pulse-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-brass/5 blur-[100px]"
      />

      <Container className="relative flex flex-col items-start py-24 md:py-36">
        <Reveal delay={0} direction="up">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
        </Reveal>

        <Reveal delay={100} direction="up">
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl md:text-6xl">
            {t("title")}
          </h1>
        </Reveal>

        <Reveal delay={200} direction="up">
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-dim">
            {t("subtitle")}
          </p>
        </Reveal>

        <Reveal delay={300} direction="up">
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="#contact" className="btn-glow">{t("ctaPrimary")}</Button>
            <Button href="#agents" variant="secondary">
              {t("ctaSecondary")}
            </Button>
          </div>
        </Reveal>

        {/* Mini team preview — effet "OS futuriste" */}
        <Reveal delay={500} direction="up" duration={900}>
          <div className="mt-16 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["E", "L", "S", "M"].map((letter, i) => (
                <div
                  key={letter}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-brass/20 font-mono text-xs font-medium text-brass transition-transform hover:scale-110 hover:z-10"
                  style={{ animationDelay: `${600 + i * 100}ms` }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status" />
              </span>
              <span className="font-mono text-xs text-status">
                4 agents en ligne
              </span>
            </div>
          </div>
        </Reveal>

        {/* Stats */}
        <div className="mt-16 grid w-full grid-cols-1 gap-8 border-t border-border/60 pt-10 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={600 + i * 120} direction="up">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-paper-dim">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-brass-bright">
                  {stat.value}
                </dd>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
