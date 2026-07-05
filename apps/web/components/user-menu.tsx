"use client";

import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { signOutAction } from "@/app/(app)/actions";

export function UserMenu({
  fullName,
  companyName,
  roleLabel,
  languageLabel,
  signOutLabel,
}: {
  fullName: string;
  companyName: string | null;
  roleLabel: string;
  languageLabel: string;
  signOutLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-btn border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface2"
      >
        <span className="font-medium">{fullName}</span>
        <span className="text-tertiary">▾</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-card border border-border bg-surface2 p-4 shadow-xl">
            <p className="text-sm font-semibold">{fullName}</p>
            {companyName && <p className="mt-0.5 text-xs text-muted">{companyName}</p>}
            <p className="mt-0.5 text-xs text-tertiary">{roleLabel}</p>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-muted">{languageLabel}</p>
              <LanguageSwitcher />
            </div>

            <form action={signOutAction} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-btn border border-border px-3 py-2 text-sm font-medium text-error hover:bg-error/10"
              >
                {signOutLabel}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
