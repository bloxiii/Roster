-- ═══════════════════════════════════════════════════════════════
-- MIGRATION — Champs additionnels pour l'import CSV outreach
-- À exécuter dans Supabase SQL Editor, après 2026-08-11-outreach-template-and-status.sql.
--
-- Ajoute city / postal_code / phone / address à outreach_targets, pour
-- accueillir les colonnes du fichier CSV client (NOM Agence, VILLE, CP,
-- TELEPHONE, ADRESSE, MAIL) importé en masse depuis /outreach.
-- postal_code est en texte (pas en nombre) pour préserver les zéros de
-- tête (ex: "06000").
-- ═══════════════════════════════════════════════════════════════

alter table public.outreach_targets
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists phone text,
  add column if not exists address text;

comment on column public.outreach_targets.postal_code is
  'Code postal — stocké en texte pour préserver les zéros de tête (ex: "06000").';
