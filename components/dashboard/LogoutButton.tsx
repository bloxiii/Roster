"use client";

import { logout } from "@/lib/supabase/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm text-paper-dim transition-colors hover:text-paper"
      >
        Déconnexion
      </button>
    </form>
  );
}
