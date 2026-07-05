import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import type { ShipmentDetail } from "@/lib/shipments";
import { formatMoney, formatNumber } from "@/lib/format";

type Line = { code: string; amount: number; pct?: number };

const LINE_KEY: Record<string, string> = {
  fret: "quote.lineFret",
  carburant: "quote.lineCarburant",
  saison: "quote.lineSaison",
  manutention: "quote.lineManutention",
  assurance: "quote.lineAssurance",
  remise_retour: "quote.lineRemiseRetour",
};

export async function QuoteBreakdown({ detail }: { detail: ShipmentDetail }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const currency = detail.currency ?? "CAD";

  const bd =
    detail.quoteBreakdown &&
    typeof detail.quoteBreakdown === "object" &&
    !Array.isArray(detail.quoteBreakdown)
      ? (detail.quoteBreakdown as Record<string, unknown>)
      : null;

  const lines = (Array.isArray(bd?.lines) ? (bd.lines as unknown as Line[]) : []).filter(
    (l) => l && typeof l.amount === "number" && l.amount !== 0,
  );
  const season = typeof bd?.season === "string" ? bd.season : null;

  const Row = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={strong ? "text-text" : "text-muted"}>{label}</span>
      <span className={`font-mono ${strong ? "text-text" : "text-muted"}`}>{value}</span>
    </div>
  );

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-bold">{t("quote.detail")}</h2>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
        <span>
          {t("quote.chargeableWeight")} :{" "}
          <span className="font-mono text-text">
            {formatNumber(detail.chargeableWeightKg, locale)} kg
          </span>
        </span>
        {season && (
          <span>
            {t("quote.season")} :{" "}
            <span className="font-mono text-text capitalize">{season}</span>
          </span>
        )}
      </div>

      <dl className="mt-4 divide-y divide-border">
        {lines.map((l) => (
          <div key={l.code} className="flex items-center justify-between py-2 text-sm">
            <dt className="text-muted">
              {t(LINE_KEY[l.code] ?? "quote.detail")}
              {typeof l.pct === "number" && l.pct !== 0
                ? ` (${formatNumber(l.pct, locale, Number.isInteger(l.pct) ? 0 : 2)} %)`
                : ""}
            </dt>
            <dd className="font-mono">{formatMoney(l.amount, locale, currency)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-2 border-t border-border pt-2">
        <Row label={t("quote.subtotal")} value={formatMoney(detail.subtotal, locale, currency)} />
        <Row label={t("quote.gst")} value={formatMoney(detail.gst, locale, currency)} />
        <Row label={t("quote.qst")} value={formatMoney(detail.qst, locale, currency)} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-display text-base font-bold">{t("quote.total")}</span>
        <span className="font-mono text-xl font-bold text-live">
          {formatMoney(detail.totalAmount, locale, currency)}
        </span>
      </div>
    </div>
  );
}
