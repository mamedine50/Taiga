import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { DashboardIntro } from "@/components/dashboard-intro";

export default async function ExpediteurPage() {
  const ctx = await requireRole("shipper");
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <DashboardIntro ctx={ctx} />
      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold">{t("dashboard.shipperHome")}</h2>
        <p className="mt-1 text-sm text-muted">{t("dashboard.shipperHomeBody")}</p>
      </section>
    </div>
  );
}
