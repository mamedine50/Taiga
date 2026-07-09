import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@taiga/i18n";
import type { PodView } from "@/lib/shipments";

export async function PodDisplay({ pod }: { pod: PodView }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const captured = pod.capturedAt
    ? new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(pod.capturedAt))
    : "—";

  return (
    <div className="rounded-card border border-live/40 bg-live/5 p-6">
      <h2 className="font-display text-lg font-bold text-live">{t("pod.title")}</h2>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <span>
          {t("pod.deliveredAt")} : <span className="text-text">{captured}</span>
        </span>
        {pod.signeeName && (
          <span>
            {t("pod.signee")} : <span className="text-text">{pod.signeeName}</span>
          </span>
        )}
      </div>

      <p className={`mt-2 text-sm ${pod.damages ? "text-error" : "text-success"}`}>
        {pod.damages ? t("pod.damages") : t("pod.noDamages")}
      </p>
      {pod.notes && <p className="mt-1 text-sm text-muted">{pod.notes}</p>}

      {pod.photoUrls.length > 0 && (
        <>
          <p className="mt-4 text-xs uppercase tracking-wide text-tertiary">{t("pod.photos")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pod.photoUrls.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={i} href={u} target="_blank" rel="noreferrer">
                <img
                  src={u}
                  alt={`POD ${i + 1}`}
                  className="h-24 w-24 rounded-btn border border-border object-cover"
                />
              </a>
            ))}
          </div>
        </>
      )}

      {pod.signatureUrl && (
        <>
          <p className="mt-4 text-xs uppercase tracking-wide text-tertiary">{t("pod.signature")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pod.signatureUrl}
            alt="signature"
            className="mt-2 h-28 rounded-btn border border-border object-contain"
          />
        </>
      )}
    </div>
  );
}
