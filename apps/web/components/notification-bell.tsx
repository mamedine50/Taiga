"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Notification } from "@/lib/notifications";
import { markAllNotificationsRead } from "@/app/(app)/notif-actions";

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-btn border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface2"
        aria-label={t("notif.title")}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-pill bg-action px-1.5 text-[10px] font-bold text-bg">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-card border border-border bg-surface2 p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{t("notif.title")}</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="text-xs text-action hover:underline"
                >
                  {t("notif.markAllRead")}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted">{t("notif.empty")}</p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-btn px-3 py-2 text-sm ${n.read ? "text-muted" : "bg-surface text-text"}`}
                  >
                    <p className="font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-muted">{n.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
