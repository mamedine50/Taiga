import { getTranslations } from "next-intl/server";

const BAR: Record<string, string> = {
  cote: "bg-live",
  reserve: "bg-action",
  assigne: "bg-action",
  en_transit: "bg-action",
  livre: "bg-success",
  complete: "bg-success",
};

export async function StatusBreakdown({ data }: { data: { status: string; count: number }[] }) {
  const t = await getTranslations();
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-bold">{t("kpi.byStatus")}</h2>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("admin.toAssignEmpty")}</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {data.map((d) => (
            <div key={d.status} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted">{t(`status.${d.status}`)}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-pill bg-surface2">
                <div
                  className={`h-full rounded-pill ${BAR[d.status] ?? "bg-muted"}`}
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-sm">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
