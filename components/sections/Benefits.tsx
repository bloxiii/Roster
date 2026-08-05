import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

type Benefit = { title: string; description: string };

export function Benefits() {
  const t = useTranslations("Benefits");
  const items = t.raw("items") as Benefit[];

  return (
    <section className="border-t border-border/60 bg-ink-soft py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.title} className="bg-ink-soft p-6">
              <h3 className="font-display text-base font-medium text-brass-bright">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
