import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import { requireRole } from "@/lib/auth";
import { getDocuments } from "@/lib/fleet";
import { uploadDocument } from "@/app/(app)/transporteur/fleet-actions";
import { formatDate } from "@/lib/format";
import { DOC_STATUS_CLASS, DOC_STATUS_KEY, DOC_TYPE_KEY, DOC_TYPES } from "@/components/fleet/doc-labels";
import { DeleteDocButton } from "@/components/fleet/delete-doc-button";

export default async function DocumentsPage() {
  const ctx = await requireRole("carrier");
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const docs = ctx.company ? await getDocuments(ctx.company.id) : [];

  const input =
    "rounded-btn border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-action";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t("docs.title")}</h1>
        <Link href="/transporteur" className="text-sm text-muted hover:text-text">
          ← {t("dashboard.carrierHome")}
        </Link>
      </div>

      <form action={uploadDocument} className="space-y-4 rounded-card border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold">{t("docs.upload")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">{t("docs.type")}</span>
            <select name="type" required className={`w-full ${input}`} defaultValue="">
              <option value="" disabled>
                {t("docs.type")}
              </option>
              {DOC_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {t(DOC_TYPE_KEY[dt] ?? "docs.typeAutre")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">{t("docs.expiresAt")}</span>
            <input type="date" name="expiresAt" className={`w-full ${input}`} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">{t("docs.file")}</span>
            <input type="file" name="file" required accept="application/pdf,image/*" className={`w-full ${input}`} />
          </label>
        </div>
        <button type="submit" className="rounded-btn bg-action px-4 py-2.5 text-sm font-semibold text-bg hover:brightness-110">
          {t("docs.upload")}
        </button>
      </form>

      <div className="rounded-card border border-border bg-surface p-6">
        {docs.length === 0 ? (
          <p className="text-sm text-muted">{t("docs.empty")}</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-btn border border-border bg-surface2 px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium">{t(DOC_TYPE_KEY[d.type] ?? "docs.typeAutre")}</span>
                  {d.expiresAt && (
                    <span className="ml-2 text-xs text-tertiary">{t("docs.expiresAt")} : {formatDate(d.expiresAt, locale)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${DOC_STATUS_CLASS[d.status] ?? ""}`}>
                    {t(DOC_STATUS_KEY[d.status] ?? "docs.statusEnAttente")}
                  </span>
                  <DeleteDocButton id={d.id} path={d.fileUrl} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
