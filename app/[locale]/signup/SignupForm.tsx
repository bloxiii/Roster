"use client";

import { useState } from "react";
import { signup } from "@/lib/supabase/actions";
import Link from "next/link";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-brass placeholder:text-paper-dim/40";

export function SignupForm({ locale }: { locale: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2.5">
            <img src="/images/velin-logo.svg" alt="" width={32} height={32} />
            <span className="font-display text-xl font-semibold text-paper">Velin</span>
          </Link>
          <p className="mt-3 text-sm text-paper-dim">
            Créez votre espace Velin
          </p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs text-paper-dim">
              Votre nom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              className={FIELD}
              placeholder="Jean Dupont"
            />
          </div>

          <div>
            <label htmlFor="company" className="mb-1.5 block text-xs text-paper-dim">
              Nom de votre entreprise
            </label>
            <input
              id="company"
              name="company"
              type="text"
              required
              className={FIELD}
              placeholder="Agence Dupont"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs text-paper-dim">
              Email professionnel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={FIELD}
              placeholder="vous@entreprise.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs text-paper-dim">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className={FIELD}
              placeholder="8 caractères minimum"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-brass-bright disabled:opacity-50"
          >
            {loading ? "Création en cours..." : "Créer mon compte"}
          </button>

          {error && (
            <p role="alert" className="text-center text-sm text-red-400">
              {error}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-paper-dim">
          Déjà un compte ?{" "}
          <Link
            href={`/${locale}/login`}
            className="text-brass-bright hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
