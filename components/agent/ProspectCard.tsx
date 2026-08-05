"use client";

import type { ProspectData } from "@/lib/agent/types";

const QUALIFICATION_STYLES = {
  HOT: "border-status bg-status/10 text-status",
  WARM: "border-amber-400 bg-amber-400/10 text-amber-400",
  COLD: "border-paper-dim/40 bg-paper-dim/10 text-paper-dim",
} as const;

const QUALIFICATION_LABELS = {
  HOT: "Prospect chaud",
  WARM: "Prospect tiède",
  COLD: "Prospect froid",
} as const;

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-paper">{value}</dd>
    </div>
  );
}

export function ProspectCard({ data, onClose }: { data: ProspectData; onClose?: () => void }) {
  const qualStyle = QUALIFICATION_STYLES[data.qualification];
  const qualLabel = QUALIFICATION_LABELS[data.qualification];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim/60">
            Fiche prospect
          </span>
          <h3 className="mt-1 font-display text-lg font-medium text-paper">
            {data.prenom ?? "Prospect"}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${qualStyle}`}
        >
          {qualLabel}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Projet" value={data.type_projet} />
        <Field label="Type de bien" value={data.type_bien} />
        <Field label="Localisation" value={data.localisation} />
        <Field label="Surface" value={data.surface_m2 ? `${data.surface_m2} m²` : null} />
        <Field label="Pièces" value={data.nombre_pieces} />
        <Field label="Budget" value={data.budget} />
        <Field label="Délai" value={data.delai} />
        <Field label="Email" value={data.contact_email} />
        <Field label="Téléphone" value={data.contact_telephone} />
      </dl>

      {data.resume && (
        <div className="mt-5 border-t border-border/60 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">
            Résumé
          </span>
          <p className="mt-1 text-sm leading-relaxed text-paper-dim">{data.resume}</p>
        </div>
      )}

      {data.notes_commerciales && (
        <div className="mt-4 rounded-lg bg-ink-soft p-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-brass">
            Notes pour le commercial
          </span>
          <p className="mt-1 text-sm leading-relaxed text-paper-dim">
            {data.notes_commerciales}
          </p>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full border border-border py-2.5 text-sm text-paper-dim transition-colors hover:border-brass/60 hover:text-paper"
        >
          Nouvelle conversation
        </button>
      )}
    </div>
  );
}
