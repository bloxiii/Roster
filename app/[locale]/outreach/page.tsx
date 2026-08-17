import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/pagination";
import { isAdminEmail } from "@/lib/admin";
import { DEFAULT_OUTREACH_TEMPLATE, SENDER, REPLY_TO } from "@/lib/outreach/email";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { OutreachManager, type OutreachTarget } from "./OutreachManager";

export const metadata: Metadata = { title: "Outreach — Velinova", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OutreachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!isAdminEmail(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold text-paper">Accès refusé</h1>
          <p className="mt-4 text-sm text-paper-dim">
            Cette page est réservée à l&apos;équipe Velinova. Si c&apos;est une erreur,
            ajoutez votre email à <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">OUTREACH_ADMIN_EMAILS</code>.
          </p>
        </div>
      </div>
    );
  }

  // Tables internes, RLS deny-by-default → lecture via le service role.
  // fetchAllRows pagine au-delà de 1000 lignes (limite par défaut de
  // Supabase/PostgREST) : sans ça, un `.select()` seul tronque
  // silencieusement la liste une fois plus de 1000 contacts en base, et
  // comme le tri est par date décroissante, ce sont les plus anciens
  // contacts qui "disparaissent" de l'affichage (ils restent en base).
  const service = createServiceClient();
  const [{ data: targets }, { data: template }] = await Promise.all([
    fetchAllRows<OutreachTarget>((from, to) =>
      service
        .from("outreach_targets")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    service.from("outreach_email_template").select("subject, body").eq("id", "default").single(),
  ]);

  return (
    <div className="min-h-screen bg-ink">
      <Container className="py-12">
        <Eyebrow>Interne — Velinova</Eyebrow>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Prospection agences immobilières
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper-dim">
          Ajoutez une agence (nom, email, site web) puis envoyez l&apos;email de
          prospection. Les emails partent de <strong className="text-paper">{SENDER}</strong> —
          les réponses arrivent sur <strong className="text-paper">{REPLY_TO}</strong>.
        </p>

        <OutreachManager
          initialTargets={targets ?? []}
          initialTemplate={template ?? DEFAULT_OUTREACH_TEMPLATE}
        />
      </Container>
    </div>
  );
}
