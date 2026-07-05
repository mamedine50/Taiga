import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { DashboardIntro } from "@/components/dashboard-intro";

export default async function TransporteurPage() {
  const ctx = await requireRole("carrier");
  const t = await getTranslations();
  const verified = ctx.company?.verified ?? false;

  return (
    <div className="space-y-6">
      <DashboardIntro ctx={ctx} />

      {!verified && (
        <div className="rounded-card border border-action/40 bg-action/10 p-6">
          <h2 className="font-display text-lg font-bold text-action">
            {t("dashboard.unverifiedTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.unverifiedBody")}</p>
        </div>
      )}

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold">{t("dashboard.carrierHome")}</h2>
        <p className="mt-1 text-sm text-muted">{t("dashboard.carrierHomeBody")}</p>
      </section>
    </div>
  );
}
