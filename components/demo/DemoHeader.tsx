import type { DemoAgencyConfig } from "@/lib/demo/types";

const NAV_ITEMS = [
  { label: "Accueil", href: "#top" },
  { label: "Nos biens", href: "#biens" },
  { label: "Nos services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

/**
 * Barre de navigation stylisée aux couleurs de l'agence — wordmark textuel
 * (pas de logo copié), structure inspirée d'un site d'agence classique.
 */
export function DemoHeader({ agency }: { agency: DemoAgencyConfig }) {
  return (
    <header
      id="top"
      className="border-b"
      style={{
        background: agency.branding.primary,
        borderColor: "rgba(0,0,0,0.08)",
      }}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-10">
        <span
          className="font-serif text-lg font-semibold tracking-tight"
          style={{ color: agency.branding.onPrimary }}
        >
          {agency.name}
        </span>
        <nav className="hidden items-center gap-7 sm:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm opacity-90 transition-opacity hover:opacity-100"
              style={{ color: agency.branding.onPrimary }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#contact"
          className="rounded-full border px-4 py-2 text-xs font-medium"
          style={{ borderColor: agency.branding.onPrimary, color: agency.branding.onPrimary }}
        >
          Nous contacter
        </a>
      </div>
    </header>
  );
}
