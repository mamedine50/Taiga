"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@taiga/i18n";
import type { CarrierRow } from "@/lib/dispatch";
import { assignMission } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

export function AssignForm({
  shipmentId,
  subtotal,
  carriers,
}: {
  shipmentId: string;
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
  const fee = Math.round((subtotal - payoutNum) * 100) / 100;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-btn bg-action px-3 py-1.5 text-xs font-semibold text-bg hover:brightness-110"
      >
        {t("admin.assign")}
      </button>
    );
  }

  const submit = () => {
    setError(null);
    if (!carrierId) {
      setError(t("admin.noVerifiedCarrier"));
      return;
    }
    startTransition(async () => {
      const res = await assignMission({
        shipmentId,
        carrierId,
        carrierPayout: payoutNum,
        expiresHours: Number.parseFloat(hours) || 48,
      });
      if (res?.error) setError(t("admin.assignError"));
      else setOpen(false);
    });
  };

  return (
    <div className="mt-3 space-y-3 rounded-btn border border-border bg-surface2 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">
        {t("admin.assignTitle")}
      </p>

      {verified.length === 0 ? (
        <p className="text-sm text-muted">{t("admin.noVerifiedCarrier")}</p>
      ) : (
        <>
          <select
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
            className="w-full rounded-btn border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-action"
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

          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-[11px] text-tertiary">{t("admin.carrierPayout")}</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface px-2.5 py-2 font-mono outline-none focus:border-action"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-tertiary">{t("admin.expiresHours")}</span>
              <input
                type="number"
                min="1"
                step="1"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-btn border border-border bg-surface px-2.5 py-2 font-mono outline-none focus:border-action"
              />
            </label>
          </div>

          <div className="flex justify-between text-xs text-muted">
            <span>
              {t("admin.subtotal")} :{" "}
              <span className="font-mono text-text">{formatMoney(subtotal, locale)}</span>
            </span>
            <span>
              {t("admin.platformFee")} :{" "}
              <span className="font-mono text-live">{formatMoney(fee, locale)}</span>
            </span>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? t("common.saving") : t("admin.confirmAssign")}
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
