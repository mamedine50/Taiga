type Accent = "default" | "action" | "live" | "success";

const ACCENT: Record<Accent, string> = {
  default: "text-text",
  action: "text-action",
  live: "text-live",
  success: "text-success",
};

export function StatTile({
  label,
  value,
  sub,
  accent = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: Accent;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-tertiary">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${ACCENT[accent]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
