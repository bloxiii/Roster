/**
 * Types partagés pour la fonctionnalité "Visites 3D" (Velinova 3D).
 * Miroir de la table `tours` (supabase/migrations/2026-08-12-tours.sql).
 */

export type TourStatus = "uploading" | "processing" | "ready" | "failed";

export type Waypoint = {
  /** Position caméra dans l'espace de la scène [x, y, z]. */
  position: [number, number, number];
  /** Point regardé depuis cette position [x, y, z]. */
  lookAt: [number, number, number];
};

export type TourQuality = {
  /** % de frames dont la pose caméra a pu être estimée par le SfM (section 06). */
  registeredFrameRatio?: number;
  /** Segments temporels (secondes) identifiés comme mal reconstruits. */
  weakSegments?: { startSec: number; endSec: number }[];
};

export type Tour = {
  id: string;
  company_id: string;
  created_by: string | null;
  title: string;
  address: string | null;
  status: TourStatus;
  provider: string | null;
  provider_job_id: string | null;
  video_path: string | null;
  video_deleted_at: string | null;
  scene_url: string | null;
  thumbnail_url: string | null;
  waypoints: Waypoint[];
  quality: TourQuality;
  error: string | null;
  public_slug: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  processed_at: string | null;
};

/** Vue publique d'une visite — c'est tout ce que /v/[slug] a le droit de voir. */
export type PublicTour = Pick<
  Tour,
  "title" | "scene_url" | "thumbnail_url" | "waypoints" | "status"
>;
