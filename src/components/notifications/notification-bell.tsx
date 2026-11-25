"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/notification-store";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const dot = { info: "bg-info", success: "bg-success", warning: "bg-warning" } as const;
const POLL_MS = 60_000;

/** Bell with an unread badge and a dropdown of the latest notifications. Renders only for logged-in users. */
export function NotificationBell() {
  const { status, data: session } = useSession();
  const authed = status === "authenticated" && Boolean(session?.user?.id);
  const pathname = usePathname();
  const router = useRouter();
  const { unread, items, loading, refreshCount, loadLatest, markRead, markAllRead, reset } = useNotificationStore();
  // "Open" is tied to the page it was opened on, so it closes itself on navigation with no effect needed.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const rootRef = useRef<HTMLDivElement>(null);

  // Poll the unread count (only while the tab is visible), and refresh when the user comes back to the tab.
  useEffect(() => {
    if (!authed) {
      reset();
      return;
    }
    void refreshCount();
    const tick = () => document.visibilityState === "visible" && void refreshCount();
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [authed, refreshCount, reset]);

  // Close on navigation, outside click, Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpenedAt(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedAt(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!authed) return null;

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpenedAt(open ? null : pathname);
          if (!open) void loadLatest();
        }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-field border border-base-300 bg-base-100 hover:bg-base-200"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-accent-content"
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Your notifications"
          className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
            <h2 className="font-sans text-sm font-bold">Notifications</h2>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => void markAllRead()}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:cursor-default disabled:text-base-content/40 disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>

          <ul className="max-h-[22rem] divide-y divide-base-300 overflow-y-auto">
            {loading && items.length === 0 && <li className="px-4 py-6 text-center text-sm text-base-content/60">Loading…</li>}
            {!loading && items.length === 0 && <li className="px-4 py-8 text-center text-sm text-base-content/60">You have no notifications yet.</li>}
            {items.map((n) => {
              const href = n.link ? safeRedirectPath(n.link, "") : "";
              const body = (
                <>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : dot[n.level])} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm leading-5", n.read ? "font-medium" : "font-bold")}>{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[13px] leading-5 text-base-content/70">{n.body}</span>
                    <span className="mt-1 block text-xs text-base-content/50">
                      {timeAgo(n.createdAt)}
                      {!n.read && <span className="sr-only"> (unread)</span>}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={n.id} className={cn(!n.read && "bg-primary/[0.04]")}>
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => {
                        if (!n.read) void markRead([n.id]);
                        setOpenedAt(null);
                      }}
                      className="flex gap-3 px-4 py-3 hover:bg-base-200"
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !n.read && void markRead([n.id])}
                      className="flex w-full gap-3 px-4 py-3 text-left hover:bg-base-200"
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-base-300 bg-base-200/50 px-4 py-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => {
                setOpenedAt(null);
                router.refresh();
              }}
              className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
