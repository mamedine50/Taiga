"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { signInAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const INITIAL: AuthState = {};

export function SignInForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState(signInAction, INITIAL);

  const errorMsg = state.error
    ? state.error === "invalid"
      ? t("auth.errorInvalidCredentials")
      : t("auth.errorGeneric")
    : null;

  return (
    <div className="rounded-card border border-border bg-surface p-8">
      <h1 className="font-display text-3xl font-bold">{t("auth.signInTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("auth.signInSubtitle")}</p>

      <form action={action} className="mt-6 space-y-4">
        <Field
          label={t("common.email")}
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <Field
          label={t("common.password")}
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        {errorMsg && <p className="text-sm text-error">{errorMsg}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t("common.loading") : t("auth.signInCta")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/inscription" className="font-semibold text-action hover:underline">
          {t("auth.goSignUp")}
        </Link>
      </p>
    </div>
  );
}
