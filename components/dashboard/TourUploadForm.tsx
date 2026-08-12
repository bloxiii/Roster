"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FIELD =
  "w-full rounded-lg border border-border bg-ink px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-brass placeholder:text-paper-dim/40";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE_BYTES = 500 * 1024 * 1024;

type Step = "idle" | "creating" | "uploading" | "starting" | "error";

export function TourUploadForm({ locale }: { locale: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setErrorMessage(null);

    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setErrorMessage("Format non supporté — utilisez un fichier .mp4, .mov ou .webm.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setErrorMessage("Le fichier dépasse 500 Mo — raccourcissez la vidéo (2 à 5 min suffisent, cf. consignes ci-dessus).");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Sélectionnez d'abord une vidéo.");
      return;
    }

    setErrorMessage(null);
    setStep("creating");

    try {
      // 1. Crée l'enregistrement + demande une URL d'upload signée.
      const createRes = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Visite sans titre",
          address: address.trim(),
          fileSizeBytes: file.size,
          mimeType: file.type,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error ?? "Échec de la création.");

      const { tourId, bucket, path, token } = createData as {
        tourId: string;
        bucket: string;
        path: string;
        token: string;
      };

      // 2. Upload direct navigateur → stockage (jamais via notre serveur,
      // voir lib/tours/storage.ts et la section 09 de l'analyse).
      setStep("uploading");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file);
      if (uploadError) throw new Error(`Échec de l'upload : ${uploadError.message}`);

      // 3. Déclenche la reconstruction — le calcul se fait hors de notre
      // application (worker GPU), on ne fait que créer le job ici.
      setStep("starting");
      const startRes = await fetch(`/api/tours/${tourId}/start`, { method: "POST" });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error ?? "Échec du démarrage du traitement.");

      router.push(`/${locale}/dashboard/tours/${tourId}`);
    } catch (err) {
      setStep("error");
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  const busy = step === "creating" || step === "uploading" || step === "starting";
  const busyLabel =
    step === "creating"
      ? "Préparation…"
      : step === "uploading"
        ? "Envoi de la vidéo…"
        : step === "starting"
          ? "Démarrage du traitement…"
          : "";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-xs text-paper-dim">
            Nom de la visite
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Appartement T3 — Rue de la Paix"
            className={FIELD}
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="address" className="mb-1.5 block text-xs text-paper-dim">
            Adresse (optionnel, non affichée aux prospects)
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="12 rue de la Paix, 75002 Paris"
            className={FIELD}
            disabled={busy}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-paper-dim">Vidéo du bien</label>
        <div
          onClick={() => !busy && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center transition-colors ${
            file ? "border-brass/50 bg-brass/5" : "border-border hover:border-brass/40"
          } ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <svg className="h-8 w-8 text-brass" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M8 3v8M4.5 6.5L8 3l3.5 3.5" />
            <path d="M2.5 11v1.5A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V11" />
          </svg>
          {file ? (
            <p className="mt-3 text-sm text-paper">
              {file.name} <span className="text-paper-dim">({(file.size / 1024 / 1024).toFixed(0)} Mo)</span>
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-paper">Glissez votre vidéo ici ou cliquez pour la sélectionner</p>
              <p className="mt-1 text-xs text-paper-dim/60">.mp4, .mov ou .webm — 500 Mo max</p>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!file || busy}
        className="w-full rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-bright disabled:opacity-50"
      >
        {busy ? busyLabel : "Lancer la génération de la visite 3D"}
      </button>
    </form>
  );
}
