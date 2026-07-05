"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { signUpAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const INITIAL: AuthState = {};
const ROLES = ["shipper", "carrier"] as const;

export function SignUpForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [role, setRole] = useState<(typeof ROLES)[number]>("shipper");
  const [state, action, pending] = useActionState(signUpAction, INITIAL);

  const errorMsg = state.error
    ? state.error === "emailInUse"
      ? t("auth.errorEmailInUse")
      : t("auth.errorGeneric")
    : null;

  return (
    <div className="rounded-card border border-border bg-surface p-8">
      <h1 className="font-display text-3xl font-bold">{t("auth.signUpTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("auth.signUpSubtitle")}</p>

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="language" value={locale} />

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">
            {t("auth.chooseRole")}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`rounded-btn border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  role === r
                    ? "border-action bg-action/10 text-text"
                    : "border-border text-muted hover:text-text"
                }`}
              >
                {t(`roles.${r}`)}
              </button>
            ))}
          </div>
          {role === "carrier" && (
            <p className="mt-2 text-xs text-tertiary">{t("auth.carrierNote")}</p>
          )}
        </div>

        <Field label={t("common.fullName")} name="fullName" required autoComplete="name" />
        <Field label={t("common.email")} name="email" type="email" required autoComplete="email" />
        <Field
          label={t("common.password")}
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <div className="pt-2">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-tertiary">
            {t("auth.companySection")}
          </span>
          <div className="space-y-4">
            <Field label={t("auth.companyName")} name="companyName" required />
            <Field label={t("auth.neqOptional")} name="neq" />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("auth.city")} name="city" />
              <Field label={t("auth.phoneOptional")} name="phone" />
            </div>
          </div>
        </div>

        {errorMsg && <p className="text-sm text-error">{errorMsg}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t("common.loading") : t("auth.createAccountCta")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/connexion" className="font-semibold text-action hover:underline">
          {t("auth.goSignIn")}
        </Link>
      </p>
    </div>
  );
}
