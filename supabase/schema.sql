-- ═══════════════════════════════════════════════════════════════
-- VELIN SaaS — Schéma de base de données
-- À exécuter dans Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════

-- COMPANIES
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  website     text,
  plan        text not null default 'trial',
  created_at  timestamptz not null default now()
);

-- MEMBERSHIPS (user ↔ company)
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  role        text not null default 'admin',
  created_at  timestamptz not null default now(),
  unique(user_id, company_id)
);

-- AGENTS (employés numériques IA)
create table public.agents (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  role          text not null,
  type          text not null default 'qualification',
  avatar        text not null default 'E',
  status        text not null default 'active',
  system_prompt text,
  config        jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- WIDGET KEYS (accès public sécurisé)
create table public.widget_keys (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null,
  company_id      uuid not null references public.companies(id) on delete cascade,
  agent_id        uuid not null references public.agents(id) on delete cascade,
  allowed_domains text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- PROSPECTS (créé AVANT conversations pour éviter l'erreur de référence circulaire)
create table public.prospects (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  agent_id        uuid not null references public.agents(id),
  conversation_id uuid,  -- FK ajoutée après création de conversations
  qualification   text not null,
  data            jsonb not null,
  summary         text,
  notes           text,
  notified_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- CONVERSATIONS
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  agent_id    uuid not null references public.agents(id) on delete cascade,
  prospect_id uuid references public.prospects(id),
  status      text not null default 'active',
  messages    jsonb not null default '[]',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

-- FK croisée : prospects.conversation_id → conversations.id
alter table public.prospects
  add constraint fk_prospect_conversation
  foreign key (conversation_id) references public.conversations(id);

-- COMPANY SETTINGS
create table public.company_settings (
  company_id           uuid primary key references public.companies(id) on delete cascade,
  notification_email   text,
  -- Canaux de notification additionnels — voir
  -- supabase/migrations/2026-08-09-notification-channels.sql pour le détail.
  notification_whatsapp text, -- numéro E.164, ex: +33612345678 (envoi via Twilio, expéditeur Velin)
  notion_token          text, -- token d'intégration Notion propre à l'entreprise
  notion_database_id    text, -- ID de la base Notion cible
  widget_bg_color       text default '#1a110d',  -- fond du panneau du widget
  widget_bot_color      text default '#2d1f17',  -- bulles du bot
  widget_user_color     text default '#7a2e26',  -- bulles du visiteur + accent
  widget_greeting       text,
  listings_feed_url     text, -- flux XML/CSV de syndication des annonces (Apimo, Netty, Hektor...) — pas encore synchronisé automatiquement
  updated_at           timestamptz not null default now()
);

-- OUTREACH TARGETS (prospection commerciale Velinova → agences immobilières)
-- Table interne, non multi-tenant. RLS activé SANS policy : accès uniquement
-- via le service role (routes /api/outreach/*, admin-gated par lib/admin.ts).
create table public.outreach_targets (
  id           uuid primary key default gen_random_uuid(),
  agency_name  text not null,
  contact_name text,
  email        text not null,
  website      text,
  city         text, -- import CSV
  postal_code  text, -- import CSV — texte pour préserver les zéros de tête (ex: "06000")
  phone        text, -- import CSV
  address      text, -- import CSV
  status       text not null default 'pending', -- pending | sent | failed | replied
  error        text,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- OUTREACH EMAIL TEMPLATE (singleton, éditable depuis /outreach)
-- Balises substituées à l'envoi : {{contact}}, {{agence}}, {{site}}.
create table public.outreach_email_template (
  id         text primary key default 'default',
  subject    text not null,
  body       text not null,
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEX
-- ═══════════════════════════════════════════════════════════════
create index idx_memberships_user on public.memberships(user_id);
create index idx_memberships_company on public.memberships(company_id);
create index idx_agents_company on public.agents(company_id);
create index idx_widget_keys_key on public.widget_keys(key);
create index idx_widget_keys_company on public.widget_keys(company_id);
create index idx_conversations_company on public.conversations(company_id);
create index idx_conversations_agent on public.conversations(agent_id);
create index idx_prospects_company on public.prospects(company_id);
create index idx_prospects_qualification on public.prospects(company_id, qualification);
create index idx_prospects_agent on public.prospects(agent_id);
create index idx_outreach_targets_status on public.outreach_targets(status);
create index idx_outreach_targets_created on public.outreach_targets(created_at desc);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

create or replace function public.user_company_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select company_id from public.memberships
  where user_id = auth.uid()
$$;

-- COMPANIES
alter table public.companies enable row level security;
create policy "companies_select" on public.companies
  for select using (id in (select public.user_company_ids()));

-- MEMBERSHIPS
alter table public.memberships enable row level security;
create policy "memberships_select" on public.memberships
  for select using (user_id = auth.uid());

-- AGENTS
alter table public.agents enable row level security;
create policy "agents_select" on public.agents
  for select using (company_id in (select public.user_company_ids()));
create policy "agents_update" on public.agents
  for update using (company_id in (select public.user_company_ids()));

-- WIDGET KEYS
alter table public.widget_keys enable row level security;
create policy "widget_keys_select" on public.widget_keys
  for select using (company_id in (select public.user_company_ids()));

-- CONVERSATIONS
alter table public.conversations enable row level security;
create policy "conversations_select" on public.conversations
  for select using (company_id in (select public.user_company_ids()));

-- PROSPECTS
alter table public.prospects enable row level security;
create policy "prospects_select" on public.prospects
  for select using (company_id in (select public.user_company_ids()));

-- COMPANY SETTINGS
alter table public.company_settings enable row level security;
create policy "settings_select" on public.company_settings
  for select using (company_id in (select public.user_company_ids()));
create policy "settings_update" on public.company_settings
  for update using (company_id in (select public.user_company_ids()));

-- OUTREACH TARGETS / TEMPLATE — RLS activé, aucune policy (deny-by-default).
-- Accès exclusivement via le service role, cf. app/api/outreach/*.
alter table public.outreach_targets enable row level security;
alter table public.outreach_email_template enable row level security;

insert into public.outreach_email_template (id, subject, body) values (
  'default',
  'Qualifiez vos prospects immobiliers automatiquement — {{agence}}',
  E'Bonjour {{contact}},\n\nJe me permets de vous contacter au sujet de {{agence}}.\n\nJ''ai vu {{site}} — beau catalogue de biens.\n\nVelinova est un assistant IA qui qualifie automatiquement vos prospects immobiliers 24/7, directement depuis votre site : un visiteur discute avec l''assistant, décrit son projet, et vous recevez une fiche prospect prête à l''emploi (budget, localisation, délai, coordonnées) — sans rien changer à votre site actuel (une seule ligne de code à ajouter).\n\nVous pouvez tester une démo en direct ici : https://velinova.xyz/demo\n\nSi ça vous intéresse, répondez simplement à cet email — je me ferai un plaisir d''en discuter avec vous.\n\nÀ bientôt,\nL''équipe Velinova'
) on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER : Setup automatique après signup
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  new_company_id uuid;
  new_agent_id uuid;
  company_name text;
  company_slug text;
  widget_key_value text;
begin
  company_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    'Mon entreprise'
  );
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'))
    || '-' || substr(gen_random_uuid()::text, 1, 8);

  insert into public.companies (name, slug)
  values (company_name, company_slug)
  returning id into new_company_id;

  insert into public.memberships (user_id, company_id, role)
  values (new.id, new_company_id, 'admin');

  insert into public.agents (company_id, name, role, type, avatar)
  values (new_company_id, 'Emma', 'Assistante commerciale IA', 'qualification', 'E')
  returning id into new_agent_id;

  widget_key_value := 'wk_' || encode(gen_random_bytes(24), 'hex');
  insert into public.widget_keys (key, company_id, agent_id)
  values (widget_key_value, new_company_id, new_agent_id);

  insert into public.company_settings (company_id)
  values (new_company_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
