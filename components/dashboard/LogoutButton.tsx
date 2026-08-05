"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-paper-dim transition-colors hover:text-paper"
    >
      Déconnexion
    </button>
  );
}
