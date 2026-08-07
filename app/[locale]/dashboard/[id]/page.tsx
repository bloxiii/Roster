import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProspectDetail } from "@/components/dashboard/ProspectDetail";

export const metadata: Metadata = {
  title: "Prospect — Velin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const ctx = await getUserContext(locale);
  const supabase = await createClient();

  // RLS garantit l'isolation — un user ne peut voir que les prospects de sa company
  const { data: prospect } = await supabase
    .from("prospects")
    .select("*, conversations(*)")
    .eq("id", id)
    .single();

  if (!prospect) {
    notFound();
  }

  // Adapter le format pour le composant ProspectDetail existant
  const record = {
    id: prospect.id,
    agentId: prospect.agent_id,
    clientId: prospect.company_id,
    createdAt: prospect.created_at,
    data: prospect.data,
    conversation: prospect.conversations?.messages ?? [],
    conversationLength: prospect.conversations?.messages?.length ?? 0,
    notifiedAt: prospect.notified_at,
  };

  return (
    <div className="min-h-screen bg-ink">
      <DashboardHeader companyName={ctx.companyName} userName={ctx.userName} />
      <Container className="py-10">
        <ProspectDetail prospect={record} locale={locale} />
      </Container>
    </div>
  );
}
