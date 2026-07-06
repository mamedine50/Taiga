import type { Locale } from "@taiga/i18n";
import { formatNumber } from "@/lib/format";

export function FillGauge({
  label,
  booked,
  capacity,
  unit,
  digits = 0,
  locale,
}: {
  label: string;
  booked: number;
  capacity: number | null;
  unit: string;
  digits?: number;
  locale: Locale;
}) {
  const cap = capacity ?? 0;
  const pct = cap > 0 ? Math.min(100, (booked / cap) * 100) : 0;
  const over = cap > 0 && booked > cap;

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-tertiary">{label}</span>
        <span className={`font-mono ${over ? "text-error" : "text-muted"}`}>
          {formatNumber(booked, locale, digits)} / {formatNumber(cap, locale, digits)} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-pill bg-surface2">
        <div
          className={`h-full rounded-pill ${over ? "bg-error" : "bg-live"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
