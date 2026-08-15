"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="Choix de la langue / Language switch"
      className="flex items-center gap-1 rounded-full border border-border p-1 font-mono text-xs"
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={locale === loc}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors ${
            locale === loc
              ? "bg-brass text-on-brass"
              : "text-paper-dim hover:text-paper"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
