"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";

export function MobileMenu() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Verrouille le scroll quand le menu est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#agents", label: t("agents") },
    { href: "#use-cases", label: t("useCases") },
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#contact", label: t("contact") },
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-paper-dim transition-colors hover:text-paper"
      >
        {open ? (
          // Icône X (fermer)
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        ) : (
          // Icône hamburger
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />

          {/* Panel */}
          <nav
            aria-label="Navigation mobile"
            className="fixed inset-x-0 top-[73px] z-50 border-b border-border bg-ink-soft p-6"
          >
            <ul className="flex flex-col gap-4">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={close}
                    className="block text-lg text-paper-dim transition-colors hover:text-paper"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href="#contact"
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full bg-brass px-6 py-3 text-sm font-medium tracking-wide text-on-brass transition-colors hover:bg-brass-bright"
                >
                  {t("cta")}
                </a>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
