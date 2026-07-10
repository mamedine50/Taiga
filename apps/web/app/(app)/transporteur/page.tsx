import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getCarrierFleet, getOfferedMissions } from "@/lib/dispatch";
import { getCarrierStats } from "@/lib/stats";
import { formatMoney } from "@/lib/format";
import { DashboardIntro } from "@/components/dashboard-intro";
import { MissionCard } from "@/components/dispatch/mission-card";
import { StatTile } from "@/components/dashboard/stat-tile";

export default async function TransporteurPage() {
  const ctx = await requireRole("carrier");
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const verified = ctx.company?.verified ?? false;

  const [missions, fleet, stats] = ctx.company
    ? await Promise.all([
        getOfferedMissions(ctx.company.id),
        getCarrierFleet(ctx.company.id),
        getCarrierStats(ctx.company.id),
      ])
    : [[], { drivers: [], vehicles: [] }, { offered: 0, inProgress: 0, netRevenue: 0, activeDrivers: 0, activeVehicles: 0 }];

  return (
    <div className="space-y-6">
      <DashboardIntro ctx={ctx} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("kpi.offered")} value={String(stats.offered)} accent={stats.offered > 0 ? "action" : "default"} />
        <StatTile label={t("kpi.inProgress")} value={String(stats.inProgress)} accent="live" />
        <StatTile label={t("kpi.netRevenue")} value={formatMoney(stats.netRevenue, locale)} accent="success" />
        <StatTile
          label={t("kpi.fleet")}
          value={`${stats.activeDrivers} · ${stats.activeVehicles}`}
          sub={t("kpi.fleetSub", { drivers: stats.activeDrivers, vehicles: stats.activeVehicles })}
        />
      </div>

      <div className="flex gap-2">
        <Link href="/transporteur/flotte" className="rounded-btn border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface2">
          {t("fleet.nav")}
        </Link>
        <Link href="/transporteur/documents" className="rounded-btn border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface2">
          {t("docs.nav")}
        </Link>
      </div>

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
