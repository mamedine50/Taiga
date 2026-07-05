import type { InputHTMLAttributes } from "react";

export function Field({
  label,
  name,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        name={name}
        className={`w-full rounded-btn border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none placeholder:text-tertiary focus:border-action ${className}`}
        {...props}
      />
    </label>
  );
}
