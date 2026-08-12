import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TourUploadForm } from "@/components/dashboard/TourUploadForm";

export const metadata: Metadata = {
  title: "Créer une visite 3D — Velinova",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const GUIDELINES = [
  "Un seul plan continu, sans coupure — enchaînez toutes les pièces sans arrêter puis relancer l'enregistrement.",
  "Marchez lentement (l'équivalent d'une visite guidée), tenez le téléphone stable à hauteur de poitrine.",
  "Restez à 1,5–3 m des murs ; approchez-vous à 0,5–1 m pour un point d'intérêt précis.",
  "Allumez toutes les lumières et ouvrez toutes les portes avant de commencer à filmer.",
  "Évitez de cadrer un miroir ou une fenêtre en contre-jour plus de 2–3 secondes.",
  "Comptez 30 à 45 secondes par pièce — 2 à 5 minutes au total pour un bien de taille moyenne.",
];

export default async function NewTourPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-3xl">
      <Link
        href={`/${locale}/dashboard/tours`}
        className="inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-paper"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3L5 8l5 5" />
        </svg>
        Retour aux visites
      </Link>

      <div className="mt-6">
        <Eyebrow>Nouvelle visite 3D</Eyebrow>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-paper">
        Filmez le bien
      </h1>
      <p className="mt-2 text-sm text-paper-dim">
        Une seule vidéo suffit — Velinova s&apos;occupe de tout le reste automatiquement.
      </p>

      <div className="mt-6 rounded-xl border border-brass/30 bg-brass/5 p-5">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-brass">
          Pour un bon résultat
        </h2>
        <ul className="mt-3 space-y-2">
          {GUIDELINES.map((g, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-paper-dim">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brass" />
              {g}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-paper-dim/60">
          Si une séquence est insuffisante (trop rapide, trop sombre…), Velinova vous le
          signalera après analyse et vous indiquera précisément quoi refilmer.
        </p>
      </div>

      <TourUploadForm locale={locale} />
    </div>
  );
}
