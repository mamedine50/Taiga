import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getCarrierFleet, getOfferedMissions } from "@/lib/dispatch";
import { DashboardIntro } from "@/components/dashboard-intro";
import { MissionCard } from "@/components/dispatch/mission-card";

export default async function TransporteurPage() {
  const ctx = await requireRole("carrier");
  const t = await getTranslations();
  const verified = ctx.company?.verified ?? false;

  const [missions, fleet] = ctx.company
    ? await Promise.all([getOfferedMissions(ctx.company.id), getCarrierFleet(ctx.company.id)])
    : [[], { drivers: [], vehicles: [] }];

  return (
    <div className="space-y-6">
      <DashboardIntro ctx={ctx} />

      {!verified && (
        <div className="rounded-card border border-action/40 bg-action/10 p-6">
          <h2 className="font-display text-lg font-bold text-action">
            {t("dashboard.unverifiedTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("carrierSpace.verificationPending")}</p>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">{t("mission.offered")}</h2>
        {missions.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
            {t("mission.offeredEmpty")}
          </p>
        ) : (
          <div className="space-y-4">
            {missions.map((m) => (
              <MissionCard key={m.id} mission={m} fleet={fleet} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
