import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { ParticleWave } from "@/components/ui/ParticleWave";
import { TiltCard } from "@/components/ui/TiltCard";

type Point = { title: string; description: string };

export function Problem() {
  const t = useTranslations("Problem");
  const points = t.raw("points") as Point[];

  return (
    <section className="relative overflow-hidden py-32">
      <ParticleWave />
      <Container className="relative z-10">
        <Reveal animation="fade-scale" duration={1000}>
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-paper-dim md:text-lg">
              {t("description")}
            </p>
          </div>
        </Reveal>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {points.map((point, index) => (
            <Reveal key={point.title} animation="fade-scale" delay={index * 200} duration={900}>
              <TiltCard>
                <div className="h-full rounded-2xl border border-border bg-surface p-7 transition-colors duration-500 hover:border-brass/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <span className="font-mono text-xs text-paper-dim/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 font-display text-xl font-medium text-paper">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                    {point.description}
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
