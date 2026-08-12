import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedClient } from "@/lib/supabase/context";
import { TourStatus } from "@/components/dashboard/TourStatus";

export const metadata: Metadata = {
  title: "Visite 3D — Velinova",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await getAuthenticatedClient();
  const { data: tour, error } = await supabase
    .from("tours")
    .select(
      "id, title, status, error, scene_url, thumbnail_url, quality, public_slug, created_at, processed_at",
    )
    .eq("id", id)
    .single();

  if (!tour || error) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/dashboard/tours`}
        className="inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-paper"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3L5 8l5 5" />
        </svg>
        Retour aux visites
      </Link>

      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-paper">
        {tour.title}
      </h1>

      <TourStatus tour={tour} locale={locale} />
    </div>
  );
}
