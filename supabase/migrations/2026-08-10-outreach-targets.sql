-- ═══════════════════════════════════════════════════════════════
-- MIGRATION — Plateforme d'outreach (prospection agences immobilières)
-- À exécuter dans Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- sur une base qui a déjà le schéma initial (supabase/schema.sql).
--
-- Table INTERNE à Velinova (pas multi-tenant, pas liée à `companies`) :
-- sert à outiller la prospection commerciale de Velinova lui-même vers des
-- agences immobilières prospects. RLS activé SANS policy → aucun accès
-- via les clients anon/authenticated, uniquement via le service role
-- (routes /api/outreach/*, protégées par un allowlist d'emails admin).
-- ═══════════════════════════════════════════════════════════════

create table public.outreach_targets (
  id           uuid primary key default gen_random_uuid(),
  agency_name  text not null,
  contact_name text,
  email        text not null,
  website      text,
  status       text not null default 'pending', -- pending | sent | failed | replied
  error        text,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_outreach_targets_status on public.outreach_targets(status);
create index idx_outreach_targets_created on public.outreach_targets(created_at desc);

alter table public.outreach_targets enable row level security;
-- Aucune policy créée intentionnellement : deny-by-default pour anon/authenticated.

comment on table public.outreach_targets is
  'Cibles de prospection commerciale Velinova → agences immobilières. Interne, non multi-tenant. Accès exclusif via service role (API routes admin-gated).';
comment on column public.outreach_targets.status is
  'pending (à contacter) | sent (email envoyé) | failed (échec envoi) | replied (a répondu, mis à jour manuellement pour l''instant).';
