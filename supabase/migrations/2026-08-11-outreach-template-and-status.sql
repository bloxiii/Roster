-- ═══════════════════════════════════════════════════════════════
-- MIGRATION — Template email éditable pour l'outreach
-- À exécuter dans Supabase SQL Editor, après 2026-08-10-outreach-targets.sql.
--
-- Ajoute une table singleton contenant le sujet + corps du mail d'outreach,
-- éditable depuis /outreach, avec balises {{contact}} / {{agence}} / {{site}}
-- substituées à l'envoi. Remplace le template en dur de lib/outreach/email.ts.
-- ═══════════════════════════════════════════════════════════════

create table public.outreach_email_template (
  id         text primary key default 'default',
  subject    text not null,
  body       text not null,
  updated_at timestamptz not null default now()
);

alter table public.outreach_email_template enable row level security;
-- Aucune policy créée intentionnellement : deny-by-default, accès service role uniquement.

insert into public.outreach_email_template (id, subject, body) values (
  'default',
  'Qualifiez vos prospects immobiliers automatiquement — {{agence}}',
  E'Bonjour {{contact}},\n\nJe me permets de vous contacter au sujet de {{agence}}.\n\nJ''ai vu {{site}} — beau catalogue de biens.\n\nVelinova est un assistant IA qui qualifie automatiquement vos prospects immobiliers 24/7, directement depuis votre site : un visiteur discute avec l''assistant, décrit son projet, et vous recevez une fiche prospect prête à l''emploi (budget, localisation, délai, coordonnées) — sans rien changer à votre site actuel (une seule ligne de code à ajouter).\n\nVous pouvez tester une démo en direct ici : https://velinova.xyz/demo\n\nSi ça vous intéresse, répondez simplement à cet email — je me ferai un plaisir d''en discuter avec vous.\n\nÀ bientôt,\nL''équipe Velinova'
);

comment on table public.outreach_email_template is
  'Template unique (id=''default'') du mail d''outreach, éditable depuis /outreach. Balises : {{contact}}, {{agence}}, {{site}}.';
