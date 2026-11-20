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
const HIGHLIGHTS = ["ISEP · IA", "ION Group", "Sapienza Roma", "Échecs ELO 2030"];

const SKILLS = [
  "Python",
  "PyTorch",
  "scikit-learn",
  "NLP",
  "Séries temporelles",
  "Databricks",
  "SQL",
  "OR-Tools",
];

export default async function CvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="cv-theme min-h-screen bg-ink">
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

      {/* Hero — fond dégradé + blobs, cf. aurora-blob utilisé sur la home */}
      <div className="relative overflow-hidden bg-grid">
        <div aria-hidden className="aurora-blob -left-24 -top-24 h-96 w-96 bg-brass/35" />
        <div aria-hidden className="aurora-blob -right-24 top-20 h-80 w-80 bg-slate/30" />

        <Container className="relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <Eyebrow>CV interactif</Eyebrow>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-5xl">
              Enzo Duval
            </h1>
            <p className="mt-2 max-w-xl text-base text-paper-dim">
              Data Scientist / Développeur — étudiant ingénieur à l&apos;ISEP, spécialisation IA.
              Recherche un stage de fin d&apos;études de 6 mois en data science et développement, à partir de mars 2027.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {HIGHLIGHTS.map((h) => (
                <span
                  key={h}
                  className="rounded-full border border-brass/30 bg-brass/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-brass"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-paper-dim/70">
              <span>enzo.duval99@gmail.com</span>
              <span>+33 6 30 94 67 89</span>
              <a href="https://linkedin.com/in/enzo-duval-isep" target="_blank" rel="noopener noreferrer" className="hover:text-brass">
                linkedin.com/in/enzo-duval-isep
              </a>
              <a href="https://github.com/bloxiii" target="_blank" rel="noopener noreferrer" className="hover:text-brass">
                github.com/bloxiii
              </a>
            </div>
          </div>
        </Container>
      </div>

      <Container className="pb-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          {/* Colonne gauche — compétences, résumé, projets en un coup d'œil */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-brass">Compétences</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SKILLS.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-border bg-ink-soft px-2 py-1 text-xs text-paper-dim"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-brass">En ce moment</h2>
              <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                Stage de recherche quantitative (Data Science & ML) chez ION Group à Pise — prévision de
                séries temporelles macroéconomiques, publication en cours d&apos;évaluation au Journal of Nowcasting.
              </p>
            </div>

            <p className="text-sm leading-relaxed text-paper-dim">
              Plutôt que de parcourir un PDF, posez vos questions à l&apos;agent ci-contre — il connaît mon
              parcours, mes projets et mes compétences, et répond à la première personne.
            </p>
          </div>

          {/* Colonne droite — l'agent conversationnel */}
          <div className="overflow-hidden rounded-2xl border border-border bg-ink-soft shadow-[0_0_40px_-15px_var(--color-brass)]" style={{ height: "600px" }}>
            <CvChatWidget />
          </div>
        </div>
      </Container>
    </div>
  );
}
