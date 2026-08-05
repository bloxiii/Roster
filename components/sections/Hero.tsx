import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Stat } from "@/types";

export function Hero() {
  const t = useTranslations("Hero");
  const stats = t.raw("stats") as Stat[];

  return (
    <section className="relative overflow-hidden bg-grid">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brass/10 blur-[120px]"
      />

      <Container className="relative flex flex-col items-start py-24 md:py-32">
        <Eyebrow>{t("eyebrow")}</Eyebrow>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-paper sm:text-5xl md:text-6xl">
          {t("title")}
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-dim">
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button href="#contact">{t("ctaPrimary")}</Button>
          <Button href="#agents" variant="secondary">
            {t("ctaSecondary")}
          </Button>
        </div>

        <dl className="mt-20 grid w-full grid-cols-1 gap-8 border-t border-border/60 pt-10 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="font-mono text-xs uppercase tracking-widest text-paper-dim">
                {stat.label}
              </dt>
              <dd className="mt-2 font-display text-3xl font-semibold text-brass-bright">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
