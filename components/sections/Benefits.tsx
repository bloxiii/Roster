import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

type Benefit = { title: string; description: string };

export function Benefits() {
  const t = useTranslations("Benefits");
  const items = t.raw("items") as Benefit[];

  return (
    <section className="border-t border-border/60 bg-ink-soft py-32">
      <Container>
        <Reveal animation="fade-scale" duration={1000}>
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <Reveal animation="fade-blur" delay={300} duration={1100}>
          <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {items.map((item) => (
              <div key={item.title} className="bg-ink-soft p-7 transition-all duration-400 hover:bg-surface">
                <h3 className="font-display text-base font-medium text-brass-bright">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{item.description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
