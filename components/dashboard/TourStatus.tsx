"use client";

import { useEffect, useState } from "react";
import type { Tour } from "@/lib/tours/types";

type TourSnapshot = Pick<
  Tour,
  | "id"
  | "title"
  | "status"
  | "error"
  | "scene_url"
  | "thumbnail_url"
  | "quality"
  | "public_slug"
  | "created_at"
  | "processed_at"
>;

const PROCESSING_STEPS = [
  "Analyse de votre vidéo…",
  "Reconstruction de la scène…",
  "Génération de la visite 3D…",
];

/**
 * Poll léger (toutes les 4s) tant que le traitement n'est pas terminé.
 * Suffisant pour le MVP — Supabase Realtime remplacerait avantageusement
 * ce polling si le volume de visites simultanées devenait significatif.
 */
export function TourStatus({ tour: initialTour, locale }: { tour: TourSnapshot; locale: string }) {
  const [tour, setTour] = useState(initialTour);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (tour.status !== "processing") return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/tours/${tour.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setTour(data.tour);
      } catch {
        // Échec réseau ponctuel — on retente au prochain tick, pas de bruit UI.
      }
    }, 4000);

    // Fait défiler les 3 messages de progression pendant le traitement —
    // purement cosmétique, le vrai statut vient du poll ci-dessus.
    const cycle = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, PROCESSING_STEPS.length - 1));
    }, 8000);

    return () => {
      clearInterval(poll);
      clearInterval(cycle);
    };
  }, [tour.status, tour.id]);

  if (tour.status === "processing" || tour.status === "uploading") {
    return (
      <div className="mt-10 flex flex-col items-center rounded-2xl border border-border bg-surface py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" />
        <p className="mt-5 font-display text-lg text-paper">
          {tour.status === "uploading" ? "Envoi de la vidéo…" : PROCESSING_STEPS[stepIndex]}
        </p>
        <p className="mt-2 max-w-sm text-sm text-paper-dim">
          Ça prend généralement quelques minutes. Vous pouvez fermer cette page —
          la visite apparaîtra dans la liste dès qu&apos;elle sera prête.
        </p>
      </div>
    );
  }

  if (tour.status === "failed") {
    return (
      <div className="mt-10 rounded-2xl border border-red-400/30 bg-red-400/5 p-8">
        <h2 className="font-display text-lg text-paper">La reconstruction a échoué</h2>
        <p className="mt-2 text-sm text-paper-dim">
          {tour.error ?? "Vidéo insuffisante pour générer une reconstruction fiable."}
        </p>
        <a
          href={`/${locale}/dashboard/tours/new`}
          className="mt-5 inline-block rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Refaire une vidéo
        </a>
      </div>
    );
  }

  // ready
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/${locale}/v/${tour.public_slug}` : "";

  return (
    <div className="mt-10 rounded-2xl border border-status/30 bg-status/5 p-8 text-center">
      <svg className="mx-auto h-10 w-10 text-status" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5.5 8.2l1.8 1.8L10.7 6" />
      </svg>
      <h2 className="mt-4 font-display text-xl text-paper">Votre visite virtuelle est prête</h2>
      <a
        href={`/${locale}/v/${tour.public_slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink hover:bg-brass-bright"
      >
        Voir la visite
      </a>
      {publicUrl && (
        <p className="mt-4 break-all font-mono text-xs text-paper-dim/60">{publicUrl}</p>
      )}
    </div>
  );
}
