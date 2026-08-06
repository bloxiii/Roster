import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

type Point = { title: string; description: string };

export function Problem() {
  const t = useTranslations("Problem");
  const points = t.raw("points") as Point[];

  return (
    <section className="py-24">
      <Container>
        <Reveal>
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-paper-dim">
              {t("description")}
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {points.map((point, index) => (
            <Reveal key={point.title} delay={index * 120}>
              <div className="rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-brass/30 hover:-translate-y-1">
                <span className="font-mono text-xs text-paper-dim/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-paper">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                  {point.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
