"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { CarrierDoc } from "@/lib/fleet";
import { getDocSignedUrl, reviewDocument } from "@/app/(app)/admin/doc-actions";
import { DOC_STATUS_CLASS, DOC_STATUS_KEY, DOC_TYPE_KEY } from "@/components/fleet/doc-labels";

export function DocReview({ docs }: { docs: CarrierDoc[] }) {
  const t = useTranslations();
  const [pending, start] = useTransition();

  const view = (path: string) =>
    start(async () => {
      const r = await getDocSignedUrl(path);
      if (r.url) window.open(r.url, "_blank");
    });

  if (docs.length === 0) return <p className="text-sm text-muted">{t("docs.empty")}</p>;

  return (
    <div className="space-y-2">
      {docs.map((d) => (
        <div
          key={d.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-btn border border-border bg-surface2 px-4 py-3 text-sm"
        >
          <span className="font-medium">{t(DOC_TYPE_KEY[d.type] ?? "docs.typeAutre")}</span>
          <div className="flex items-center gap-2">
            <span className={`rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${DOC_STATUS_CLASS[d.status] ?? ""}`}>
              {t(DOC_STATUS_KEY[d.status] ?? "docs.statusEnAttente")}
            </span>
            <button type="button" onClick={() => view(d.fileUrl)} className="text-xs text-muted hover:text-text">
              {t("docs.view")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => reviewDocument(d.id, "valide").then(() => {}))}
              className="rounded-btn border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success disabled:opacity-60"
            >
              {t("docs.approve")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => reviewDocument(d.id, "refuse").then(() => {}))}
              className="rounded-btn border border-error/40 px-2.5 py-1 text-xs font-semibold text-error disabled:opacity-60"
            >
              {t("docs.refuse")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
