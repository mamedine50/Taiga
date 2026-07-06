"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { verifyCarrier } from "@/app/(app)/admin/actions";

export function VerifyButton({ companyId, verified }: { companyId: string; verified: boolean }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => verifyCarrier(companyId, !verified))}
      className={`rounded-btn border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
        verified
          ? "border-border text-muted hover:text-text"
          : "border-success/40 bg-success/10 text-success hover:brightness-110"
      }`}
    >
      {verified ? t("admin.unverify") : t("admin.verify")}
    </button>
  );
}
