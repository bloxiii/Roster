"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type OutreachTarget = {
  id: string;
  agency_name: string;
  contact_name: string | null;
  email: string;
  website: string | null;
  status: "pending" | "sent" | "failed" | "replied";
  error: string | null;
  sent_at: string | null;
  created_at: string;
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

export function OutreachManager({ initialTargets }: { initialTargets: OutreachTarget[] }) {
  const router = useRouter();
  const [targets, setTargets] = useState(initialTargets);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      agency_name: form.get("agency_name") as string,
      contact_name: (form.get("contact_name") as string) || "",
      email: form.get("email") as string,
      website: (form.get("website") as string) || "",
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

  return (
    <div className="mt-8 space-y-8">
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
          <label htmlFor="contact_name" className="mb-1.5 block text-xs text-paper-dim">
            Contact (optionnel)
          </label>
          <input id="contact_name" name="contact_name" className={FIELD} placeholder="Jean Dupont" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs text-paper-dim">
            Email *
          </label>
          <input id="email" name="email" type="email" required className={FIELD} placeholder="contact@agence-dupont.fr" />
        </div>
        <div>
          <label htmlFor="website" className="mb-1.5 block text-xs text-paper-dim">
            Site web (optionnel)
          </label>
          <input id="website" name="website" type="url" className={FIELD} placeholder="https://agence-dupont.fr" />
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

      {/* Liste des cibles */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">Agence</th>
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">Contact</th>
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim">Statut</th>
              <th className="px-4 py-3 font-mono text-xs font-normal uppercase tracking-widest text-paper-dim" />
            </tr>
          </thead>
          <tbody className="text-paper-dim">
            {targets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-paper-dim/50">
                  Aucune cible pour l&apos;instant — ajoutez-en une ci-dessus.
                </td>
              </tr>
            )}
            {targets.map((t) => (
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
                  <div>{t.contact_name || "—"}</div>
                  <div className="text-xs text-paper-dim/60">{t.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${STATUS_STYLE[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  {t.status === "failed" && t.error && (
                    <div className="mt-1 max-w-[220px] text-xs text-red-400/80">{t.error}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSend(t.id)}
                    disabled={sendingId === t.id}
                    className="rounded-full border border-brass/40 px-4 py-1.5 text-xs font-medium text-brass-bright transition-colors hover:bg-brass/10 disabled:opacity-40"
                  >
                    {sendingId === t.id ? "Envoi..." : t.status === "sent" ? "Renvoyer" : "Envoyer"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
