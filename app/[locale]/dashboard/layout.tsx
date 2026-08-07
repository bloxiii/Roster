import { setRequestLocale } from "next-intl/server";
import { getUserContext } from "@/lib/supabase/context";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ctx = await getUserContext(locale);

  return (
    <div className="min-h-screen bg-ink">
      <DashboardHeader companyName={ctx.companyName} userName={ctx.userName} />
      <div className="flex">
        <DashboardSidebar locale={locale} />
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
