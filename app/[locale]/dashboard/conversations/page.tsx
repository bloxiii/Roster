import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "@/components/ui/Eyebrow";
import Link from "next/link";

export const metadata: Metadata = { title: "Conversations — Velin", robots: { index: false } };
export const dynamic = "force-dynamic";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, agents(name, avatar), prospects(id, qualification, data)")
    .order("started_at", { ascending: false });

  const all = conversations ?? [];

  return (
    <div className="max-w-5xl">
      <Eyebrow>Conversations</Eyebrow>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
        Historique des conversations
      </h1>

      <div className="mt-8 space-y-3">
        {all.length === 0 && (
          <p className="py-12 text-center text-sm text-paper-dim">
            Aucune conversation pour le moment.
          </p>
        )}

        {all.map((conv) => {
          const agent = conv.agents as unknown as { name: string; avatar: string } | null;
          const prospect = conv.prospects as unknown as {
            id: string;
            qualification: string;
            data: Record<string, string | null>;
          } | null;
          const msgCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
          const prenom = prospect?.data?.prenom ?? "Visiteur";

          return (
            <div
              key={conv.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brass/40 hover:bg-surface-hover"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/15 font-mono text-sm font-medium text-brass">
                  {agent?.avatar ?? "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-paper">{prenom}</span>
                    <span className="text-xs text-paper-dim">
                      → {agent?.name ?? "Agent"}
                    </span>
                    {prospect && (
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                        prospect.qualification === "HOT" ? "border-status bg-status/10 text-status" :
                        prospect.qualification === "WARM" ? "border-amber-400 bg-amber-400/10 text-amber-400" :
                        "border-paper-dim/40 bg-paper-dim/10 text-paper-dim"
                      }`}>
                        {prospect.qualification}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-paper-dim">
                    {msgCount} messages · {conv.status === "completed" ? "Terminée" : "En cours"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-paper-dim/60">{timeAgo(conv.started_at)}</span>
                {prospect && (
                  <Link
                    href={`/${locale}/dashboard/${prospect.id}`}
                    className="text-xs text-brass-bright hover:underline"
                  >
                    Voir fiche
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
