import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Intégration du widget — Velinova",
  description:
    "Intégrez l&apos;agent Velinova sur votre site en une seule ligne de code.",
};

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const codeSnippet = `<script
  src="https://VOTRE-DOMAINE/widget/velinova-widget.js"
  data-velinova-key="VOTRE_CLE_WIDGET">
<\/script>`;

  const codeWithOptions = `<script
  src="https://VOTRE-DOMAINE/widget/velinova-widget.js"
  data-velinova-key="VOTRE_CLE_WIDGET"
  data-velinova-position="right">
<\/script>`;

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
        <Container className="flex h-14 items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Velinova
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-brass">
              Intégration
            </span>
          </Link>
          <Link
            href="/demo"
            className="text-sm text-paper-dim transition-colors hover:text-paper"
          >
            Voir la démo →
          </Link>
        </Container>
      </header>

      <Container className="py-12">
        <div className="mx-auto max-w-2xl">
          <Eyebrow>Guide d&apos;intégration</Eyebrow>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
            Ajoutez Velinova à votre site en 30 secondes
          </h1>
          <p className="mt-4 text-base leading-relaxed text-paper-dim">
            Copiez une seule ligne de code dans votre site. Le widget apparaît
            en bas à droite et vos prospects sont qualifiés automatiquement.
          </p>

          {/* Étape 1 */}
          <div className="mt-12">
            <h2 className="flex items-center gap-3 font-display text-lg font-medium text-paper">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass/40 font-mono text-sm text-brass-bright">
                1
              </span>
              Installation minimale
            </h2>
            <p className="mt-3 text-sm text-paper-dim">
              Collez cette balise avant la fermeture{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-brass">
                &lt;/body&gt;
              </code>{" "}
              de votre site :
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface p-5 font-mono text-sm leading-relaxed text-paper-dim">
              {codeSnippet}
            </pre>
          </div>

          {/* Étape 2 */}
          <div className="mt-12">
            <h2 className="flex items-center gap-3 font-display text-lg font-medium text-paper">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass/40 font-mono text-sm text-brass-bright">
                2
              </span>
              Personnalisation (optionnel)
            </h2>
            <p className="mt-3 text-sm text-paper-dim">
              Les 3 couleurs du widget (fond, bulle du bot, bulle du visiteur) se
              règlent directement depuis <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-brass">Dashboard → Paramètres</code> —
              pas besoin de retoucher le code. Seule la position se configure ici :
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface p-5 font-mono text-sm leading-relaxed text-paper-dim">
              {codeWithOptions}
            </pre>
          </div>

          {/* Options */}
          <div className="mt-12">
            <h2 className="flex items-center gap-3 font-display text-lg font-medium text-paper">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass/40 font-mono text-sm text-brass-bright">
                3
              </span>
              Options disponibles
            </h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">
                      Attribut
                    </th>
                    <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">
                      Défaut
                    </th>
                    <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-paper-dim">
                  <tr className="border-b border-border/60">
                    <td className="px-4 py-3 font-mono text-xs text-brass">data-velinova-key</td>
                    <td className="px-4 py-3 font-mono text-xs">—</td>
                    <td className="px-4 py-3">Clé du widget (visible dans Paramètres) — récupère automatiquement vos couleurs</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="px-4 py-3 font-mono text-xs text-brass">data-velinova-position</td>
                    <td className="px-4 py-3 font-mono text-xs">right</td>
                    <td className="px-4 py-3">Position : right ou left</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="px-4 py-3 font-mono text-xs text-brass">data-velinova-api</td>
                    <td className="px-4 py-3 font-mono text-xs">auto</td>
                    <td className="px-4 py-3">URL de l&apos;API (détection automatique)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-brass">data-velinova-bg-color / -bot-color / -user-color</td>
                    <td className="px-4 py-3 font-mono text-xs">voir Paramètres</td>
                    <td className="px-4 py-3">Surcharge manuelle des 3 couleurs (prioritaire sur le dashboard)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Note technique */}
          <div className="mt-12 rounded-xl border border-brass/30 bg-brass/5 p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
              Note technique
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-paper-dim">
              Le widget utilise le Shadow DOM : ses styles sont complètement
              isolés de votre site. Il n&apos;interfère avec aucun CSS existant et
              fonctionne sur tous les navigateurs modernes. Le script pèse moins
              de 15 Ko.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
