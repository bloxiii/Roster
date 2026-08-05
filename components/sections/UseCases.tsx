import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { UseCase } from "@/types";

export function UseCases() {
  const t = useTranslations("UseCases");
  const items = t.raw("items") as UseCase[];

  return (
    <section id="use-cases" className="border-t border-border/60 py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.company}
              className="flex flex-col rounded-2xl border border-border bg-surface p-6"
            >
              <h3 className="font-display text-base font-medium text-brass-bright">
                {item.company}
              </h3>

              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">
                    {t("challengeLabel")}
                  </dt>
                  <dd className="mt-1 leading-relaxed text-paper-dim">{item.challenge}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">
                    {t("solutionLabel")}
                  </dt>
                  <dd className="mt-1 leading-relaxed text-paper-dim">{item.solution}</dd>
                </div>
              </dl>

              <p className="mt-6 border-t border-border/60 pt-4 font-display text-lg font-medium text-paper">
                {item.result}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
