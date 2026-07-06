import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getCarriers } from "@/lib/dispatch";
import { getDepartureDetail } from "@/lib/departures";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { FillGauge } from "@/components/departures/fill-gauge";
import { ConfideForm } from "@/components/departures/confide-form";
import { AddButton, RemoveButton } from "@/components/departures/shipment-toggle";

export default async function DepartureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const [detail, carriers] = await Promise.all([getDepartureDetail(id), getCarriers()]);
  if (!detail) notFound();

  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const d = detail.departure;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/departs" className="text-sm text-muted hover:text-text">
          ← {t("departure.backToList")}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">
          <span className="font-mono text-action">{d.corridorCode}</span> · {d.terminalCity}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {d.corridorName} · {formatDate(d.date, locale)}
        </p>
      </div>

      {/* Jauge */}
      <div className="rounded-card border border-border bg-surface p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
          {t("departure.fill")}
        </p>
        <div className="space-y-3">
          <FillGauge label="kg" booked={d.bookedKg} capacity={d.capacityKg} unit="kg" locale={locale} />
          <FillGauge label="m³" booked={d.bookedCbm} capacity={d.capacityCbm} unit="m³" digits={2} locale={locale} />
          <FillGauge label="pi lin." booked={d.bookedLf} capacity={d.capacityLf} unit="pi" digits={1} locale={locale} />
        </div>
      </div>

      {/* Expéditions groupées */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="mb-3 font-display text-lg font-bold">{t("departure.grouped")}</h2>
        {detail.grouped.length === 0 ? (
          <p className="text-sm text-muted">{t("departure.groupedEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {detail.grouped.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-btn border border-border bg-surface2 px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-mono text-action">{s.ref}</span>
                  <span className="ml-2 text-muted">
                    {s.originCity} → {s.destCity}
                  </span>
                  <span className="ml-2 text-xs text-tertiary">
                    {formatNumber(s.weightKg, locale)} kg · {formatNumber(s.cbm, locale, 2)} m³
                  </span>
                </div>
                <RemoveButton departureId={d.id} shipmentId={s.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confier */}
      <ConfideForm departureId={d.id} subtotal={detail.groupedSubtotal} carriers={carriers} />

      {/* Expéditions disponibles */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="mb-3 font-display text-lg font-bold">{t("departure.addable")}</h2>
        {detail.addable.length === 0 ? (
          <p className="text-sm text-muted">{t("departure.addableEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {detail.addable.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-btn border border-border bg-surface2 px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-mono text-action">{s.ref}</span>
                  <span className="ml-2 text-muted">
                    {s.originCity} → {s.destCity}
                  </span>
                  <span className="ml-2 text-xs text-tertiary">
                    {formatNumber(s.weightKg, locale)} kg · {formatMoney(s.subtotal, locale)}
                  </span>
                </div>
                <AddButton departureId={d.id} shipmentId={s.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
