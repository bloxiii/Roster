import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Link } from "@/i18n/navigation";
import { CvChatWidget } from "@/components/cv/CvChatWidget";

export const metadata: Metadata = {
  title: "Enzo Duval — CV interactif",
  description: "Discutez avec un agent IA entraîné sur le parcours d'Enzo Duval, au lieu de lire un CV statique.",
  // Page perso non destinée à être indexée ni liée depuis la navigation du
  // site Velinova — même convention que /v/[slug] (visites 3D publiques).
  robots: { index: false, follow: false },
};

/**
 * /cv — proof of concept personnel : un CV sous forme d'agent conversationnel
 * plutôt qu'un PDF statique. Volontairement non linkée dans la nav du site
 * Velinova (page perso, pas une fonctionnalité produit) — lien à partager
 * directement (candidatures, LinkedIn).
 */
export default async function CvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" width={24} height={24} />
            <span className="font-display text-base font-semibold text-paper">Velinova</span>
          </Link>
          <a
            href="/cv/CV_Enzo_Duval.pdf"
            download
            className="font-mono text-xs uppercase tracking-widest text-brass hover:text-brass-bright"
          >
            Télécharger le PDF
          </a>
        </Container>
      </header>

      <Container className="py-10">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>CV interactif</Eyebrow>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
            Enzo Duval
          </h1>
          <p className="mt-1 text-sm text-paper-dim">
            Data Scientist / Développeur — étudiant ingénieur à l&apos;ISEP, spécialisation IA.
            Recherche un stage de fin d&apos;études de 6 mois en data science et développement, à partir de mars 2027.
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-paper-dim/70">
            <span>enzo.duval99@gmail.com</span>
            <span>+33 6 30 94 67 89</span>
            <a href="https://linkedin.com/in/enzo-duval-isep" target="_blank" rel="noopener noreferrer" className="hover:text-brass">
              linkedin.com/in/enzo-duval-isep
            </a>
            <a href="https://github.com/bloxiii" target="_blank" rel="noopener noreferrer" className="hover:text-brass">
              github.com/bloxiii
            </a>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-paper-dim">
            Plutôt que de parcourir un PDF, posez directement vos questions à l&apos;agent ci-dessous —
            il connaît mon parcours, mes projets et mes compétences, et répond à la première personne.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-ink-soft" style={{ height: "600px" }}>
            <CvChatWidget />
          </div>
        </div>
      </Container>
    </div>
  );
}
