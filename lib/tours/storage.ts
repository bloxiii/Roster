import { createServiceClient } from "@/lib/supabase/server";

const VIDEO_BUCKET = "tour-videos";
const SCENE_BUCKET = "tour-scenes";

/** Chemin de stockage d'une vidéo — préfixé par company_id pour matcher
 * les policies RLS de storage.objects (voir la migration tours.sql). */
export function videoStoragePath(companyId: string, tourId: string, mimeType: string) {
  const ext = mimeType === "video/webm" ? "webm" : mimeType === "video/quicktime" ? "mov" : "mp4";
  return `${companyId}/${tourId}.${ext}`;
}

/**
 * URL signée pour que le NAVIGATEUR uploade directement la vidéo vers le
 * bucket privé, sans transiter par une route Next.js (section 09 — on évite
 * les limites de taille/durée d'une fonction serverless classique).
 */
export async function createVideoUploadUrl(path: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`[tours/storage] Échec de création de l'URL d'upload : ${error?.message}`);
  }
  // { path, token } plutôt que la seule signedUrl : le client utilise
  // supabase.storage.from(bucket).uploadToSignedUrl(path, token, file), qui
  // pose les bons en-têtes — un PUT brut sur signedUrl est plus fragile.
  return { path: data.path, token: data.token };
}

/**
 * URL signée temporaire pour que le WORKER de reconstruction (hors
 * application, cf. section 09) puisse lire la vidéo. Durée volontairement
 * généreuse (2h) : un traitement GPU peut prendre du temps avant de
 * démarrer le téléchargement selon la charge du worker.
 */
export async function createVideoReadUrl(path: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(path, 2 * 60 * 60);

  if (error || !data) {
    throw new Error(`[tours/storage] Échec de création de l'URL de lecture : ${error?.message}`);
  }
  return data.signedUrl;
}

/** Supprime la vidéo source (section 11 — RGPD, purge après traitement). */
export async function deleteVideo(path: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(VIDEO_BUCKET).remove([path]);
  if (error) {
    throw new Error(`[tours/storage] Échec de suppression de la vidéo : ${error.message}`);
  }
}

/** Le bucket de scènes est public en lecture — URL directe, pas de signature. */
export function scenePublicUrl(path: string) {
  const supabase = createServiceClient();
  const { data } = supabase.storage.from(SCENE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
