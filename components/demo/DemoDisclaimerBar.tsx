import { Link } from "@/i18n/navigation";

/**
 * Bandeau discret mais toujours visible rappelant qu'il s'agit d'une
 * démonstration Velinova, pas du site officiel de l'agence — voir mission
 * "ne jamais donner l'impression que Velinova est propriétaire/partenaire".
 */
export function DemoDisclaimerBar({ agencyName }: { agencyName: string }) {
  return (
    <div className="sticky top-0 z-[1000] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-ink px-4 py-2 text-center font-mono text-[11px] leading-snug text-paper-dim">
      <span>
        <span className="text-brass">Démonstration Velinova</span> — cette page n&apos;est pas
        le site officiel de {agencyName}.
      </span>
      <Link href="/" className="underline decoration-brass/50 underline-offset-2 hover:text-paper">
        velinova.xyz
      </Link>
    </div>
  );
}
