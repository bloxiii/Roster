import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getAuthenticatedClient } from "@/lib/supabase/context";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = { title: "Agents IA — Velinova", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await getAuthenticatedClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: true });

  // Stats par agent
  const agentStats = await Promise.all(
    (agents ?? []).map(async (agent) => {
      const { count: convCount } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id);

      const { count: prospectCount } = await supabase
        .from("prospects")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id);

      const { count: hotCount } = await supabase
        .from("prospects")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("qualification", "HOT");

      return {
        ...agent,
        conversations: convCount ?? 0,
        prospects: prospectCount ?? 0,
        hot: hotCount ?? 0,
      };
    }),
  );

  return (
    <div className="max-w-5xl">
      <Eyebrow>Agents IA</Eyebrow>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
        Vos employés numériques
      </h1>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {agentStats.map((agent) => (
          <div
            key={agent.id}
            className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-brass/40 hover:bg-surface-hover"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass/15 font-mono text-xl font-semibold text-brass">
                  {agent.avatar}
                </div>
                <div>
                  <h3 className="font-display text-xl font-medium text-paper">
                    {agent.name}
                  </h3>
                  <span className="text-sm text-paper-dim">{agent.role}</span>
                </div>
              </div>
              <StatusBadge
                label={agent.status === "active" ? "Actif" : "Pause"}
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border/60 pt-5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/50">
                  Conversations
                </span>
                <p className="mt-1 font-display text-lg font-semibold text-paper">
                  {agent.conversations}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/50">
                  Prospects
                </span>
                <p className="mt-1 font-display text-lg font-semibold text-paper">
                  {agent.prospects}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-status/50">
                  Hot
                </span>
                <p className="mt-1 font-display text-lg font-semibold text-status">
                  {agent.hot}
                </p>
              </div>
            </div>
          </div>
        ))}

        {(agents ?? []).length === 0 && (
          <p className="col-span-2 py-12 text-center text-sm text-paper-dim">
            Aucun agent configuré.
          </p>
        )}
      </div>
    </div>
  );
}
