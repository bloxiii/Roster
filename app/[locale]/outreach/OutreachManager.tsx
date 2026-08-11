"use client";

import { useState, useMemo, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseOutreachCsv } from "@/lib/outreach/csv";

type OutreachTarget = {
  id: string;
  agency_name: string;
  contact_name: string | null;
  email: string;
  website: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  address: string | null;
  status: "pending" | "sent" | "failed" | "replied";
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

type OutreachTemplate = { subject: string; body: string };

type ImportResult = {
  total: number;
  inserted: number;
  invalid: number;
  duplicatesInFile: number;
  duplicatesInDb: number;
};

const FIELD =
  "w-full rounded-lg border border-border bg-ink px-3 py-2.5 text-sm text-paper outline-none transition-colors focus:border-brass placeholder:text-paper-dim/40";

const STATUS_STYLE: Record<OutreachTarget["status"], string> = {
  pending: "border-paper-dim/30 bg-paper-dim/10 text-paper-dim",
  sent: "border-status/30 bg-status/10 text-status",
  failed: "border-red-400/30 bg-red-400/10 text-red-400",
  replied: "border-brass/30 bg-brass/10 text-brass-bright",
};

const STATUS_LABEL: Record<OutreachTarget["status"], string> = {
  pending: "À contacter",
  sent: "Envoyé",
  failed: "Échec",
  replied: "A répondu",
};

const FILTERS: { key: OutreachTarget["status"] | "all"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "pending", label: "À contacter" },
  { key: "sent", label: "Email envoyé" },
  { key: "replied", label: "Réponse" },
  { key: "failed", label: "Échec" },
];

