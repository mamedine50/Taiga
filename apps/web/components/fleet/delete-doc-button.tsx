"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteDocument } from "@/app/(app)/transporteur/fleet-actions";

export function DeleteDocButton({ id, path }: { id: string; path: string }) {
  const t = useTranslations();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteDocument(id, path).then(() => {}))}
      className="text-xs font-medium text-muted hover:text-error disabled:opacity-60"
    >
      {t("docs.delete")}
    </button>
  );
}
