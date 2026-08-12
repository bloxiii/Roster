/**
 * Crée (ou met à jour) les comptes Velinova des agences de démonstration
 * définies dans lib/demo/agencies.ts.
 *
 * Ce script NE modifie PAS le schéma et ne crée AUCUNE table spéciale : il
 * réutilise exactement le mécanisme multi-tenant existant.
 *
 *   1. Crée un utilisateur Supabase Auth (supabase.auth.admin.createUser).
 *   2. Le trigger public.handle_new_user() (supabase/schema.sql) fait le
 *      reste automatiquement : company + membership + agent "Emma" +
 *      widget_key + company_settings.
 *   3. Ce script personnalise ensuite la company (slug stable, nom, site)
 *      et l'agent (nom "Alex", system_prompt généré depuis la config).
 *
 * Idempotent : si une company existe déjà pour le slug d'une agence, le
 * script se contente de rafraîchir son system_prompt (utile après une
 * modification de lib/demo/agencies.ts ou lib/demo/system-prompt.ts) sans
 * recréer de compte ni de mot de passe.
 *
 * Usage (variables d'env Supabase requises — PAS commitées, à fournir au
 * moment de l'exécution, typiquement en local ou depuis la CI de déploiement) :
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npm run seed:demo-agencies
 *
 * Ce script n'a jamais été exécuté depuis cet environnement (pas d'accès
 * aux identifiants Supabase de production) — à lancer par un humain ayant
 * accès au projet Supabase, avant d'envoyer les liens de démo en prospection.
 *
 * Alternative sans Node local : supabase/seed/demo-agencies.sql (généré par
 * `npm run generate:demo-agencies-sql`) fait la même personnalisation en SQL
 * pur, à coller dans Dashboard → SQL Editor — pratique si vous préférez
 * créer les 5 comptes à la main (Authentication → Users → Add user) plutôt
 * que de lancer ce script avec la clé service role. Voir le fichier généré
 * pour le détail des deux étapes.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { DEMO_AGENCIES } from "../lib/demo/agencies";
import { buildDemoAgentSystemPrompt } from "../lib/demo/system-prompt";
import type { DemoAgencyConfig } from "../lib/demo/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "[seed-demo-agencies] NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}

async function seedAgency(agency: DemoAgencyConfig) {
  console.log(`\n=== ${agency.name} (/demo/${agency.slug}) ===`);

  const { data: existingCompany, error: lookupError } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", agency.slug)
    .maybeSingle();

  if (lookupError) {
    console.error("  ✗ Échec de la recherche de company existante:", lookupError.message);
    return;
  }

  let companyId: string;

  if (existingCompany) {
    companyId = existingCompany.id;
    console.log("  Compte déjà existant — mise à jour du system prompt uniquement.");
    await supabase
      .from("companies")
      .update({ name: agency.name, website: agency.website })
      .eq("id", companyId);
  } else {
    const password = generatePassword();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: agency.seed.loginEmail,
      password,
      email_confirm: true,
      user_metadata: { company_name: agency.name },
    });

    if (createError || !created.user) {
      console.error("  ✗ Échec création du compte:", createError?.message);
      return;
    }

    // Laisser le trigger handle_new_user() créer company/membership/agent/widget_key/settings.
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("company_id")
      .eq("user_id", created.user.id)
      .single();

    if (membershipError || !membership) {
      console.error(
        "  ✗ Le trigger handle_new_user() n'a pas créé de company pour ce compte.",
        membershipError?.message,
      );
      return;
    }

    companyId = membership.company_id;

    const { error: updateError } = await supabase
      .from("companies")
      .update({ slug: agency.slug, name: agency.name, website: agency.website, plan: "demo" })
      .eq("id", companyId);

    if (updateError) {
      console.error("  ✗ Échec de la mise à jour du slug de la company:", updateError.message);
      return;
    }

    console.log(`  ✓ Compte créé — login: ${agency.seed.loginEmail}`);
    console.log(`  ✓ Mot de passe (à conserver, ne sera plus jamais affiché) : ${password}`);
  }

  const { data: agent, error: agentLookupError } = await supabase
    .from("agents")
    .select("id")
    .eq("company_id", companyId)
    .limit(1)
    .single();

  if (agentLookupError || !agent) {
    console.error("  ✗ Aucun agent trouvé pour cette company:", agentLookupError?.message);
    return;
  }

  const { error: agentUpdateError } = await supabase
    .from("agents")
    .update({
      name: "Alex",
      role: `Assistant commercial IA — ${agency.name}`,
      system_prompt: buildDemoAgentSystemPrompt(agency),
    })
    .eq("id", agent.id);

  if (agentUpdateError) {
    console.error("  ✗ Échec de la mise à jour du system prompt:", agentUpdateError.message);
    return;
  }

  const { data: widgetKeyRow } = await supabase
    .from("widget_keys")
    .select("key")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  console.log(`  ✓ System prompt à jour.`);
  console.log(`  → URL de démo : https://www.velinova.xyz/demo/${agency.slug}`);
  console.log(`  → Widget key  : ${widgetKeyRow?.key ?? "introuvable"}`);
}

async function main() {
  for (const agency of DEMO_AGENCIES) {
    await seedAgency(agency);
  }
  console.log("\nTerminé.");
}

main().catch((error) => {
  console.error("[seed-demo-agencies] Erreur inattendue:", error);
  process.exit(1);
});
