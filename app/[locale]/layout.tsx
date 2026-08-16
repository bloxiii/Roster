import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CursorFireworks } from "@/components/ui/CursorFireworks";
import { CursorGlow } from "@/components/ui/CursorGlow";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL("https://velinova.xyz"),
    icons: {
      icon: "/favicon.svg",
    },
    alternates: {
      languages: { fr: "/", en: "/en" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Permet le rendu statique (SSG) des pages traduites.
  setRequestLocale(locale);

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-ink text-paper antialiased">
        {/* Pose data-theme sur <html> avant l'hydratation React, pour éviter
            tout flash du mauvais thème au chargement (voir ThemeToggle.tsx).
            Sombre par défaut (identité de marque) tant que l'utilisateur n'a
            pas explicitement choisi le clair via le toggle — on ne suit pas
            la préférence système ici, volontairement. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('velinova-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){}})();",
          }}
        />
        <NextIntlClientProvider>
          <CursorGlow />
          <CursorFireworks />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
