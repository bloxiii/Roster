import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { TourViewer } from "@/components/tours/TourViewer";
import type { PublicTour } from "@/lib/tours/types";

export const dynamic = "force-dynamic";

/**
 * Scène de démonstration synthétique (public/demo/sample-scene.splat) —
 * un nuage de points généré à la main, PAS une reconstruction réelle.
 * Sert uniquement à vérifier que le viewer (chargement + navigation
 * hybride) fonctionne de bout en bout avant d'avoir une vraie visite
 * traitée par le pipeline. Voir le résumé d'implémentation pour le détail.
 */
const DEMO_TOUR: PublicTour = {
  title: "Scène de démonstration (synthétique — pas un vrai bien)",
  status: "ready",
  scene_url: "/demo/sample-scene.splat",
  thumbnail_url: null,
  waypoints: [
    { position: [0, 1.6, 3.2], lookAt: [0, 1.2, -1] },
    { position: [-1.5, 1.6, 0.5], lookAt: [-1.5, 1, -2.4] },
    { position: [1.2, 1.6, -1.2], lookAt: [0, 1, -2.5] },
  ],
};

// cache() : évite d'interroger deux fois la base (generateMetadata + la
// page elle-même appellent toutes les deux getPublicTour) et donc de
// compter deux vues pour une seule visite du lien.
const getPublicTour = cache(async (slug: string): Promise<PublicTour | null> => {
  if (slug === "demo") return DEMO_TOUR;

  const supabase = createServiceClient();
  const { data: tour } = await supabase
    .from("tours")
    .select("id, title, status, scene_url, thumbnail_url, waypoints, is_public, view_count")
    .eq("public_slug", slug)
    .single();

  if (!tour || !tour.is_public) return null;

  // Compteur best-effort, non atomique (voir même choix dans
  // /api/tours/public/[slug]) — ne bloque pas l'affichage de la page.
  void supabase
    .from("tours")
    .update({ view_count: tour.view_count + 1 })
    .eq("id", tour.id)
    .then(() => {});

  return {
    title: tour.title,
    status: tour.status,
    scene_url: tour.scene_url,
    thumbnail_url: tour.thumbnail_url,
    waypoints: tour.waypoints,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getPublicTour(slug);
  return {
    title: tour ? `${tour.title} — Visite 3D Velinova` : "Visite introuvable — Velinova",
    robots: { index: false, follow: false },
  };
}

export default async function PublicTourPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tour = await getPublicTour(slug);
  if (!tour) notFound();

  if (tour.status !== "ready" || !tour.scene_url) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6 text-center">
        <p className="text-sm text-paper-dim">Cette visite n&apos;est pas encore disponible.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ink">
      <header className="flex shrink-0 items-center justify-between border-b border-border/60 bg-ink/90 px-4 py-3 backdrop-blur-md">
        <h1 className="truncate font-display text-sm font-medium text-paper">{tour.title}</h1>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-paper-dim/50">
          Propulsé par Velinova
        </span>
      </header>
      <div className="min-h-0 flex-1">
        <TourViewer sceneUrl={tour.scene_url} waypoints={tour.waypoints} />
      </div>
    </div>
  );
}
