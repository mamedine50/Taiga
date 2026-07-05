import { getTranslations } from "next-intl/server";
import type { UserContext } from "@/lib/auth";

export async function DashboardIntro({ ctx }: { ctx: UserContext }) {
  const t = await getTranslations();

  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h1 className="font-display text-2xl font-bold">
        {t("dashboard.welcome", { name: ctx.fullName })}
      </h1>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-tertiary">
            {t("dashboard.yourCompany")}
          </dt>
          <dd className="mt-0.5 text-sm">
            {ctx.company?.legalName ?? t("dashboard.noCompany")}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-tertiary">
            {t("dashboard.yourRole")}
          </dt>
          <dd className="mt-0.5 text-sm">{t(`roles.${ctx.role}`)}</dd>
        </div>
      </dl>
    </div>
  );
}
