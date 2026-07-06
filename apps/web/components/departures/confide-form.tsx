"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@taiga/i18n";
import type { CarrierRow } from "@/lib/dispatch";
import { confideDeparture } from "@/app/(app)/admin/departure-actions";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber } from "@/lib/format";

export function ConfideForm({
  departureId,
  subtotal,
  carriers,
}: {
  departureId: string;
  subtotal: number;
  carriers: CarrierRow[];
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [carrierId, setCarrierId] = useState("");
  const [payout, setPayout] = useState(String(Math.round(subtotal * 0.85 * 100) / 100));
  const [hours, setHours] = useState("48");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const verified = carriers.filter((c) => c.verified);
  const payoutNum = Number.parseFloat(payout) || 0;
  const margin = Math.round((subtotal - payoutNum) * 100) / 100;
  const marginPct = subtotal > 0 ? (margin / subtotal) * 100 : 0;

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} disabled={subtotal <= 0}>
        {t("departure.confide")}
      </Button>
    );
  }

  const submit = () => {
    setError(null);
    if (!carrierId) {
      setError(t("admin.noVerifiedCarrier"));
      return;
    }
    startTransition(async () => {
      const res = await confideDeparture({
        departureId,
        carrierId,
        carrierPayout: payoutNum,
        expiresHours: Number.parseFloat(hours) || 48,
      });
      if (res?.error) setError(t("departure.confideError"));
    });
  };

  const inputCls =
    "w-full rounded-btn border border-border bg-surface px-2.5 py-2 text-sm font-mono outline-none focus:border-action";

  return (
    <div className="space-y-4 rounded-card border border-action/40 bg-action/5 p-6">
      <h3 className="font-display text-base font-bold">{t("departure.confideTitle")}</h3>

      {verified.length === 0 ? (
        <p className="text-sm text-muted">{t("admin.noVerifiedCarrier")}</p>
      ) : (
        <>
          <select
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
            className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-action"
          >
            <option value="" disabled>
              {t("admin.chooseCarrier")}
            </option>
            {verified.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legalName}
                {c.city ? ` · ${c.city}` : ""}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] text-tertiary">{t("departure.carrierRevenue")}</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-tertiary">{t("departure.expiresHours")}</span>
              <input
                type="number"
                min="1"
                step="1"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          {/* Écran de validation clair : revenu transporteur + marge $ et % */}
          <div className="space-y-1 rounded-btn border border-border bg-surface p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("admin.subtotal")}</span>
              <span className="font-mono">{formatMoney(subtotal, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("departure.carrierRevenue")}</span>
              <span className="font-mono text-text">{formatMoney(payoutNum, locale)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <span className="text-muted">{t("departure.taigaMargin")}</span>
              <span className="font-mono font-semibold text-live">
                {formatMoney(margin, locale)} · {formatNumber(marginPct, locale, 1)} %
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? t("common.saving") : t("departure.confirmConfide")}
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-btn border border-border px-4 py-2.5 text-sm text-muted hover:text-text"
            >
              {t("common.cancel")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
