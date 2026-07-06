"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { CorridorOption } from "@/lib/shipments";
import { createDeparture } from "@/app/(app)/admin/departure-actions";
import { Button } from "@/components/ui/button";

const DEFAULT_PRESET = { kg: 40000, cbm: 100, lf: 53 };
const PRESETS: Record<string, { kg: number; cbm: number; lf: number }> = {
  dry_van_53: DEFAULT_PRESET,
  dry_van_48: { kg: 38000, cbm: 90, lf: 48 },
  cube: { kg: 4500, cbm: 25, lf: 16 },
};

export function CreateDepartureForm({ corridors }: { corridors: CorridorOption[] }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [corridorId, setCorridorId] = useState("");
  const [date, setDate] = useState("");
  const [terminal, setTerminal] = useState("");
  const [preset, setPreset] = useState("dry_van_53");
  const [kg, setKg] = useState(String(DEFAULT_PRESET.kg));
  const [cbm, setCbm] = useState(String(DEFAULT_PRESET.cbm));
  const [lf, setLf] = useState(String(DEFAULT_PRESET.lf));

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = PRESETS[key];
    if (p) {
      setKg(String(p.kg));
      setCbm(String(p.cbm));
      setLf(String(p.lf));
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createDeparture({
        corridorId,
        date,
        terminal,
        capKg: Number.parseFloat(kg) || 0,
        capCbm: Number.parseFloat(cbm) || 0,
        capLf: Number.parseFloat(lf) || 0,
      });
      if (res?.error) setError(t("departure.confideError"));
    });
  };

  const inputCls =
    "w-full rounded-btn border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-action";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-bold">{t("departure.createTitle")}</h2>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">{t("departure.corridor")}</span>
        <select
          value={corridorId}
          onChange={(e) => setCorridorId(e.target.value)}
          required
          className={inputCls}
        >
          <option value="" disabled>
            {t("departure.chooseCorridor")}
          </option>
          {corridors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">{t("departure.date")}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">{t("departure.terminal")}</span>
          <input value={terminal} onChange={(e) => setTerminal(e.target.value)} required className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">{t("departure.capacityPreset")}</span>
        <select value={preset} onChange={(e) => applyPreset(e.target.value)} className={inputCls}>
          <option value="dry_van_53">Dry van 53'</option>
          <option value="dry_van_48">Dry van 48'</option>
          <option value="cube">Cube</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] text-tertiary">{t("departure.capacityKg")}</span>
          <input type="number" min="0" value={kg} onChange={(e) => { setKg(e.target.value); setPreset("custom"); }} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-tertiary">{t("departure.capacityCbm")}</span>
          <input type="number" min="0" value={cbm} onChange={(e) => { setCbm(e.target.value); setPreset("custom"); }} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-tertiary">{t("departure.capacityLf")}</span>
          <input type="number" min="0" value={lf} onChange={(e) => { setLf(e.target.value); setPreset("custom"); }} className={inputCls} />
        </label>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("departure.confirm")}
      </Button>
    </form>
  );
}
