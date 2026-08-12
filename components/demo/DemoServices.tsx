import type { DemoAgencyConfig } from "@/lib/demo/types";

export function DemoServices({ agency }: { agency: DemoAgencyConfig }) {
  return (
    <section id="services" style={{ background: agency.branding.surface }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
        <div className="flex flex-wrap gap-3">
          {agency.services.map((service) => (
            <span
              key={service}
              className="rounded-full border px-4 py-2 text-xs font-medium"
              style={{ borderColor: agency.branding.accent, color: agency.branding.text }}
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
