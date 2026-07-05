"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { LOCALES, type Locale } from "@taiga/i18n";
import { setLocale } from "@/i18n/locale";

/** Sélecteur FR/EN — visible sur la connexion et dans le menu utilisateur. */
export function LanguageSwitcher() {
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex items-center rounded-pill border border-border bg-surface p-0.5">
      {LOCALES.map((l) => {
        const active = current === l;
        return (
          <button
            key={l}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setLocale(l as Locale))}
            aria-pressed={active}
            className={`rounded-pill px-3 py-1 text-xs font-semibold uppercase transition-colors ${
              active ? "bg-action text-bg" : "text-muted hover:text-text"
            } disabled:opacity-60`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
