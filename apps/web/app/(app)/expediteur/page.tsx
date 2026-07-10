import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getMyShipments } from "@/lib/shipments";
import { getShipperStats } from "@/lib/stats";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/dashboard/stat-tile";

export default async function ExpediteurPage() {
  const ctx = await requireRole("shipper");
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const [shipments, stats] = ctx.company
    ? await Promise.all([getMyShipments(ctx.company.id), getShipperStats(ctx.company.id)])
    : [[], { total: 0, toPay: 0, inProgress: 0, delivered: 0, totalAmount: 0 }];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t("shipments.title")}</h1>
        <div className="flex gap-2">
          <Link
            href="/expediteur/expeditions/autre"
            className="rounded-btn border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface2"
          >
            {t("shipments.otherRoute")}
          </Link>
          <Link
            href="/expediteur/expeditions/nouvelle"
            className="rounded-btn bg-action px-4 py-2.5 text-sm font-semibold text-bg hover:brightness-110"
          >
            {t("shipments.new")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("kpi.total")} value={String(stats.total)} />
        <StatTile label={t("kpi.toPay")} value={String(stats.toPay)} accent={stats.toPay > 0 ? "action" : "default"} />
        <StatTile label={t("kpi.inProgress")} value={String(stats.inProgress)} accent="live" />
        <StatTile label={t("kpi.delivered")} value={String(stats.delivered)} accent="success" />
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-10 text-center text-sm text-muted">
          {t("shipments.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-tertiary">
                <th className="px-4 py-3 font-medium">{t("shipments.colRef")}</th>
                <th className="px-4 py-3 font-medium">{t("shipments.colRoute")}</th>
                <th className="px-4 py-3 font-medium">{t("shipments.colDate")}</th>
                <th className="px-4 py-3 font-medium">{t("shipments.colStatus")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("shipments.colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-surface2">
                  <td className="px-4 py-3">
                    <Link
                      href={`/expediteur/expeditions/${s.id}`}
                      className="font-mono text-action hover:underline"
                    >
                      {s.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {s.originCity} → {s.destCity}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(s.requestedDate, locale)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} label={t(`status.${s.status}`)} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMoney(s.totalAmount, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
