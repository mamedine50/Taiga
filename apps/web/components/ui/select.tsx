import type { ReactNode, SelectHTMLAttributes } from "react";

export function Select({
  label,
  name,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <select
        name={name}
        className={`w-full rounded-btn border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-action ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
