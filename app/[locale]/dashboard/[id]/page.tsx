import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthenticatedClient } from "@/lib/supabase/context";
import { Eyebrow } from "@/components/ui/Eyebrow";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prospect — Velin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const QUAL_STYLES: Record<string, string> = {
  HOT: "border-status bg-status/10 text-status",
  WARM: "border-amber-400 bg-amber-400/10 text-amber-400",
  COLD: "border-paper-dim/40 bg-paper-dim/10 text-paper-dim",
};

const QUAL_LABELS: Record<string, string> = {
  HOT: "Prospect chaud",
  WARM: "Prospect tiède",
  COLD: "Prospect froid",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">{label}</dt>
      <dd className="mt-1 text-sm text-paper">{value}</dd>
    </div>
  );
}

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await getAuthenticatedClient();

  // Récupérer le prospect
  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .single();

  if (!prospect || error) {
    notFound();
  }

  // Récupérer la conversation liée (si elle existe)
  let messages: { role: string; content: string }[] = [];
  if (prospect.conversation_id) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("messages")
      .eq("id", prospect.conversation_id)
      .single();

    if (conversation?.messages) {
      messages = conversation.messages as { role: string; content: string }[];
    }
  }

  const d = prospect.data as Record<string, string | null>;
  const date = new Date(prospect.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-5xl">
      {/* Retour */}
      <Link
        href={`/${locale}/dashboard/prospects`}
        className="inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-paper"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3L5 8l5 5" />
        </svg>
        Retour aux prospects
      </Link>

      {/* En-tête */}
      <div className="mt-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass/15 font-mono text-lg font-medium text-brass">
            {(d?.prenom ?? "?")[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-paper">
              {d?.prenom ?? "Prospect"}
            </h1>
            <p className="mt-0.5 text-sm text-paper-dim">{date}</p>
          </div>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${QUAL_STYLES[prospect.qualification] ?? ""}`}>
          {QUAL_LABELS[prospect.qualification] ?? prospect.qualification}
        </span>
      </div>

      {/* Notification */}
      {prospect.notified_at && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-status/10 px-3 py-2 text-xs text-status">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13.5 4.5L6 12l-3.5-3.5" />
          </svg>
          Notification envoyée
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Fiche */}
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-paper-dim/60">Informations</h2>
          <div className="mt-4 rounded-xl border border-border bg-surface p-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Projet" value={d?.type_projet} />
              <Field label="Type de bien" value={d?.type_bien} />
              <Field label="Localisation" value={d?.localisation} />
              <Field label="Surface" value={d?.surface_m2 ? `${d.surface_m2} m²` : null} />
              <Field label="Pièces" value={d?.nombre_pieces} />
              <Field label="Budget" value={d?.budget} />
              <Field label="Délai" value={d?.delai} />
              <Field label="Email" value={d?.contact_email} />
              <Field label="Téléphone" value={d?.contact_telephone} />
            </dl>
          </div>

          {prospect.summary && (
            <div className="mt-4 rounded-xl border border-border bg-surface p-5">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">Résumé</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">{prospect.summary}</p>
            </div>
          )}

          {prospect.notes && (
            <div className="mt-4 rounded-xl border border-brass/30 bg-brass/5 p-5">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-brass">Notes commerciales</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">{prospect.notes}</p>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-paper-dim/60">
            Conversation ({messages.length} messages)
          </h2>
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-paper-dim/60">
                Historique non disponible.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-md bg-brass/20 text-paper"
                        : "rounded-bl-md bg-ink-soft text-paper-dim"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