export function OutreachManager({
  initialTargets,
  initialTemplate,
}: {
  initialTargets: OutreachTarget[];
  initialTemplate: OutreachTemplate;
}) {
  const router = useRouter();
  const [targets, setTargets] = useState(initialTargets);
  const [filter, setFilter] = useState<OutreachTarget["status"] | "all">("all");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? targets : targets.filter((t) => t.status === filter)),
    [targets, filter],
  );

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      agency_name: form.get("agency_name") as string,
      email: form.get("email") as string,
      // Alignés sur les colonnes du CSV d'import (voir ImportCsvSection).
      city: (form.get("city") as string) || "",
      postal_code: (form.get("postal_code") as string) || "",
      phone: (form.get("phone") as string) || "",
      address: (form.get("address") as string) || "",
    };

    try {
      const res = await fetch("/api/outreach/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'ajout.");

      setTargets((prev) => [data.target, ...prev]);
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setAdding(false);
    }
  }

  async function handleSend(id: string) {
    setSendingId(id);
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: id }),
      });
      const data = await res.json();
      const updated: OutreachTarget | undefined = data.target;
      if (updated) {
        setTargets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
      if (!res.ok) {
        console.error("[outreach] Échec de l'envoi:", data.error);
      }
    } catch (err) {
      console.error("[outreach] Erreur réseau:", err);
    } finally {
      setSendingId(null);
    }
  }

  async function handleToggleReplied(t: OutreachTarget) {
    const nextStatus = t.status === "replied" ? "sent" : "replied";
    setBusyId(t.id);
    try {
      const res = await fetch(`/api/outreach/targets/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.target) {
        setTargets((prev) => prev.map((x) => (x.id === t.id ? data.target : x)));
      }
    } catch (err) {
      console.error("[outreach] Erreur réseau:", err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce contact de la liste ?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/outreach/targets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTargets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("[outreach] Erreur réseau:", err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <TemplateEditor initialTemplate={initialTemplate} />

      {/* Recharge la page après import : `targets` est un état client initialisé
          une seule fois depuis initialTargets, router.refresh() seul ne suffit
          pas à faire apparaître les centaines de lignes nouvellement créées. */}
      <ImportCsvSection onImported={() => window.location.reload()} />

      {/* Formulaire d'ajout */}
      <form
        onSubmit={handleAdd}
        className="grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="agency_name" className="mb-1.5 block text-xs text-paper-dim">
            Nom de l&apos;agence *
          </label>
          <input id="agency_name" name="agency_name" required className={FIELD} placeholder="Agence Dupont Immobilier" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs text-paper-dim">
            Email *
          </label>
          <input id="email" name="email" type="email" required className={FIELD} placeholder="contact@agence-dupont.fr" />
        </div>
        {/* Champs alignés sur les colonnes du CSV d'import (voir ImportCsvSection) */}
        <div>
          <label htmlFor="city" className="mb-1.5 block text-xs text-paper-dim">
            Ville (optionnel)
          </label>
          <input id="city" name="city" className={FIELD} placeholder="Manosque" />
        </div>
        <div>
          <label htmlFor="postal_code" className="mb-1.5 block text-xs text-paper-dim">
            Code postal (optionnel)
          </label>
          <input id="postal_code" name="postal_code" className={FIELD} placeholder="04100" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-xs text-paper-dim">
            Téléphone (optionnel)
          </label>
          <input id="phone" name="phone" className={FIELD} placeholder="04 92 78 99 03" />
        </div>
        <div>
          <label htmlFor="address" className="mb-1.5 block text-xs text-paper-dim">
            Adresse (optionnel)
          </label>
          <input id="address" name="address" className={FIELD} placeholder="12 Place du terroir" />
        </div>

        <div className="sm:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-bright disabled:opacity-50"
          >
            {adding ? "Ajout..." : "Ajouter à la liste"}
          </button>
          {addError && <span className="text-sm text-red-400">{addError}</span>}
        </div>
      </form>

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "border-brass bg-brass/10 text-brass-bright"
                : "border-border text-paper-dim hover:border-border hover:text-paper"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1.5 text-paper-dim/50">
                ({targets.filter((t) => t.status === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste des cibles */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">Agence</th>
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">Coordonnées</th>
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">Statut</th>
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">A répondu ?</th>
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim" />
            </tr>
          </thead>
          <tbody className="text-paper-dim">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-paper-dim/50">
                  {targets.length === 0
                    ? "Aucune cible pour l'instant — ajoutez-en une ci-dessus."
                    : "Aucun contact dans ce filtre."}
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="text-paper">{t.agency_name}</div>
                  {t.website && (
                    <a
                      href={t.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-paper-dim/60 hover:text-brass-bright"
                    >
                      {t.website}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>
                    {t.city ? `${t.city}${t.postal_code ? ` (${t.postal_code})` : ""}` : t.contact_name || "—"}
                  </div>
                  <div className="text-xs text-paper-dim/60">{t.email}</div>
                  {t.phone && <div className="text-xs text-paper-dim/60">{t.phone}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${STATUS_STYLE[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  {t.status === "failed" && t.error && (
                    <div className="mt-1 max-w-[220px] text-xs text-red-400/80">{t.error}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={t.status === "replied"}
                      disabled={busyId === t.id || t.status === "pending" || t.status === "failed"}
                      onChange={() => handleToggleReplied(t)}
                      className="h-4 w-4 rounded border-border accent-brass"
                    />
                    Répondu
                  </label>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSend(t.id)}
                      disabled={sendingId === t.id}
                      className="rounded-full border border-brass/40 px-4 py-1.5 text-xs font-medium text-brass-bright transition-colors hover:bg-brass/10 disabled:opacity-40"
                    >
                      {sendingId === t.id ? "Envoi..." : t.status === "sent" ? "Renvoyer" : "Envoyer"}
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={busyId === t.id}
                      aria-label="Supprimer"
                      title="Supprimer"
                      className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-40"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Import CSV en masse de cibles de prospection. Colonnes reconnues (avec
 * ou sans accents/majuscules) : NOM Agence, MAIL (obligatoires), VILLE,
 * CP, TELEPHONE, ADRESSE (optionnelles). Ne déclenche AUCUN envoi d'email —
 * les contacts sont créés en statut "pending" (À contacter), l'envoi reste
 * une action manuelle ligne par ligne.
 */
function ImportCsvSection({ onImported }: { onImported: () => void }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de réimporter le même fichier ensuite
    if (!file) return;

    setError(null);
    setResult(null);

    const text = await file.text();
    const { rows, skipped } = parseOutreachCsv(text);

    if (rows.length === 0) {
      setError(
        "Aucune ligne valide trouvée. Colonnes attendues : NOM Agence, MAIL (+ optionnel VILLE, CP, TELEPHONE, ADRESSE).",
      );
      return;
    }

    const confirmMsg = `${rows.length} contact(s) détecté(s)${
      skipped > 0 ? ` (${skipped} ligne(s) ignorée(s), sans nom ou email)` : ""
    }.\n\nImporter maintenant ? Aucun email ne sera envoyé — les contacts seront créés en statut "À contacter".`;
    if (!confirm(confirmMsg)) return;

    setImporting(true);
    try {
      const res = await fetch("/api/outreach/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'import.");
      setResult(data);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-base font-medium text-paper">Importer un CSV</h2>
      <p className="mt-1 text-xs text-paper-dim/60">
        Colonnes attendues :{" "}
        <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">NOM Agence</code>{" "}
        <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">MAIL</code> (obligatoires),{" "}
        <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">VILLE</code>{" "}
        <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">CP</code>{" "}
        <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">TELEPHONE</code>{" "}
        <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">ADRESSE</code> (optionnelles) — crée les
        contacts en statut « À contacter », <strong className="text-paper">n&apos;envoie aucun email</strong>.
      </p>

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brass/40 px-4 py-2 text-xs font-medium text-brass-bright transition-colors hover:bg-brass/10 has-[:disabled]:opacity-40">
        {importing ? "Import en cours..." : "Choisir un fichier CSV"}
        <input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={importing} className="hidden" />
      </label>

      {result && (
        <div className="mt-4 rounded-lg border border-status/30 bg-status/10 px-4 py-3 text-xs text-status">
          {result.inserted} contact(s) importé(s) sur {result.total}.
          {result.duplicatesInFile + result.duplicatesInDb > 0 &&
            ` ${result.duplicatesInFile + result.duplicatesInDb} doublon(s) ignoré(s).`}
          {result.invalid > 0 && ` ${result.invalid} ligne(s) invalide(s) ignorée(s).`}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}
    </section>
  );
}

/** Éditeur du template email (sujet + corps), avec balises {{contact}} / {{agence}} / {{site}}. */
function TemplateEditor({ initialTemplate }: { initialTemplate: OutreachTemplate }) {
  const [subject, setSubject] = useState(initialTemplate.subject);
  const [body, setBody] = useState(initialTemplate.body);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/outreach/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'enregistrement.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="font-display text-base font-medium text-paper">Template du mail</h2>
          <p className="mt-1 text-xs text-paper-dim/60">
            Balises disponibles :{" "}
            <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">{"{{contact}}"}</code>{" "}
            <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">{"{{agence}}"}</code>{" "}
            <code className="rounded bg-ink px-1 py-0.5 font-mono text-[11px]">{"{{site}}"}</code> —
            remplacées automatiquement à l&apos;envoi.
          </p>
        </div>
        <span className="text-paper-dim">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="template_subject" className="mb-1.5 block text-xs text-paper-dim">
              Sujet
            </label>
            <input
              id="template_subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="template_body" className="mb-1.5 block text-xs text-paper-dim">
              Corps du message
            </label>
            <textarea
              id="template_body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className={`${FIELD} font-mono text-xs leading-relaxed`}
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-bright disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer le template"}
            </button>
            {saved && <span className="text-sm text-status">Template enregistré.</span>}
            {error && <span className="text-sm text-red-400">{error}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
