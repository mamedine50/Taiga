import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getActiveCorridors } from "@/lib/shipments";
import { getOpenDepartures } from "@/lib/departures";
import { formatDate } from "@/lib/format";
import { FillGauge } from "@/components/departures/fill-gauge";
import { CreateDepartureForm } from "@/components/departures/create-departure-form";

export default async function DepartsPage() {
  await requireRole("admin");
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const [departures, corridors] = await Promise.all([getOpenDepartures(), getActiveCorridors()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t("departure.title")}</h1>
        <Link href="/admin" className="text-sm text-muted hover:text-text">
          ← {t("admin.title")}
        </Link>
      </div>

      <CreateDepartureForm corridors={corridors} />

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">{t("departure.openDepartures")}</h2>
        {departures.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
            {t("departure.empty")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {departures.map((d) => (
              <Link
                key={d.id}
                href={`/admin/departs/${d.id}`}
                className="block rounded-card border border-border bg-surface p-5 hover:border-action/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-action">{d.corridorCode}</span>
                  <span className="text-xs text-tertiary">{formatDate(d.date, locale)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {d.corridorName} · {d.terminalCity}
                </p>
                <p className="mt-1 text-xs text-tertiary">
                  {t("mission.shipmentsCount", { count: d.shipmentCount })}
                </p>
                <div className="mt-4 space-y-2">
                  <FillGauge label="kg" booked={d.bookedKg} capacity={d.capacityKg} unit="kg" locale={locale} />
                  <FillGauge label="m³" booked={d.bookedCbm} capacity={d.capacityCbm} unit="m³" digits={2} locale={locale} />
                  <FillGauge label="pi" booked={d.bookedLf} capacity={d.capacityLf} unit="pi" digits={1} locale={locale} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
