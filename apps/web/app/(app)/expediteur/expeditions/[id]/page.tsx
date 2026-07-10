import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getShipment } from "@/lib/shipments";
import { formatDate, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { QuoteBreakdown } from "@/components/shipments/quote-breakdown";
import { PodDisplay } from "@/components/shipments/pod-view";

export default async function ExpeditionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reserved?: string }>;
}) {
  await requireRole("shipper");
  const { id } = await params;
  const detail = await getShipment(id);
  if (!detail) notFound();

  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const justReserved = (await searchParams).reserved === "1";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/expediteur" className="text-sm text-muted hover:text-text">
          ← {t("quote.backToList")}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-mono text-2xl font-bold">{detail.ref}</h1>
          <StatusBadge status={detail.status} label={t(`status.${detail.status}`)} />
        </div>
      </div>

      {detail.pod && <PodDisplay pod={detail.pod} />}

      <QuoteBreakdown detail={detail} />

      {/* Paiement / réservation */}
      {detail.paymentStatus === "retenu" ? (
        <div className="rounded-card border border-success/40 bg-success/5 p-6">
          <p className="text-sm font-semibold text-success">{t("payment.reservedBanner")}</p>
          {detail.invoiceUrl && (
            <a
              href={detail.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-btn border border-border px-4 py-2 text-sm hover:bg-surface2"
            >
              {t("payment.downloadInvoice")}
              {detail.invoiceNumber ? ` · ${detail.invoiceNumber}` : ""}
            </a>
          )}
        </div>
      ) : detail.status === "cote" && justReserved ? (
        <div className="rounded-card border border-action/40 bg-action/10 p-6">
          <p className="text-sm text-action">{t("payment.reservedPending")}</p>
        </div>
      ) : detail.status === "cote" ? (
        <div className="rounded-card border border-border bg-surface p-6">
          <Link
            href={`/expediteur/expeditions/${detail.id}/payer`}
            className="block w-full rounded-btn bg-action px-4 py-3 text-center text-sm font-semibold text-bg hover:brightness-110"
          >
            {t("quote.payCta")}
          </Link>
        </div>
      ) : null}

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
          {detail.assignedCarrier && (
            <span>
              {t("quote.assignedCarrier")} :{" "}
              <span className="text-live">{detail.assignedCarrier}</span>
            </span>
          )}
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
