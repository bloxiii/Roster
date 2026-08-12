/**
 * Génère supabase/seed/demo-agencies.sql à partir de lib/demo/agencies.ts.
 *
 * Contrairement à scripts/seed-demo-agencies.ts (qui appelle l'API Admin
 * Supabase pour créer les comptes de A à Z), ce script produit un fichier
 * SQL à coller tel quel dans Supabase Dashboard → SQL Editor — pratique
 * quand on préfère éviter de lancer un script Node en local avec la clé
 * service role.
 *
 * Limite technique : la création d'un utilisateur Supabase Auth (auth.users)
 * n'est PAS un simple insert SQL fiable (mot de passe hashé par GoTrue,
 * colonnes internes...) — ce n'est pas un choix arbitraire, Supabase
 * déconseille officiellement d'insérer dans auth.users à la main. Le flux
 * reste donc en 2 étapes :
 *   1. Créer le(s) utilisateur(s) à la main (Dashboard → Authentication →
 *      Users → Add user) avec les emails ci-dessous.
 *   2. Coller/exécuter le SQL généré : il retrouve chaque compte par son
 *      email, personnalise sa company (slug stable, nom, site) et son
 *      agent (nom "Alex", system_prompt complet).
 *
 * DEMO_AGENCIES ne contient qu'une seule entrée aujourd'hui (la démo
 * publique /demo) mais ce générateur reste écrit pour boucler sur
 * plusieurs entrées, au cas où un second profil de démo devienne utile.
 *
 * Usage : npm run generate:demo-agencies-sql > supabase/seed/demo-agencies.sql
 * (aucun accès Supabase requis pour générer ce fichier — pure génération
 * de texte à partir du registre local.)
 */
import { DEMO_AGENCIES, DEMO_COMPANY_PLAN } from "../lib/demo/agencies";
import { buildDemoAgentSystemPrompt } from "../lib/demo/system-prompt";

/**
 * Enveloppe une chaîne en littéral dollar-quoté Postgres avec un tag unique
 * — évite tout souci d'échappement de guillemets simples ou de retours à
 * la ligne (noms d'agence avec apostrophe, system prompt multi-lignes...).
 */
function dollarQuote(value: string, tag: string): string {
  if (value.includes(`$${tag}$`)) {
    throw new Error(`Le tag $${tag}$ apparaît dans le contenu à échapper — choisir un autre tag.`);
  }
  return `$${tag}$${value}$${tag}$`;
}

function buildAgencyBlock(agency: (typeof DEMO_AGENCIES)[number], index: number): string {
  const tag = `d${index}`;
  const email = agency.seed.loginEmail;
  const systemPrompt = buildDemoAgentSystemPrompt(agency);
  const role = `Assistant commercial IA — ${agency.name}`;
  // Noms d'agence dollar-quotés partout où ils apparaissent en littéral SQL —
  // plusieurs (ex: "L'Agence Immo", "Century 21 Agence de l'Hippodrome")
  // contiennent une apostrophe, qui casserait un '...' classique.
  const quotedName = dollarQuote(agency.name, `${tag}nm`);

  return `  -- ${agency.name} — /demo
  select id into v_user_id from auth.users where email = '${email}';
  if v_user_id is null then
    raise notice 'Compte introuvable pour % — créez-le d''abord dans Authentication > Users, puis relancez ce script.', '${email}';
  else
    select company_id into v_company_id from public.memberships where user_id = v_user_id limit 1;

    update public.companies
      set slug = '${agency.slug}',
          name = ${quotedName},
          website = '${agency.website}',
          plan = '${DEMO_COMPANY_PLAN}',
          status = 'active'
      where id = v_company_id;

    update public.agents
      set name = 'Alex',
          role = ${dollarQuote(role, `${tag}rl`)},
          system_prompt = ${dollarQuote(systemPrompt, `${tag}sp`)}
      where company_id = v_company_id;

    raise notice 'OK — % personnalisé (company_id=%).', ${quotedName}, v_company_id;
  end if;
`;
}

function generateSql(): string {
  const header = `-- ═══════════════════════════════════════════════════════════════
-- Velinova — Personnalisation des comptes de démonstration
-- Généré depuis lib/demo/agencies.ts par
-- npm run generate:demo-agencies-sql — NE PAS ÉDITER À LA MAIN,
-- régénérer le fichier après toute modification du registre.
-- ═══════════════════════════════════════════════════════════════
--
-- ÉTAPE 1 (obligatoire, une seule fois, à la main) : créer le(s) compte(s)
-- dans Supabase Dashboard → Authentication → Users → "Add user"
-- (n'importe quel mot de passe, "Auto Confirm User" coché) :
--
${DEMO_AGENCIES.map((a) => `--   - ${a.seed.loginEmail}`).join("\n")}
--
-- Le trigger public.handle_new_user() (supabase/schema.sql) crée
-- automatiquement company + membership + agent + widget_key + settings
-- pour chacun. Rien d'autre à faire à cette étape.
--
-- ÉTAPE 2 : coller ce fichier entier dans Dashboard → SQL Editor → Run.
-- Idempotent — peut être relancé après toute mise à jour du registre.
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  v_user_id uuid;
  v_company_id uuid;
begin
${DEMO_AGENCIES.map((a, i) => buildAgencyBlock(a, i)).join("\n")}end $$;
`;

  return header;
}

process.stdout.write(generateSql());
