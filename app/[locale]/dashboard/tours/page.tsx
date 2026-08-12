import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedClient } from "@/lib/supabase/context";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Tour } from "@/lib/tours/types";

export const metadata: Metadata = {
  title: "Visites 3D — Velinova",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<Tour["status"], string> = {
  uploading: "border-paper-dim/40 bg-paper-dim/10 text-paper-dim",
  processing: "border-amber-400/30 bg-amber-400/5 text-amber-400",
  ready: "border-status/30 bg-status/10 text-status",
  failed: "border-red-400/30 bg-red-400/5 text-red-400",
};

const STATUS_LABELS: Record<Tour["status"], string> = {
  uploading: "Upload en cours",
  processing: "Traitement en cours",
  ready: "Prête",
  failed: "Échec",
};

export default async function ToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await getAuthenticatedClient();
  const { data: tours } = await supabase
    .from("tours")
    .select("id, title, address, status, created_at, thumbnail_url, view_count")
    .order("created_at", { ascending: false });

  const all = (tours ?? []) as Pick<
    Tour,
    "id" | "title" | "address" | "status" | "created_at" | "thumbnail_url" | "view_count"
  >[];

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Velinova 3D</Eyebrow>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
            Visites virtuelles
          </h1>
          <p className="mt-2 max-w-xl text-sm text-paper-dim">
            Filmez un bien avec un smartphone, Velinova génère automatiquement une
            visite 3D navigable à partager avec vos prospects.
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/tours/new`}
          className="shrink-0 rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brass-bright"
        >
          + Créer une visite 3D
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {all.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-paper-dim">Aucune visite 3D pour le moment.</p>
            <Link
              href={`/${locale}/dashboard/tours/new`}
              className="mt-4 inline-block text-sm text-brass-bright hover:underline"
            >
              Créer la première →
            </Link>
          </div>
        )}

        {all.map((tour) => (
          <Link
            key={tour.id}
            href={`/${locale}/dashboard/tours/${tour.id}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brass/40 hover:bg-surface-hover"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-soft">
                {tour.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tour.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-6 w-6 text-paper-dim/30" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M2 5.5L8 2l6 3.5v6L8 15l-6-3.5z" />
                    <path d="M2 5.5L8 9l6-3.5M8 9v6" />
                  </svg>
                )}
              </div>
              <div>
                <span className="font-medium text-paper">{tour.title}</span>
                {tour.address && <p className="mt-0.5 text-xs text-paper-dim">{tour.address}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {tour.status === "ready" && (
                <span className="font-mono text-[10px] text-paper-dim/60">{tour.view_count} vues</span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest ${STATUS_STYLES[tour.status]}`}
              >
                {tour.status === "processing" && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                )}
                {STATUS_LABELS[tour.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
