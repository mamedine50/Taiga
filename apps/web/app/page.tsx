import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { dashboardPath, getUserContext } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function Home() {
  const ctx = await getUserContext();
  if (ctx) redirect(dashboardPath(ctx.role));

  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-6">
        <span className="font-display text-xl font-bold">Taïga</span>
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="rounded-pill border border-live/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-live">
          Québec · Nord
        </span>
        <h1 className="mt-4 font-display text-6xl font-black tracking-tight">Taïga</h1>
        <p className="mt-3 max-w-xl text-lg text-muted">{t("common.tagline")}</p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/inscription"
            className="rounded-btn bg-action px-5 py-2.5 text-sm font-semibold text-bg hover:brightness-110"
          >
            {t("common.signUp")}
          </Link>
          <Link
            href="/connexion"
            className="rounded-btn border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface2"
          >
            {t("common.signIn")}
          </Link>
        </div>
      </main>
    </div>
  );
}
