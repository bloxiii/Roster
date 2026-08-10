-- ═══════════════════════════════════════════════════════════════
-- MIGRATION — Couleurs du widget (3 couleurs indépendantes) + flux d'annonces
-- À exécuter dans Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- sur une base qui a déjà le schéma initial (supabase/schema.sql) et la
-- migration 2026-08-09-notification-channels.sql.
--
-- 1. Remplace l'unique `widget_color` par 3 couleurs indépendantes :
--    fond du panneau, bulle du bot, bulle du visiteur (+ accent).
-- 2. Ajoute `listings_feed_url` — URL du flux XML/CSV de syndication des
--    annonces (Apimo, Netty, Hektor...) que l'agence peut renseigner.
--    Aucune synchro automatique pour l'instant : le champ est stocké,
--    le parsing/l'ingestion périodique reste à implémenter séparément.
-- ═══════════════════════════════════════════════════════════════

-- Conserve la couleur déjà choisie par les clients existants : elle devient
-- la couleur "visiteur" (bulle + accent du bouton/launcher).
alter table public.company_settings
  rename column widget_color to widget_user_color;

alter table public.company_settings
  add column if not exists widget_bg_color   text default '#1a110d',
  add column if not exists widget_bot_color  text default '#2d1f17',
  add column if not exists listings_feed_url text;

comment on column public.company_settings.widget_user_color is
  'Couleur des bulles du visiteur + accent (bouton d''envoi, launcher). Anciennement widget_color.';
comment on column public.company_settings.widget_bg_color is
  'Couleur de fond du panneau du widget de chat.';
comment on column public.company_settings.widget_bot_color is
  'Couleur des bulles de message du bot (agent IA).';
comment on column public.company_settings.listings_feed_url is
  'URL du flux XML/CSV de syndication des annonces fourni par l''agence (Apimo, Netty, Hektor...). Stocké uniquement pour l''instant — la synchro périodique vers une table `listings` reste à construire.';
