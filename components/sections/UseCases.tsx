import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import type { UseCase } from "@/types";

export function UseCases() {
  const t = useTranslations("UseCases");
  const items = t.raw("items") as UseCase[];

  return (
    <section id="use-cases" className="border-t border-border/60 py-32">
      <Container>
        <Reveal animation="fade-scale" duration={1000}>
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <div className="mt-20 grid gap-6 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.company} animation="fade-scale" delay={i * 200} duration={1000}>
              <TiltCard>
                <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7 transition-colors duration-500 hover:border-brass/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <h3 className="font-display text-base font-medium text-brass-bright">{item.company}</h3>
                  <dl className="mt-6 space-y-5 text-sm">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/50">{t("challengeLabel")}</dt>
                      <dd className="mt-1.5 leading-relaxed text-paper-dim">{item.challenge}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/50">{t("solutionLabel")}</dt>
                      <dd className="mt-1.5 leading-relaxed text-paper-dim">{item.solution}</dd>
                    </div>
                  </dl>
                  <p className="mt-auto pt-6 border-t border-border/60 font-display text-lg font-medium text-paper">{item.result}</p>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
