import { getTranslations } from "next-intl/server";
import type { UserRole } from "@taiga/core";
import { UserMenu } from "@/components/user-menu";

export async function AppHeader({
  fullName,
  companyName,
  role,
}: {
  fullName: string;
  companyName: string | null;
  role: UserRole;
}) {
  const t = await getTranslations();

  return (
    <header className="border-b border-border bg-surface/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-display text-xl font-bold">{t("common.appName")}</span>
        <UserMenu
          fullName={fullName}
          companyName={companyName}
          roleLabel={t(`roles.${role}`)}
          languageLabel={t("common.language")}
          signOutLabel={t("common.signOut")}
        />
      </div>
    </header>
  );
}
