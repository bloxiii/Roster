import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWidget } from "@/components/agent/ChatWidget";

export const metadata: Metadata = {
  title: "Démo — Velinova",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

  // L'utilisateur DOIT être connecté pour accéder à la démo
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  let widgetKey: string | null = null;
  let agentName = "Emma";

  // Utilisateur connecté → récupérer SA widget key
  const { data: membership } = await supabase
      .from("memberships")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      const { data: wk } = await supabase
        .from("widget_keys")
        .select("key, agents(name)")
        .eq("company_id", membership.company_id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (wk) {
        widgetKey = wk.key;
        const agent = wk.agents as unknown as { name: string } | null;
        agentName = agent?.name ?? "Emma";
      }
    }

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/images/velinova-logo.svg" alt="" width={24} height={24} />
            <span className="font-display text-base font-semibold text-paper">Velinova</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass">Demo</span>
          </Link>
          <StatusBadge label="Agent actif" />
        </Container>
      </header>

      <Container className="py-10">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Démonstration en direct</Eyebrow>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
            {agentName} est prête à travailler
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper-dim">
            Mettez-vous dans la peau d&apos;un prospect. Décrivez un projet
            immobilier et observez comment {agentName} qualifie automatiquement
            la demande.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-ink-soft" style={{ height: "600px" }}>
            <ChatWidget widgetKey={widgetKey} />
          </div>

          {widgetKey && (
            <p className="mt-4 text-center font-mono text-xs text-paper-dim/40">
              Les prospects qualifiés apparaîtront dans votre dashboard.
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
