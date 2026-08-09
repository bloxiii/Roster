-- ═══════════════════════════════════════════════════════════════
-- MIGRATION — Canaux de notification (WhatsApp + Notion)
-- À exécuter dans Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- sur une base qui a déjà le schéma initial (supabase/schema.sql).
--
-- Ajoute à chaque entreprise la possibilité de recevoir ses notifications
-- de prospect (HOT/WARM) par WhatsApp et/ou de les synchroniser dans une
-- base Notion, en plus de l'email déjà existant.
-- ═══════════════════════════════════════════════════════════════

alter table public.company_settings
  add column if not exists notification_whatsapp text,
  add column if not exists notion_token           text,
  add column if not exists notion_database_id     text;

comment on column public.company_settings.notification_whatsapp is
  'Numéro WhatsApp de l''entreprise au format E.164 (ex: +33612345678). Envoi via le numéro Velin (Twilio), configuré côté plateforme.';
comment on column public.company_settings.notion_token is
  'Token d''intégration Notion propre à l''entreprise (créé sur notion.so/my-integrations), doit avoir accès à notion_database_id.';
comment on column public.company_settings.notion_database_id is
  'ID de la base Notion (dans l''URL de la base) où synchroniser les prospects.';
