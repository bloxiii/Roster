import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const t = useTranslations("Nav");

  const links = [
    { href: "#agents", label: t("agents") },
    { href: "#use-cases", label: t("useCases") },
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-ink/85 backdrop-blur-md">
      <Container className="flex h-18 items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/images/velin-logo.svg" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-display text-lg font-semibold tracking-tight text-paper">
            Velin
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-paper-dim transition-colors hover:text-paper"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/demo"
            className="hidden text-sm text-paper-dim transition-colors hover:text-paper sm:inline"
          >
            {t("demo")}
          </Link>
          <Button href="#contact" className="hidden sm:inline-flex">
            {t("cta")}
          </Button>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
