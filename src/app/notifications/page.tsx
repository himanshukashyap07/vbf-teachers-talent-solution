import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NotificationList } from "@/components/notifications/notification-list";
import { Notice } from "@/components/ui/notice";
import { Notification } from "@/models/Notification";
import type { NotificationItem } from "@/store/notification-store";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your notifications from the agency.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const PAGE = 20;

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fnotifications");
  if (!session.user.profileComplete) redirect("/onboarding");

  let items: NotificationItem[] = [];
  let hasMore = false;
  try {
    await connectDB();
    const rows = await Notification.find({ user: session.user.id }).sort({ _id: -1 }).limit(PAGE + 1).lean();
    hasMore = rows.length > PAGE;
    items = rows.slice(0, PAGE).map((n) => ({
      id: String(n._id),
      title: n.title,
      body: n.body,
      level: n.level ?? "info",
      link: n.link ?? null,
      read: Boolean(n.readAt),
      createdAt: (n.createdAt as unknown as Date).toISOString(),
    }));
  } catch {
    return (
      <div className="container-page py-12">
        <Notice tone="error">Notifications could not load because the database is unavailable. Please try again shortly.</Notice>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">Inbox</p>
      <h1 className="mt-1 mb-6 text-3xl font-bold sm:text-4xl">Notifications</h1>
      <NotificationList initial={items} hasMoreInitial={hasMore} />
      <p className="mt-8 text-xs text-base-content/50">Notifications are kept for 90 days.</p>
    </div>
  );
}
