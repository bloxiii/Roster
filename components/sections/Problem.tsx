import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

type Point = { title: string; description: string };

export function Problem() {
  const t = useTranslations("Problem");
  const points = t.raw("points") as Point[];

  return (
    <section className="py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-paper-dim">
            {t("description")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {points.map((point, index) => (
            <div
              key={point.title}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <span className="font-mono text-xs text-paper-dim/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-lg font-medium text-paper">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
