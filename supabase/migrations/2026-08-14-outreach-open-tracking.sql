-- ═══════════════════════════════════════════════════════════════
-- MIGRATION — Suivi d'ouverture des emails d'outreach
-- À exécuter dans Supabase SQL Editor, après 2026-08-11-outreach-csv-import-fields.sql.
--
-- Ajoute opened_at / open_count à outreach_targets, alimentés par le pixel
-- de suivi servi par GET /api/outreach/track/[id] (voir
-- lib/outreach/email.ts pour l'injection du pixel dans le HTML envoyé).
--
-- Volontairement séparé de `status` : l'ouverture est un signal indicatif
-- (chargement d'image, jamais garanti — proxy webmail, images bloquées,
-- aperçu automatique...), pas une étape du pipeline pending/sent/failed/replied.
-- ═══════════════════════════════════════════════════════════════

alter table public.outreach_targets
  add column if not exists opened_at timestamptz,
  add column if not exists open_count integer not null default 0;

comment on column public.outreach_targets.opened_at is
  'Horodatage de la 1re ouverture détectée (chargement du pixel de suivi). NULL = jamais détecté ouvert — signal indicatif, pas fiable à 100% (images bloquées, proxy webmail...).';
comment on column public.outreach_targets.open_count is
  'Nombre de chargements du pixel de suivi détectés (proxy image des webmails peut en générer plusieurs pour une seule ouverture réelle).';
