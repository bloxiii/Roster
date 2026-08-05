import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

type Step = { title: string; description: string };

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const steps = t.raw("steps") as Step[];

  return (
    <section id="how-it-works" className="border-t border-border/60 py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative pl-14">
              <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-brass/40 font-mono text-sm text-brass-bright">
                {index + 1}
              </span>
              <h3 className="font-display text-lg font-medium text-paper">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
