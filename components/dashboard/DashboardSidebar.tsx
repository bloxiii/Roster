"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: "grid" },
  { href: "/dashboard/prospects", label: "Prospects", icon: "users" },
  { href: "/dashboard/conversations", label: "Conversations", icon: "chat" },
  // Visites 3D masquée du menu (fonctionnalité pas prête à être montrée) —
  // route /dashboard/tours conservée intacte, juste retirée de la nav.
  // { href: "/dashboard/tours", label: "Visites 3D", icon: "cube" },
  { href: "/dashboard/agents", label: "Agents IA", icon: "bot" },
  { href: "/dashboard/settings", label: "Paramètres", icon: "settings" },
];

function NavIcon({ type }: { type: string }) {
  const cls = "w-4 h-4 stroke-current fill-none";
  switch (type) {
    case "grid":
      return <svg className={cls} viewBox="0 0 16 16" strokeWidth="1.5"><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>;
    case "users":
      return <svg className={cls} viewBox="0 0 16 16" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5" /><path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" /><circle cx="11" cy="4.5" r="2" /><path d="M12 9.5c1.5.5 2.5 2 2.5 3.5" /></svg>;
    case "chat":
      return <svg className={cls} viewBox="0 0 16 16" strokeWidth="1.5"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z" /></svg>;
    case "bot":
      return <svg className={cls} viewBox="0 0 16 16" strokeWidth="1.5"><rect x="3" y="5" width="10" height="8" rx="2" /><circle cx="6" cy="9" r="1" /><circle cx="10" cy="9" r="1" /><path d="M8 2v3M5 2h6" /></svg>;
    case "settings":
      return <svg className={cls} viewBox="0 0 16 16" strokeWidth="1.5"><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13" /></svg>;
    case "cube":
      return <svg className={cls} viewBox="0 0 16 16" strokeWidth="1.5"><path d="M8 1.5l6 3.2v6.6L8 14.5l-6-3.2V4.7z" /><path d="M2 4.7L8 8m0 0l6-3.3M8 8v6.5" /></svg>;
    default:
      return null;
  }
}

export function DashboardSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border/60 md:block">
      <nav className="sticky top-14 flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive =
            item.href === "/dashboard"
              ? pathname === fullHref
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-brass/10 text-brass-bright"
                  : "text-paper-dim hover:bg-surface hover:text-paper",
              )}
            >
              <NavIcon type={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
