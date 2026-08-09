"use client";

import { useState } from "react";
import { login } from "@/lib/supabase/actions";
import Link from "next/link";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-brass placeholder:text-paper-dim/40";

export function LoginForm({ locale }: { locale: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await login(formData);
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
            <img src="/images/velinova-logo.svg" alt="" width={32} height={32} />
            <span className="font-display text-xl font-semibold text-paper">Velinova</span>
          </Link>
          <p className="mt-3 text-sm text-paper-dim">
            Connectez-vous à votre espace
          </p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs text-paper-dim">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
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
              autoComplete="current-password"
              minLength={8}
              className={FIELD}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brass px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-brass-bright disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          {error && (
            <p role="alert" className="text-center text-sm text-red-400">
              {error}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-paper-dim">
          Vous souhaitez un accès ?{" "}
          <a
            href="mailto:contact@velinova.xyz"
            className="text-brass-bright hover:underline"
          >
            Contactez-nous
          </a>
        </p>
      </div>
    </div>
  );
}
