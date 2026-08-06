import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ChatWidget } from "@/components/agent/ChatWidget";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Agent #001 — Qualification commerciale | Velin",
    description:
      "Démonstration en direct de l'agent de qualification commerciale Velin pour agences immobilières.",
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-ink">
      {/* Header minimal */}
      <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Velin
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass">
              Demo
            </span>
          </Link>
          <StatusBadge label="Agent actif" />
        </Container>
      </header>

      <Container className="py-10">
        <div className="mx-auto max-w-3xl">
          {/* Contexte de la démo */}
          <div className="mb-8">
            <Eyebrow>Agent #001 · Qualification commerciale</Eyebrow>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Votre employé numérique en action
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper-dim">
              Cet agent accueille vos prospects, comprend leur projet immobilier,
              qualifie leur niveau d&apos;intérêt et génère une fiche exploitable pour
              vos commerciaux — 24 heures sur 24, 7 jours sur 7.
            </p>
          </div>

          {/* Chat widget */}
          <div className="overflow-hidden rounded-2xl border border-border bg-ink-soft" style={{ height: "600px" }}>
            <ChatWidget />
          </div>

          {/* Légende */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-paper-dim/60">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-status" />
              HOT — Prospect qualifié, prêt à acheter
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              WARM — Projet réel, critères à affiner
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-paper-dim/40" />
              COLD — Simple curiosité
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
}
