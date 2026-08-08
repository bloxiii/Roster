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
  await supabase.auth.getUser(); // Nécessaire pour activer le RLS
  // Requête simple sans jointure complexe
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, company_id, agent_id, prospect_id, status, messages, started_at")
    .order("started_at", { ascending: false });

  const all = conversations ?? [];

  // Récupérer les agents et prospects séparément pour éviter les erreurs de jointure
  const agentIds = [...new Set(all.map((c) => c.agent_id).filter(Boolean))];
  const prospectIds = [...new Set(all.map((c) => c.prospect_id).filter(Boolean))];

  let agentsMap: Record<string, { name: string; avatar: string }> = {};
  let prospectsMap: Record<string, { id: string; qualification: string; data: Record<string, string | null> }> = {};

  if (agentIds.length > 0) {
    const { data: agents } = await supabase
      .from("agents")
      .select("id, name, avatar")
      .in("id", agentIds);
    if (agents) {
      agentsMap = Object.fromEntries(agents.map((a) => [a.id, { name: a.name, avatar: a.avatar }]));
    }
  }

  if (prospectIds.length > 0) {
    const { data: prospects } = await supabase
      .from("prospects")
      .select("id, qualification, data")
      .in("id", prospectIds);
    if (prospects) {
      prospectsMap = Object.fromEntries(
        prospects.map((p) => [p.id, { id: p.id, qualification: p.qualification, data: p.data as Record<string, string | null> }]),
      );
    }
  }

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
          const agent = agentsMap[conv.agent_id] ?? { name: "Agent", avatar: "?" };
          const prospect = conv.prospect_id ? prospectsMap[conv.prospect_id] : null;
          const msgCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
          const prenom = prospect?.data?.prenom ?? "Visiteur";

          return (
            <div
              key={conv.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brass/40 hover:bg-surface-hover"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/15 font-mono text-sm font-medium text-brass">
                  {agent.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-paper">{prenom}</span>
                    <span className="text-xs text-paper-dim">→ {agent.name}</span>
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
