import type { DemoAgencyConfig } from "@/lib/demo/types";

export function DemoHero({ agency }: { agency: DemoAgencyConfig }) {
  const location = agency.address ?? agency.areaDescription ?? agency.city;

  return (
    <section
      className="border-b"
      style={{ background: agency.branding.surfaceAlt, borderColor: "rgba(0,0,0,0.06)" }}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: agency.branding.accent }}
        >
          {location}
        </span>
        <h1
          className="mt-4 max-w-2xl font-serif text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl"
          style={{ color: agency.branding.text }}
        >
          {agency.tagline}
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed" style={{ color: agency.branding.textMuted }}>
          Découvrez une sélection de biens {agency.city} et environs, et échangez en direct avec
          notre assistant pour affiner votre recherche.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#biens"
            className="rounded-full px-6 py-3 text-sm font-medium"
            style={{ background: agency.branding.primary, color: agency.branding.onPrimary }}
          >
            Voir nos biens
          </a>
          <a
            href="#contact"
            className="rounded-full border px-6 py-3 text-sm font-medium"
            style={{ borderColor: agency.branding.text, color: agency.branding.text }}
          >
            Estimer mon bien
          </a>
        </div>
      </div>
    </section>
  );
}
