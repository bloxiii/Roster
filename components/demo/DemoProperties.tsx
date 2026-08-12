import type { DemoAgencyConfig, DemoProperty } from "@/lib/demo/types";

function PropertyCard({ property, agency }: { property: DemoProperty; agency: DemoAgencyConfig }) {
  const details = [
    property.rooms ? `${property.rooms} pièces` : null,
    property.bedrooms ? `${property.bedrooms} ch.` : null,
    `${property.surfaceM2} m²`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-6"
      style={{ borderColor: "rgba(0,0,0,0.08)", background: agency.branding.surface }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: agency.branding.surfaceAlt, color: agency.branding.text }}
        >
          {property.type} · {property.transaction === "location" ? "Location" : "Vente"}
        </span>
        <span className="text-right font-serif text-lg font-semibold" style={{ color: agency.branding.text }}>
          {property.price}
        </span>
      </div>

      <h3 className="mt-4 font-serif text-base font-medium" style={{ color: agency.branding.text }}>
        {property.title}
      </h3>
      <p className="mt-1 text-xs" style={{ color: agency.branding.textMuted }}>
        {property.city} · {details}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: agency.branding.textMuted }}>
        {property.description}
      </p>

      {property.sourceUrl && (
        <a
          href={property.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-xs underline underline-offset-2"
          style={{ color: agency.branding.accent }}
        >
          Voir ce type de bien sur le site de l&apos;agence ↗
        </a>
      )}
    </div>
  );
}

export function DemoProperties({ agency }: { agency: DemoAgencyConfig }) {
  return (
    <section id="biens" style={{ background: agency.branding.surfaceAlt }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: agency.branding.accent }}>
          Sélection
        </span>
        <h2 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl" style={{ color: agency.branding.text }}>
          Quelques biens {agency.city}
        </h2>
        <p className="mt-2 max-w-xl text-sm" style={{ color: agency.branding.textMuted }}>
          Échantillon à titre d&apos;exemple pour cette démonstration — pas le catalogue complet
          de l&apos;agence.
        </p>

        {agency.properties.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agency.properties.map((property) => (
              <PropertyCard key={property.title} property={property} agency={agency} />
            ))}
          </div>
        ) : (
          <div
            className="mt-8 rounded-2xl border p-8 text-sm leading-relaxed"
            style={{ borderColor: "rgba(0,0,0,0.08)", background: agency.branding.surface, color: agency.branding.textMuted }}
          >
            {agency.noCatalogNote}
          </div>
        )}
      </div>
    </section>
  );
}
