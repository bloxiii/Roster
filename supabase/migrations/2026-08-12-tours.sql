-- ═══════════════════════════════════════════════════════════════
-- VELINOVA 3D — Visites virtuelles générées à partir d'une vidéo
-- À exécuter dans Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════

-- TOURS
create table public.tours (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  created_by        uuid references auth.users(id),

  title             text not null default 'Visite sans titre',
  address           text,

  -- uploading   : enregistrement créé, en attente de la fin de l'upload vidéo
  -- processing  : reconstruction 3D en cours chez le fournisseur/worker
  -- ready       : scène disponible, visite consultable
  -- failed      : échec — voir `error` (vidéo insuffisante ou erreur pipeline)
  status            text not null default 'uploading',

  -- Fournisseur de reconstruction ayant traité cette visite (section 03 de
  -- l'analyse) — permet de changer de fournisseur sans casser l'historique.
  provider          text,
  provider_job_id   text,

  -- Stockage — buckets créés plus bas. `video_path` est vidé après
  -- suppression de la vidéo source (section 11, RGPD).
  video_path        text,
  video_deleted_at  timestamptz,
  scene_url         text,
  thumbnail_url     text,

  -- Points de vue dérivés des poses caméra du pipeline (section 05) —
  -- tableau de { position: [x,y,z], lookAt: [x,y,z] }. Vide tant que la
  -- reconstruction n'est pas terminée.
  waypoints         jsonb not null default '[]',

  -- Diagnostic du pipeline (ex: % de frames dont la pose a pu être estimée)
  -- utilisé pour la détection automatique de vidéo insuffisante (section 06).
  quality           jsonb not null default '{}',
  error             text,

  -- Partage public (section 11) : slug non devinable, désactivable par
  -- l'agence à tout moment sans supprimer la visite.
  public_slug       text unique not null default encode(gen_random_bytes(12), 'hex'),
  is_public         boolean not null default true,
  view_count        integer not null default 0,

  created_at        timestamptz not null default now(),
  processed_at      timestamptz
);

create index idx_tours_company on public.tours(company_id);
create index idx_tours_public_slug on public.tours(public_slug);
create index idx_tours_status on public.tours(status);

alter table public.tours enable row level security;

-- Dashboard : accès scopé à l'entreprise, même patron que prospects/conversations.
create policy "tours_select" on public.tours
  for select using (company_id in (select public.user_company_ids()));
create policy "tours_insert" on public.tours
  for insert with check (company_id in (select public.user_company_ids()));
create policy "tours_update" on public.tours
  for update using (company_id in (select public.user_company_ids()));
create policy "tours_delete" on public.tours
  for delete using (company_id in (select public.user_company_ids()));

-- Pas de policy "public" volontairement : la lecture publique d'une visite
-- (par un prospect anonyme, via /v/[slug]) ne passe jamais par ce client
-- RLS — elle passe par GET /api/tours/public/[slug], qui utilise le service
-- role et ne renvoie que les colonnes sûres (title, scene_url, thumbnail_url,
-- waypoints). `address`, `provider_job_id`, `company_id` ne sont jamais
-- exposés à un visiteur anonyme.

-- ═══════════════════════════════════════════════════════════════
-- STORAGE — deux buckets distincts (rétention différente, cf. section 11)
-- ═══════════════════════════════════════════════════════════════

-- Vidéos sources : privé, supprimé automatiquement après traitement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tour-videos', 'tour-videos', false, 524288000, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

-- Scènes 3D + miniatures : lues directement par le viewer web, servies via CDN.
insert into storage.buckets (id, name, public, file_size_limit)
values ('tour-scenes', 'tour-scenes', true, 314572800)
on conflict (id) do nothing;

-- tour-videos : un membre de l'entreprise peut uploader/lire dans le
-- dossier `<company_id>/...` de son entreprise. Aucune lecture anonyme.
create policy "tour_videos_insert" on storage.objects
  for insert with check (
    bucket_id = 'tour-videos'
    and (storage.foldername(name))[1]::uuid in (select public.user_company_ids())
  );
create policy "tour_videos_select" on storage.objects
  for select using (
    bucket_id = 'tour-videos'
    and (storage.foldername(name))[1]::uuid in (select public.user_company_ids())
  );
create policy "tour_videos_delete" on storage.objects
  for delete using (
    bucket_id = 'tour-videos'
    and (storage.foldername(name))[1]::uuid in (select public.user_company_ids())
  );

-- tour-scenes : bucket public en lecture (nécessaire pour que le viewer
-- charge la scène côté navigateur sans passer par notre API) ; l'écriture
-- reste réservée au service role (le worker de reconstruction).
create policy "tour_scenes_public_read" on storage.objects
  for select using (bucket_id = 'tour-scenes');
