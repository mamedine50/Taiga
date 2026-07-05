const COLORS: Record<string, string> = {
  brouillon: "text-tertiary border-tertiary/40 bg-tertiary/10",
  cote: "text-live border-live/40 bg-live/10",
  reserve: "text-action border-action/40 bg-action/10",
  assigne: "text-action border-action/40 bg-action/10",
  ramassage: "text-action border-action/40 bg-action/10",
  en_transit: "text-action border-action/40 bg-action/10",
  livre: "text-success border-success/40 bg-success/10",
  complete: "text-success border-success/40 bg-success/10",
  annule: "text-error border-error/40 bg-error/10",
  litige: "text-error border-error/40 bg-error/10",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const cls = COLORS[status] ?? "text-muted border-border bg-surface2";
  return (
    <span className={`inline-flex rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
