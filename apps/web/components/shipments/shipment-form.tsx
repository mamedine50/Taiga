"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cbmFromDimensions, chargeableWeightKg } from "@taiga/core";
import type { Locale } from "@taiga/i18n";
import type { CorridorOption } from "@/lib/shipments";
import {
  createShipmentAndQuote,
  type ShipmentItemInput,
} from "@/app/(app)/expediteur/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { formatNumber } from "@/lib/format";

type ItemRow = {
  description: string;
  qty: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  stackable: boolean;
  dangerous: boolean;
};

const emptyItem = (): ItemRow => ({
  description: "",
  qty: "1",
  length: "",
  width: "",
  height: "",
  weight: "",
  stackable: true,
  dangerous: false,
});

const num = (s: string): number => {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export function ShipmentForm({ corridors }: { corridors: CorridorOption[] }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Formulaire entièrement contrôlé (aucune réinitialisation à la soumission).
  const [corridorId, setCorridorId] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [destAddress, setDestAddress] = useState("");
  const [destCity, setDestCity] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [flexible, setFlexible] = useState(true);
  const [declaredValue, setDeclaredValue] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  const selected = corridors.find((c) => c.id === corridorId) ?? null;

  const totals = useMemo(() => {
    let weight = 0;
    let cbm = 0;
    for (const it of items) {
      const q = num(it.qty);
      weight += num(it.weight) * q;
      cbm += cbmFromDimensions(num(it.length), num(it.width), num(it.height), q);
    }
    return { weight, cbm, chargeable: chargeableWeightKg(weight, cbm) };
  }, [items]);

  const updateItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (i: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!corridorId) {
      setError(t("form.needCorridor"));
      return;
    }
    const payloadItems: ShipmentItemInput[] = items
      .filter((it) => it.description.trim() !== "")
      .map((it) => ({
        description: it.description.trim(),
        qty: Math.max(1, Math.round(num(it.qty))),
        lengthCm: num(it.length),
        widthCm: num(it.width),
        heightCm: num(it.height),
        weightKgEach: num(it.weight),
        stackable: it.stackable,
        dangerous: it.dangerous,
      }));
    if (payloadItems.length === 0) {
      setError(t("form.needItem"));
      return;
    }

    startTransition(async () => {
      const res = await createShipmentAndQuote({
        corridorId,
        originAddress: originAddress.trim(),
        originCity: originCity.trim(),
        destAddress: destAddress.trim(),
        destCity: destCity.trim(),
        requestedDate,
        flexible,
        declaredValue: declaredValue ? num(declaredValue) : null,
        items: payloadItems,
      });
      if (res?.error === "corridor") setError(t("form.needCorridor"));
      else if (res?.error === "items") setError(t("form.needItem"));
      else if (res?.error === "norate") setError(t("form.errorNoRate"));
      else if (res?.error) setError(t("form.errorGeneric"));
      // succès → l'action redirige vers le détail
    });
  };

  const card = "rounded-card border border-border bg-surface p-6";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Trajet */}
      <section className={card}>
        <h2 className="mb-4 font-display text-lg font-bold">{t("form.routeSection")}</h2>
        <Select
          label={t("form.corridor")}
          name="corridor"
          value={corridorId}
          onChange={(e) => setCorridorId(e.target.value)}
          required
        >
          <option value="" disabled>
            {t("form.chooseCorridor")}
          </option>
          {corridors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </Select>

        {selected && (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 rounded-btn border border-border bg-surface2 px-3 py-2 text-xs text-muted">
            <span>
              {selected.originRegion} → {selected.destRegion}
            </span>
            {selected.serviceDays && selected.serviceDays.length > 0 && (
              <span>
                {t("form.corridorServiceDays")} : {selected.serviceDays.join(", ")}
              </span>
            )}
            {selected.cellularCoverage && (
              <span>
                {t("form.corridorCoverage")} : {selected.cellularCoverage}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">
              {t("form.pickup")}
            </p>
            <Field
              label={t("form.address")}
              name="originAddress"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              required
            />
            <Field
              label={t("form.cityLabel")}
              name="originCity"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">
              {t("form.delivery")}
            </p>
            <Field
              label={t("form.address")}
              name="destAddress"
              value={destAddress}
              onChange={(e) => setDestAddress(e.target.value)}
              required
            />
            <Field
              label={t("form.cityLabel")}
              name="destCity"
              value={destCity}
              onChange={(e) => setDestCity(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            label={t("form.requestedDate")}
            name="requestedDate"
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            required
          />
          <Field
            label={t("form.declaredValue")}
            name="declaredValue"
            type="number"
            min="0"
            step="0.01"
            value={declaredValue}
            onChange={(e) => setDeclaredValue(e.target.value)}
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={flexible}
            onChange={(e) => setFlexible(e.target.checked)}
            className="accent-[color:var(--color-action)]"
          />
          {t("form.flexible")}
        </label>
      </section>

      {/* Marchandise */}
      <section className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t("form.goodsSection")}</h2>
          <button
            type="button"
            onClick={addItem}
            className="rounded-btn border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface2"
          >
            + {t("form.addItem")}
          </button>
        </div>

        <div className="space-y-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-btn border border-border bg-surface2 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-tertiary">
                  {t("form.item")} {i + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-xs font-medium text-error hover:underline"
                  >
                    {t("form.removeItem")}
                  </button>
                )}
              </div>

              <input
                value={it.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                placeholder={t("form.description")}
                className="mb-3 w-full rounded-btn border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-action"
              />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <NumberField label={t("form.qty")} value={it.qty} onChange={(v) => updateItem(i, { qty: v })} />
                <NumberField label={t("form.lengthCm")} value={it.length} onChange={(v) => updateItem(i, { length: v })} />
                <NumberField label={t("form.widthCm")} value={it.width} onChange={(v) => updateItem(i, { width: v })} />
                <NumberField label={t("form.heightCm")} value={it.height} onChange={(v) => updateItem(i, { height: v })} />
                <NumberField label={t("form.weightEach")} value={it.weight} onChange={(v) => updateItem(i, { weight: v })} />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={it.stackable}
                    onChange={(e) => updateItem(i, { stackable: e.target.checked })}
                    className="accent-[color:var(--color-action)]"
                  />
                  {t("form.stackable")}
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={it.dangerous}
                    onChange={(e) => updateItem(i, { dangerous: e.target.checked })}
                    className="accent-[color:var(--color-error)]"
                  />
                  {t("form.dangerous")}
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu + soumission */}
      <section className={`${card} sticky bottom-4`}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
          {t("form.previewTitle")}
        </p>
        <div className="grid grid-cols-3 gap-4">
          <Metric label={t("form.totalWeight")} value={`${formatNumber(totals.weight, locale)} kg`} />
          <Metric label={t("form.totalCbm")} value={`${formatNumber(totals.cbm, locale, 3)} m³`} />
          <Metric
            label={t("form.chargeableWeight")}
            value={`${formatNumber(totals.chargeable, locale)} kg`}
            highlight
          />
        </div>

        {error && <p className="mt-4 text-sm text-error">{error}</p>}

        <Button type="submit" disabled={pending} className="mt-4 w-full">
          {pending ? t("common.saving") : t("form.getQuote")}
        </Button>
      </section>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-tertiary">{label}</span>
      <input
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-btn border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-action"
      />
    </label>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-tertiary">{label}</p>
      <p className={`mt-0.5 font-mono text-sm ${highlight ? "font-semibold text-live" : "text-text"}`}>
        {value}
      </p>
    </div>
  );
}
