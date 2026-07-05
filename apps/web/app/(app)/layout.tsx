import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireUser();

  return (
    <div className="min-h-screen">
      <AppHeader
        fullName={ctx.fullName}
        companyName={ctx.company?.legalName ?? null}
        role={ctx.role}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
