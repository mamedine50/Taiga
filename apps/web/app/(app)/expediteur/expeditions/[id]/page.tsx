import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getShipment } from "@/lib/shipments";
import { formatDate, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { QuoteBreakdown } from "@/components/shipments/quote-breakdown";

export default async function ExpeditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("shipper");
  const { id } = await params;
  const detail = await getShipment(id);
  if (!detail) notFound();

  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/expediteur" className="text-sm text-muted hover:text-text">
          ← {t("quote.backToList")}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-mono font-display text-2xl font-bold">{detail.ref}</h1>
          <StatusBadge status={detail.status} label={t(`status.${detail.status}`)} />
        </div>
      </div>

      <QuoteBreakdown detail={detail} />

      {/* Paiement — arrive en Phase 3 */}
      <div className="rounded-card border border-border bg-surface p-6">
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-btn bg-action/40 px-4 py-2.5 text-sm font-semibold text-bg"
        >
          {t("quote.payCta")}
        </button>
        <p className="mt-2 text-center text-xs text-tertiary">{t("quote.payComingSoon")}</p>
      </div>

      {/* Trajet */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold">{t("quote.route")}</h2>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-tertiary">{t("form.pickup")}</p>
            <p className="mt-0.5">{detail.originAddress}</p>
            <p className="text-muted">{detail.originCity}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-tertiary">{t("form.delivery")}</p>
            <p className="mt-0.5">{detail.destAddress}</p>
            <p className="text-muted">{detail.destCity}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          {detail.corridorLabel && <span>{detail.corridorLabel}</span>}
          <span>
            {t("form.requestedDate")} : {formatDate(detail.requestedDate, locale)}
          </span>
        </div>
      </div>

      {/* Marchandise */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold">{t("quote.goods")}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-tertiary">
                <th className="py-2 pr-4 font-medium">{t("form.description")}</th>
                <th className="px-2 py-2 text-right font-medium">{t("form.qty")}</th>
                <th className="px-2 py-2 text-right font-medium">cm (L×l×H)</th>
                <th className="px-2 py-2 text-right font-medium">kg</th>
                <th className="py-2 pl-2 text-right font-medium">m³</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((it) => (
                <tr key={it.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4">
                    {it.description}
                    {it.dangerous && <span className="ml-2 text-error">⚠</span>}
                  </td>
                  <td className="px-2 py-2 text-right font-mono">{it.qty}</td>
                  <td className="px-2 py-2 text-right font-mono text-muted">
                    {formatNumber(it.lengthCm, locale, 0)}×{formatNumber(it.widthCm, locale, 0)}×
                    {formatNumber(it.heightCm, locale, 0)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono">
                    {formatNumber(it.weightKgEach * it.qty, locale)}
                  </td>
                  <td className="py-2 pl-2 text-right font-mono">{formatNumber(it.cbm, locale, 3)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-xs text-muted">
                <td className="pt-3" colSpan={3}>
                  {t("form.chargeableWeight")}
                </td>
                <td className="pt-3 text-right font-mono text-live" colSpan={2}>
                  {formatNumber(detail.chargeableWeightKg, locale)} kg
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
