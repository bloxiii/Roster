import { Link } from "@/i18n/navigation";

/**
 * Bandeau discret mais toujours visible rappelant qu'il s'agit d'une
 * démonstration Velinova sur une agence entièrement fictive (nom, biens,
 * adresse — rien n'est réel), pour montrer à quoi ressemblerait Velinova
 * intégré à un vrai site d'agence immobilière.
 */
export function DemoDisclaimerBar({ agencyName }: { agencyName: string }) {
  return (
    <div className="sticky top-0 z-[1000] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-ink px-4 py-2 text-center font-mono text-[11px] leading-snug text-paper-dim">
      <span>
        <span className="text-brass">Démonstration Velinova</span> — {agencyName} est une agence
        fictive créée pour cette démo, testez le chat en bas à droite.
      </span>
      <Link href="/" className="underline decoration-brass/50 underline-offset-2 hover:text-paper">
        velinova.xyz
      </Link>
    </div>
  );
}
