"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Props = {
  companyName: string;
  companyId: string;
  agent: { name: string; role: string; avatar: string } | null;
  widgetKey: string;
  agentName: string;
  locale: string;
};

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-brass placeholder:text-paper-dim/40";

export function OnboardingFlow({
  companyName,
  companyId,
  agent,
  widgetKey,
  agentName,
  locale,
}: Props) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const totalSteps = 4;

  function nextStep() {
    if (step < totalSteps) setStep(step + 1);
  }

  function handleCopy() {
    const code = `<script src="https://velinova.xyz/widget/velinova-widget.js" data-velinova-key="${widgetKey}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleFinish() {
    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-10 rounded-full transition-colors ${
                i + 1 <= step ? "bg-brass" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Étape 1 — Entreprise */}
        {step === 1 && (
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Étape 1 / {totalSteps}
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold text-paper">
              Bienvenue chez Velinova 👋
            </h1>
            <p className="mt-4 text-sm text-paper-dim">
              Votre espace est prêt. Vérifions que tout est en ordre.
            </p>

            <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-left">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-paper-dim/60">
                Votre entreprise
              </h2>
              <p className="mt-3 font-display text-xl font-medium text-paper">
                {companyName}
              </p>
            </div>

            <button onClick={nextStep} className="mt-8 rounded-full bg-brass px-8 py-3 text-sm font-medium text-paper transition-colors hover:bg-brass-bright">
              Continuer
            </button>
          </div>
        )}

        {/* Étape 2 — Employé numérique */}
        {step === 2 && (
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Étape 2 / {totalSteps}
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-paper">
              Votre employé numérique
            </h1>
            <p className="mt-4 text-sm text-paper-dim">
              Voici l&apos;agent IA qui va qualifier vos prospects automatiquement.
            </p>

            <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass/15 font-mono text-xl font-semibold text-brass">
                    {agent?.avatar ?? "E"}
                  </div>
                  <div className="text-left">
                    <h3 className="font-display text-xl font-medium text-paper">
                      {agent?.name ?? "Emma"}
                    </h3>
                    <span className="text-sm text-paper-dim">
                      {agent?.role ?? "Assistante commerciale IA"}
                    </span>
                  </div>
                </div>
                <StatusBadge label="Actif" />
              </div>
            </div>

            <button onClick={nextStep} className="mt-8 rounded-full bg-brass px-8 py-3 text-sm font-medium text-paper transition-colors hover:bg-brass-bright">
              Continuer
            </button>
          </div>
        )}

        {/* Étape 3 — Personnalisation */}
        {step === 3 && (
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Étape 3 / {totalSteps}
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-paper">
              Personnalisation
            </h1>
            <p className="mt-4 text-sm text-paper-dim">
              Vous pourrez tout modifier plus tard dans les paramètres.
            </p>

            <div className="mt-10 space-y-4 text-left">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <label className="mb-1.5 block text-xs text-paper-dim">
                  Email de notification (prospects HOT / WARM)
                </label>
                <input
                  type="email"
                  placeholder="commercial@votreentreprise.com"
                  className={FIELD}
                />
                <p className="mt-1.5 text-xs text-paper-dim/60">
                  Recevez un email à chaque prospect qualifié HOT ou WARM. WhatsApp et Notion
                  sont configurables ensuite dans les paramètres.
                </p>
              </div>
            </div>

            <button onClick={nextStep} className="mt-8 rounded-full bg-brass px-8 py-3 text-sm font-medium text-paper transition-colors hover:bg-brass-bright">
              Continuer
            </button>
          </div>
        )}

        {/* Étape 4 — Installation */}
        {step === 4 && (
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Étape 4 / {totalSteps}
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-paper">
              Votre employé numérique est prêt 🎉
            </h1>
            <p className="mt-4 text-sm text-paper-dim">
              Ajoutez cette ligne avant la balise{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-brass">
                &lt;/body&gt;
              </code>{" "}
              de votre site.
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-surface p-5 text-left">
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-paper-dim">
{`<script
  src="https://velinova.xyz/widget/velinova-widget.js"
  data-velinova-key="${widgetKey}">
</script>`}
              </pre>
            </div>

            <button
              onClick={handleCopy}
              className="mt-4 rounded-full border border-border px-6 py-2.5 text-sm text-paper-dim transition-colors hover:border-brass/60 hover:text-paper"
            >
              {copied ? "✓ Copié !" : "Copier le code"}
            </button>

            <p className="mt-6 text-xs text-paper-dim/60">
              Une fois installé, {agentName} sera actif sur votre site et
              commencera à qualifier vos prospects automatiquement.
            </p>

            <button
              onClick={handleFinish}
              className="mt-8 rounded-full bg-brass px-8 py-3 text-sm font-medium text-paper transition-colors hover:bg-brass-bright"
            >
              Accéder à mon dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
