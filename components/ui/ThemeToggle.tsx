"use client";

import { useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "velinova-theme";

type Theme = "dark" | "light";

/**
 * Bascule clair/sombre. Le thème réel est déjà posé sur <html> avant
 * l'hydratation par le script anti-flash (voir layout.tsx) — ce composant
 * ne fait que refléter/écrire cet état, avec un rendu par défaut "sombre"
 * côté serveur pour éviter tout warning d'hydratation.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée...) — le choix ne persiste
      // simplement pas d'une session à l'autre.
    }
    setTheme(next);
  }

  const displayTheme = mounted ? theme : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={displayTheme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
      title={displayTheme === "dark" ? "Thème clair" : "Thème sombre"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-paper-dim transition-colors hover:border-brass/60 hover:text-paper"
    >
      {displayTheme === "dark" ? (
        // Icône soleil (proposer le passage en clair)
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="10" cy="10" r="3.5" />
          <path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4M15.7 15.7l-1.4-1.4M5.7 5.7L4.3 4.3" />
        </svg>
      ) : (
        // Icône lune (proposer le passage en sombre)
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 11.3A7.5 7.5 0 118.7 3a6 6 0 108.3 8.3z" />
        </svg>
      )}
    </button>
  );
}
