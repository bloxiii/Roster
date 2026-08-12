import type { DemoAgencyConfig } from "@/lib/demo/types";

export function DemoFooter({ agency }: { agency: DemoAgencyConfig }) {
  const location = agency.address ?? agency.areaDescription ?? agency.city;

  return (
    <footer
      id="contact"
      className="border-t"
      style={{ background: agency.branding.primaryDark, borderColor: "rgba(0,0,0,0.1)" }}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-serif text-lg font-semibold" style={{ color: agency.branding.surface }}>
              {agency.name}
            </span>
            <p className="mt-2 text-sm opacity-80" style={{ color: agency.branding.surface }}>
              {location}
            </p>
          </div>

          <div
            className="max-w-sm rounded-xl border border-white/15 bg-black/10 p-4 text-xs leading-relaxed opacity-90"
            style={{ color: agency.branding.surface }}
          >
            Un assistant Velinova est intégré en bas à droite de cette page — testez-le en lui
            décrivant un projet immobilier. En savoir plus sur{" "}
            <a href="https://velinova.xyz" className="underline underline-offset-2">
              velinova.xyz
            </a>
            .
          </div>
        </div>

        <p className="mt-10 text-[11px] opacity-50" style={{ color: agency.branding.surface }}>
          {agency.name} est une agence fictive créée par Velinova à des fins de démonstration —
          biens, adresse et informations affichées ici ne sont pas réels.
        </p>
      </div>
    </footer>
  );
}
