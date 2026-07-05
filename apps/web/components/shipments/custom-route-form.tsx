"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestCustomRoute } from "@/app/(app)/expediteur/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function CustomRouteForm() {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (fd: FormData) => {
    setError(null);
    const val = (k: string) => String(fd.get(k) ?? "").trim();
    startTransition(async () => {
      const res = await requestCustomRoute({
        originCity: val("originCity"),
        originAddress: val("originAddress") || undefined,
        destCity: val("destCity"),
        destAddress: val("destAddress") || undefined,
        requestedDate: val("requestedDate") || undefined,
        notes: val("notes") || undefined,
      });
      if (res?.error) setError(t("customRoute.errorGeneric"));
      else setDone(true);
    });
  };

  if (done) {
    return (
      <div className="rounded-card border border-success/40 bg-success/10 p-6">
        <h2 className="font-display text-lg font-bold text-success">
          {t("customRoute.successTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("customRoute.successBody")}</p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-card border border-border bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("customRoute.originCity")} name="originCity" required />
        <Field label={t("customRoute.destCity")} name="destCity" required />
        <Field label={t("customRoute.originAddress")} name="originAddress" />
        <Field label={t("customRoute.destAddress")} name="destAddress" />
      </div>
      <Field label={t("customRoute.requestedDate")} name="requestedDate" type="date" />
      <Textarea label={t("customRoute.notes")} name="notes" rows={4} />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("common.saving") : t("customRoute.submit")}
      </Button>
    </form>
  );
}
