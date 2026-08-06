import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

type Step = { title: string; description: string };

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const steps = t.raw("steps") as Step[];

  return (
    <section id="how-it-works" className="section-glow-border relative py-36">
      <Container>
        <Reveal animation="fade-scale" duration={1000}>
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <ol className="mt-20 grid gap-16 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} animation="fade-blur" delay={index * 250} duration={1000}>
              <li className="relative pl-16">
                <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-brass/40 font-mono text-base text-brass-bright transition-all duration-500 hover:bg-brass/10 hover:scale-110">
                  {index + 1}
                </span>
                <h3 className="font-display text-xl font-medium text-paper">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                  {step.description}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
