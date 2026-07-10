import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getAssignableShipments, getCarriers, getRouteRequests } from "@/lib/dispatch";
import { getAdminStats } from "@/lib/stats";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { AssignForm } from "@/components/dispatch/assign-form";
import { VerifyButton } from "@/components/dispatch/verify-button";
import { StatTile } from "@/components/dashboard/stat-tile";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import type { DocChip } from "@/lib/fleet";

const DOC_CHIP: Record<DocChip, { key: string; cls: string }> = {
  valid: { key: "docs.chipValid", cls: "border-success/40 bg-success/10 text-success" },
  expired: { key: "docs.chipExpired", cls: "border-error/40 bg-error/10 text-error" },
  pending: { key: "docs.chipPending", cls: "border-tertiary/40 bg-tertiary/10 text-tertiary" },
  none: { key: "docs.chipNone", cls: "border-border bg-surface2 text-muted" },
};

export default async function AdminPage() {
  await requireRole("admin");
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;

  const [shipments, carriers, requests, stats] = await Promise.all([
    getAssignableShipments(),
    getCarriers(),
    getRouteRequests(),
    getAdminStats(),
  ]);
  const openRequests = requests.filter((r) => r.status === "nouveau").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t("admin.title")}</h1>
        <Link
          href="/admin/departs"
          className="rounded-btn border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface2"
        >
          {t("departure.nav")}
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label={t("kpi.toAssign")} value={String(stats.toAssign)} accent={stats.toAssign > 0 ? "action" : "default"} />
        <StatTile label={t("kpi.activeMissions")} value={String(stats.activeMissions)} />
        <StatTile label={t("kpi.revenue")} value={formatMoney(stats.platformRevenue, locale)} accent="live" />
        <StatTile label={t("kpi.carriers")} value={`${stats.carriersVerified}/${stats.carriersTotal}`} />
        <StatTile label={t("kpi.openDepartures")} value={String(stats.openDepartures)} />
        <StatTile label={t("kpi.openRequests")} value={String(stats.openRouteRequests)} accent={stats.openRouteRequests > 0 ? "action" : "default"} />
      </div>
      <StatusBreakdown data={stats.shipmentsByStatus} />

      {/* Expéditions à assigner */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">{t("admin.toAssign")}</h2>
        {shipments.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
            {t("admin.toAssignEmpty")}
          </p>
        ) : (
          <div className="space-y-3">
            {shipments.map((s) => (
              <div key={s.id} className="rounded-card border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-action">{s.ref}</p>
                    <p className="mt-1 text-sm text-muted">
                      {s.originCity} → {s.destCity} · {formatDate(s.requestedDate, locale)}
                    </p>
                    <p className="mt-1 text-xs text-tertiary">
                      {t("mission.weight")} :{" "}
                      <span className="font-mono">
                        {formatNumber(s.chargeableWeightKg, locale)} kg
                      </span>{" "}
                      · {t("admin.subtotal")} :{" "}
                      <span className="font-mono">{formatMoney(s.subtotal, locale)}</span>
                    </p>
                  </div>
                  <AssignForm shipmentId={s.id} subtotal={s.subtotal ?? 0} carriers={carriers} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transporteurs */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">{t("admin.carriers")}</h2>
        {carriers.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
            {t("admin.carriersEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full text-sm">
              <tbody>
                {carriers.map((c) => {
                  const chip = DOC_CHIP[c.docChip];
                  return (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/admin/transporteurs/${c.id}`} className="font-medium text-action hover:underline">
                          {c.legalName}
                        </Link>
                        {c.city && <span className="ml-2 text-muted">{c.city}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${chip.cls}`}>
                          {t(chip.key)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${
                            c.verified
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-tertiary/40 bg-tertiary/10 text-tertiary"
                          }`}
                        >
                          {c.verified ? t("admin.verified") : t("admin.unverified")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <VerifyButton companyId={c.id} verified={c.verified} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Demandes de trajet hors-corridor */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          {t("admin.routeRequests")}
          {openRequests > 0 && (
            <span className="rounded-pill bg-action px-2 py-0.5 text-xs font-semibold text-bg">
              {openRequests} {t("admin.openRequests")}
            </span>
          )}
        </h2>
        {requests.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
            {t("admin.routeRequestsEmpty")}
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-card border border-border bg-surface p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {r.originCity} → {r.destCity}
                  </span>
                  <span className="text-xs text-tertiary">
                    {r.requestedDate ? formatDate(r.requestedDate, locale) : formatDate(r.createdAt, locale)}
                  </span>
                </div>
                {r.notes && <p className="mt-1 text-muted">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
