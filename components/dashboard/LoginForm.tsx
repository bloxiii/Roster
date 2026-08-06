"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Mot de passe incorrect.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Erreur de connexion.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="font-display text-xl font-semibold text-paper">Velin</span>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-brass">
            Dashboard
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs text-paper-dim">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-brass"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-bright disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          {error && (
            <p role="alert" className="text-center text-sm text-red-400">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
