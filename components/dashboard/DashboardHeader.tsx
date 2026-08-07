import { Container } from "@/components/ui/Container";
import { LogoutButton } from "./LogoutButton";
import Link from "next/link";

export function DashboardHeader({
  companyName,
  userName,
}: {
  companyName: string;
  userName: string;
}) {
  return (
    <header className="border-b border-border/60 bg-ink/85 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/velin-logo.svg" alt="" width={24} height={24} />
            <span className="font-display text-base font-semibold text-paper">Velin</span>
          </Link>
          <span className="text-border">/</span>
          <span className="text-sm text-paper-dim">{companyName}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-paper-dim sm:inline">{userName}</span>
          <LogoutButton />
        </div>
      </Container>
    </header>
  );
}
