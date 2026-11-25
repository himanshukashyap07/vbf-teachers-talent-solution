"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { useNotificationStore, type NotificationItem } from "@/store/notification-store";
import { Button } from "@/components/ui/button";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const bar = { info: "border-l-info", success: "border-l-success", warning: "border-l-warning" } as const;

/** Full list on /notifications: server-rendered first page, "Load more" pulls older ones. */
export function NotificationList({ initial, hasMoreInitial }: { initial: NotificationItem[]; hasMoreInitial: boolean }) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [loadingMore, setLoadingMore] = useState(false);
  const { markRead, markAllRead, setUnread } = useNotificationStore();

  const unreadHere = items.filter((i) => !i.read).length;

  async function read(ids: string[]) {
    setItems((list) => list.map((i) => (ids.includes(i.id) ? { ...i, read: true } : i)));
    await markRead(ids);
  }

  async function readAll() {
    setItems((list) => list.map((i) => ({ ...i, read: true })));
    await markAllRead();
  }

  async function loadMore() {
    const last = items[items.length - 1];
    if (!last) return;
    setLoadingMore(true);
    const res = await fetch(`/api/notifications?limit=20&before=${last.id}`);
    const json = await res.json().catch(() => null);
    setLoadingMore(false);
    if (res.ok && json?.ok) {
      setItems((list) => [...list, ...(json.data.items as NotificationItem[])]);
      setHasMore(json.data.hasMore);
      setUnread(json.data.unreadCount);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-10 text-center">
        <p className="font-semibold">You have no notifications yet</p>
        <p className="mt-1 text-sm text-base-content/65">Updates about your account, vacancies and payments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-base-content/65" aria-live="polite">
          {unreadHere > 0 ? `${unreadHere} unread` : "All caught up"}
        </p>
        <Button variant="outline" size="sm" onClick={readAll} disabled={unreadHere === 0}>
          <CheckCheck className="size-4" aria-hidden /> Mark all as read
        </Button>
      </div>

      <ul className="space-y-3">
        {items.map((n) => {
          const href = n.link ? safeRedirectPath(n.link, "") : "";
          return (
            <li
              key={n.id}
              className={cn(
                "rounded-box border border-l-4 border-base-300 bg-base-100 p-4 sm:p-5",
                bar[n.level],
                !n.read && "ring-1 ring-primary/20",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className={cn("font-sans text-base leading-6", n.read ? "font-semibold" : "font-bold")}>
                  {n.title}
                  {!n.read && <span className="ml-2 align-middle badge badge-primary badge-sm">New</span>}
                </h2>
                <time dateTime={n.createdAt} className="shrink-0 text-xs text-base-content/55">
                  {timeAgo(n.createdAt)}
                </time>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.9375rem] leading-7 text-base-content/80">{n.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {href && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={href} onClick={() => !n.read && void read([n.id])}>Open</Link>
                  </Button>
                )}
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => void read([n.id])}>
                    Mark as read
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore} loading={loadingMore}>Load older notifications</Button>
        </div>
      )}
    </div>
  );
}
