"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@taiga/i18n";
import type { CarrierFleet, OfferedMission } from "@/lib/dispatch";
import { acceptMission, refuseMission } from "@/app/(app)/transporteur/actions";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber } from "@/lib/format";

function timeLeft(expiresAt: string | null, t: (k: string) => string): { text: string; expired: boolean } {
  if (!expiresAt) return { text: "—", expired: false };
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { text: t("mission.expired"), expired: true };
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return { text: `${Math.floor(hours / 24)} ${t("mission.daysShort")}`, expired: false };
  return { text: `${hours} ${t("mission.hoursShort")}`, expired: false };
}

export function MissionCard({
  mission,
  fleet,
}: {
  mission: OfferedMission;
  fleet: CarrierFleet;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState(fleet.drivers[0]?.id ?? "");
  const [vehicleId, setVehicleId] = useState(fleet.vehicles[0]?.id ?? "");

  const multiFleet = fleet.drivers.length > 1 || fleet.vehicles.length > 1;
  const noFleet = fleet.drivers.length === 0 || fleet.vehicles.length === 0;
  const { text: expText, expired } = timeLeft(mission.expiresAt, t);

  const onAccept = () => {
    setError(null);
    if (multiFleet && (!driverId || !vehicleId)) {
      setError(t("mission.needSelection"));
      return;
    }
    startTransition(async () => {
      const res = await acceptMission(
        mission.id,
        multiFleet ? driverId : undefined,
        multiFleet ? vehicleId : undefined,
      );
      if (res?.error === "selection") setError(t("mission.needSelection"));
      else if (res?.error === "expired") setError(t("mission.expired"));
      else if (res?.error) setError(t("mission.acceptError"));
    });
  };

  const onRefuse = () => {
    setError(null);
    startTransition(async () => {
      await refuseMission(mission.id);
    });
  };

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-action">{mission.ref ?? "—"}</p>
          <p className="mt-1 text-sm text-muted">
            {mission.originCity} → {mission.destCity}
          </p>
          <p className="mt-1 text-xs text-tertiary">
            {t("mission.weight")} :{" "}
            <span className="font-mono">{formatNumber(mission.chargeableWeightKg, locale)} kg</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-tertiary">{t("mission.netRevenue")}</p>
          <p className="font-mono text-2xl font-bold text-live">
            {formatMoney(mission.carrierPayout, locale)}
          </p>
          <p className={`mt-1 text-xs ${expired ? "text-error" : "text-muted"}`}>
            {t("mission.expiresIn")} : {expText}
          </p>
        </div>
      </div>

      {multiFleet && !expired && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-tertiary">{t("mission.selectDriver")}</span>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface2 px-3 py-2 text-sm outline-none focus:border-action"
            >
              <option value="">{t("mission.chooseDriver")}</option>
              {fleet.drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-tertiary">{t("mission.selectVehicle")}</span>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface2 px-3 py-2 text-sm outline-none focus:border-action"
            >
              <option value="">{t("mission.chooseVehicle")}</option>
              {fleet.vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {noFleet && <p className="mt-3 text-sm text-error">{t("carrierSpace.noFleet")}</p>}
      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={onAccept} disabled={pending || expired || noFleet}>
          {pending ? t("mission.accepting") : t("mission.accept")}
        </Button>
        <button
          type="button"
          onClick={onRefuse}
          disabled={pending}
          className="rounded-btn border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-error disabled:opacity-60"
        >
          {t("mission.refuse")}
        </button>
      </div>
    </div>
  );
}
