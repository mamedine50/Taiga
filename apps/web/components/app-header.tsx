import { getTranslations } from "next-intl/server";
import type { UserRole } from "@taiga/core";
import { getMyNotifications } from "@/lib/notifications";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";

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
  const notifications = await getMyNotifications();

  return (
    <header className="border-b border-border bg-surface/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-display text-xl font-bold">{t("common.appName")}</span>
        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications} />
          <UserMenu
            fullName={fullName}
          companyName={companyName}
          roleLabel={t(`roles.${role}`)}
          languageLabel={t("common.language")}
          signOutLabel={t("common.signOut")}
        />
        </div>
      </div>
    </header>
  );
}
