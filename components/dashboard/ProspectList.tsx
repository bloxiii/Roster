import Link from "next/link";

type ProspectRow = {
  id: string;
  qualification: string;
  data: Record<string, unknown>;
  created_at: string;
};

const QUAL_STYLES: Record<string, string> = {
  HOT: "border-status bg-status/10 text-status",
  WARM: "border-amber-400 bg-amber-400/10 text-amber-400",
  COLD: "border-paper-dim/40 bg-paper-dim/10 text-paper-dim",
};

const QUAL_LABELS: Record<string, string> = {
  HOT: "Hot",
  WARM: "Warm",
  COLD: "Cold",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export function ProspectList({
  prospects,
  activeFilter,
  locale,
}: {
  prospects: ProspectRow[];
  activeFilter: string | null;
  locale: string;
}) {
  const filters: { key: string | null; label: string; count: number }[] = [
    { key: null, label: "Tous", count: prospects.length },
  ];

  const counts = { HOT: 0, WARM: 0, COLD: 0 };
  prospects.forEach((p) => {
    if (p.qualification in counts) {
      counts[p.qualification as keyof typeof counts]++;
    }
  });
  filters.push(
    { key: "HOT", label: "Hot", count: counts.HOT },
    { key: "WARM", label: "Warm", count: counts.WARM },
    { key: "COLD", label: "Cold", count: counts.COLD },
  );

  const filtered = activeFilter
    ? prospects.filter((p) => p.qualification === activeFilter)
    : prospects;

  return (
    <div>
      <div className="flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.key ?? "all"}
            href={f.key ? `/${locale}/dashboard?q=${f.key}` : `/${locale}/dashboard`}
            className={`rounded-full px-4 py-2 font-mono text-xs transition-colors ${
              activeFilter === f.key
                ? "bg-brass text-ink"
                : "border border-border text-paper-dim hover:border-brass/40 hover:text-paper"
            }`}
          >
            {f.label} ({f.count})
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-paper-dim">
            Aucun prospect pour le moment.
          </p>
        )}

        {filtered.map((prospect) => {
          const data = prospect.data as Record<string, string | null>;
          const prenom = data?.prenom ?? "Prospect";
          const initial = prenom[0]?.toUpperCase() ?? "?";

          return (
            <Link
              key={prospect.id}
              href={`/${locale}/dashboard/${prospect.id}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brass/40 hover:bg-surface-hover"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/15 font-mono text-sm font-medium text-brass">
                  {initial}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-paper">{prenom}</span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                        QUAL_STYLES[prospect.qualification] ?? ""
                      }`}
                    >
                      {QUAL_LABELS[prospect.qualification] ?? prospect.qualification}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-paper-dim">
                    {data?.type_projet && <span>{data.type_projet}</span>}
                    {data?.localisation && (
                      <>
                        <span className="text-border">·</span>
                        <span>{data.localisation}</span>
                      </>
                    )}
                    {data?.budget && (
                      <>
                        <span className="text-border">·</span>
                        <span>{data.budget}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-paper-dim/60">{timeAgo(prospect.created_at)}</span>
                <svg className="h-4 w-4 text-paper-dim/40 group-hover:text-brass" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
