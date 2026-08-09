import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-ink-soft">
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/images/velinova-logo.svg" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="font-display text-lg font-semibold text-paper">Velinova</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-paper-dim">{t("tagline")}</p>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-paper-dim">
            {t("navTitle")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="#agents" className="text-paper-dim hover:text-paper">
                {nav("agents")}
              </a>
            </li>
            <li>
              <a href="#use-cases" className="text-paper-dim hover:text-paper">
                {nav("useCases")}
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="text-paper-dim hover:text-paper">
                {nav("howItWorks")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-paper-dim">
            {t("contactTitle")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="mailto:contact@velinova.xyz" className="text-paper-dim hover:text-paper">
                contact@velinova.xyz
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-border/60 py-6 text-xs text-paper-dim/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {year} Velinova. {t("rights")}
        </span>
        <a href="/legal" className="text-paper-dim/50 hover:text-paper-dim transition-colors">
          Mentions légales & Confidentialité
        </a>
      </Container>
    </footer>
  );
}
