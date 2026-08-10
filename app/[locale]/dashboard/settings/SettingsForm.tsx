"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NOTION_HELP_URL = "https://www.notion.so/my-integrations";

const FIELD =
  "w-full rounded-lg border border-border bg-ink px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-brass placeholder:text-paper-dim/40";

type Props = {
  companyId: string;
  company: { name: string; website: string | null } | null;
  settings: {
    notification_email: string | null;
    notification_whatsapp: string | null;
    notion_token: string | null;
    notion_database_id: string | null;
    widget_bg_color: string | null;
    widget_bot_color: string | null;
    widget_user_color: string | null;
    listings_feed_url: string | null;
  } | null;
  widgetKeys: {
    key: string;
    is_active: boolean;
    agents: unknown;
  }[];
};

const DEFAULT_BG_COLOR = "#1a110d";
const DEFAULT_BOT_COLOR = "#2d1f17";
const DEFAULT_USER_COLOR = "#7a2e26";

export function SettingsForm({ companyId, company, settings, widgetKeys }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNotionToken, setShowNotionToken] = useState(false);

  // État local des 3 couleurs — permet un aperçu live et garde le champ
  // texte à côté du sélecteur toujours synchronisé (il était figé avant).
  const [bgColor, setBgColor] = useState(settings?.widget_bg_color ?? DEFAULT_BG_COLOR);
  const [botColor, setBotColor] = useState(settings?.widget_bot_color ?? DEFAULT_BOT_COLOR);
  const [userColor, setUserColor] = useState(settings?.widget_user_color ?? DEFAULT_USER_COLOR);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    await supabase
      .from("companies")
      .update({
        name: form.get("company_name") as string,
        website: form.get("website") as string,
      })
      .eq("id", companyId);

    await supabase
      .from("company_settings")
      .update({
        notification_email: form.get("notification_email") as string,
        notification_whatsapp: (form.get("notification_whatsapp") as string) || null,
        notion_token: (form.get("notion_token") as string) || null,
        notion_database_id: (form.get("notion_database_id") as string) || null,
        widget_bg_color: form.get("widget_bg_color") as string,
        widget_bot_color: form.get("widget_bot_color") as string,
        widget_user_color: form.get("widget_user_color") as string,
        listings_feed_url: (form.get("listings_feed_url") as string) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", companyId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const wk = widgetKeys[0];
  const agentName = wk?.agents
    ? (wk.agents as unknown as { name: string }).name
    : "—";

  return (
    <div className="mt-8 space-y-10">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Entreprise */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-base font-medium text-paper">Entreprise</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="company_name" className="mb-1.5 block text-xs text-paper-dim">Nom</label>
              <input id="company_name" name="company_name" type="text" defaultValue={company?.name ?? ""} className={FIELD} />
            </div>
            <div>
              <label htmlFor="website" className="mb-1.5 block text-xs text-paper-dim">Site web</label>
              <input id="website" name="website" type="url" defaultValue={company?.website ?? ""} className={FIELD} placeholder="https://" />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-base font-medium text-paper">Notifications</h2>
          <p className="mt-1.5 text-xs text-paper-dim/60">
            Dès qu&apos;un prospect est qualifié <span className="text-status">HOT</span> ou{" "}
            <span className="text-amber-400">WARM</span>, Velinova le signale sur chaque canal
            renseigné ci-dessous. Laissez un champ vide pour désactiver ce canal.
          </p>

          <div className="mt-5">
            <label htmlFor="notification_email" className="mb-1.5 block text-xs text-paper-dim">
              Email
            </label>
            <input
              id="notification_email"
              name="notification_email"
              type="email"
              defaultValue={settings?.notification_email ?? ""}
              className={FIELD}
              placeholder="commercial@votreentreprise.com"
            />
          </div>
        </section>

        {/* Widget */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-base font-medium text-paper">Widget</h2>
          <p className="mt-1.5 text-xs text-paper-dim/60">
            Ces 3 couleurs pilotent l&apos;apparence du widget embarqué sur votre site
            (via <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">data-velinova-key</code>) —
            aucune modification du code d&apos;intégration n&apos;est nécessaire.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ColorField
              id="widget_bg_color"
              label="Fond du panneau"
              value={bgColor}
              onChange={setBgColor}
            />
            <ColorField
              id="widget_bot_color"
              label="Bulle du bot"
              value={botColor}
              onChange={setBotColor}
            />
            <ColorField
              id="widget_user_color"
              label="Bulle du visiteur / accent"
              value={userColor}
              onChange={setUserColor}
            />
          </div>

          {/* Aperçu live */}
          <div
            className="mt-5 space-y-2 rounded-xl border border-border p-4"
            style={{ background: bgColor }}
          >
            <div
              className="max-w-[75%] rounded-2xl rounded-bl-md px-3 py-2 text-xs"
              style={{ background: botColor, color: "#f5ebe0" }}
            >
              Bonjour, en quoi puis-je vous aider ?
            </div>
            <div
              className="ml-auto max-w-[75%] rounded-2xl rounded-br-md px-3 py-2 text-right text-xs"
              style={{ background: userColor, color: "#1a110d" }}
            >
              Je cherche un appartement T3.
            </div>
          </div>
        </section>

        {/* Flux d'annonces */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-base font-medium text-paper">Flux d&apos;annonces</h2>
          <p className="mt-1.5 text-xs text-paper-dim/60">
            URL du flux XML/CSV de syndication de vos annonces (généré par votre
            logiciel de gestion — Apimo, Netty, Hektor... — pour SeLoger/LeBonCoin/Bien&apos;ici).
            Laissez vide si vous ne savez pas ce que c&apos;est.
          </p>
          <div className="mt-4">
            <label htmlFor="listings_feed_url" className="mb-1.5 block text-xs text-paper-dim">
              URL du flux
            </label>
            <input
              id="listings_feed_url"
              name="listings_feed_url"
              type="url"
              defaultValue={settings?.listings_feed_url ?? ""}
              className={FIELD}
              placeholder="https://votre-logiciel.fr/flux/xxxxx.xml"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-brass-bright disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>

        {saved && (
          <span className="ml-4 text-sm text-status">Paramètres enregistrés.</span>
        )}
      </form>

      {/* Widget Key (lecture seule) */}
      {wk && (
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-base font-medium text-paper">Clé du widget</h2>
          <p className="mt-2 text-xs text-paper-dim">
            Utilisez cette clé pour intégrer le widget sur votre site. Agent : {agentName}.
          </p>
          <div className="mt-4 rounded-lg bg-ink p-4 font-mono text-xs text-paper-dim break-all">
            {wk.key}
          </div>
          <pre className="mt-4 rounded-lg bg-ink p-4 font-mono text-xs text-paper-dim overflow-x-auto">
{`<script
  src="https://velinova.xyz/widget/velinova-widget.js"
  data-velinova-key="${wk.key}">
</script>`}
          </pre>
        </section>
      )}
    </div>
  );
}

/** Sélecteur de couleur + champ hex synchronisé, utilisé pour les 3 couleurs du widget. */
function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-paper-dim">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          name={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            // On n'accepte que ce qui ressemble à un hex — évite de casser
            // l'input type=color avec une valeur invalide en cours de frappe.
            if (/^#[0-9a-fA-F]{0,6}$/.test(next)) onChange(next);
          }}
          className={`${FIELD} max-w-28 font-mono uppercase`}
        />
      </div>
    </div>
  );
}
