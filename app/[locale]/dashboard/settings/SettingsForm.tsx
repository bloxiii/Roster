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
    widget_color: string | null;
  } | null;
  widgetKeys: {
    key: string;
    is_active: boolean;
    agents: unknown;
  }[];
};

export function SettingsForm({ companyId, company, settings, widgetKeys }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNotionToken, setShowNotionToken] = useState(false);

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
        widget_color: form.get("widget_color") as string,
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
          <div className="mt-5">
            <label htmlFor="widget_color" className="mb-1.5 block text-xs text-paper-dim">
              Couleur d&apos;accent
            </label>
            <div className="flex items-center gap-3">
              <input
                id="widget_color"
                name="widget_color"
                type="color"
                defaultValue={settings?.widget_color ?? "#7a2e26"}
                className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
              />
              <input
                type="text"
                defaultValue={settings?.widget_color ?? "#7a2e26"}
                className={`${FIELD} max-w-32`}
                readOnly
              />
            </div>
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
