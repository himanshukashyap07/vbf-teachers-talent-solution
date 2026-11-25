import { connectDB } from "@/lib/db";
import { NotificationComposer } from "@/components/admin/notification-composer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notification, NotificationBatch } from "@/models/Notification";

const levelBadge = { info: "badge-info", success: "badge-success", warning: "badge-warning" } as const;

interface Row {
  _id: unknown;
  title: string;
  body: string;
  level: keyof typeof levelBadge;
  audience: string;
  recipientCount: number;
  createdAt: Date;
}

export default async function AdminNotifications() {
  await connectDB();
  const batches = (await NotificationBatch.find().sort({ createdAt: -1 }).limit(30).lean()) as unknown as Row[];
  const ids = batches.map((b) => b._id);
  // How many recipients have actually read each message.
  const reads = await Notification.aggregate([
    { $match: { batch: { $in: ids }, readAt: { $exists: true } } },
    { $group: { _id: "$batch", n: { $sum: 1 } } },
  ]);
  const readMap = new Map(reads.map((r) => [String(r._id), r.n as number]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send a notification</CardTitle>
          <CardDescription>
            Appears under the bell icon for each recipient and on their Notifications page. You will see who it reaches
            before anything is sent.
          </CardDescription>
        </CardHeader>
        <CardContent><NotificationComposer /></CardContent>
      </Card>

      <section aria-labelledby="sent-heading">
        <h2 id="sent-heading" className="mb-3 font-sans text-lg font-bold">Recently sent</h2>
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table">
            <thead>
              <tr><th>Sent</th><th>Message</th><th>Audience</th><th>Read</th></tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const read = readMap.get(String(b._id)) ?? 0;
                return (
                  <tr key={String(b._id)}>
                    <td className="whitespace-nowrap text-sm">{new Date(b.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="max-w-md">
                      <div className="font-semibold">{b.title} <span className={`badge badge-sm ${levelBadge[b.level] ?? ""}`}>{b.level}</span></div>
                      <div className="line-clamp-2 text-sm text-base-content/70">{b.body}</div>
                    </td>
                    <td className="text-sm">{b.audience}<div className="text-xs text-base-content/60">{b.recipientCount} recipient{b.recipientCount === 1 ? "" : "s"}</div></td>
                    <td className="whitespace-nowrap text-sm">{read} / {b.recipientCount}</td>
                  </tr>
                );
              })}
              {batches.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/60">Nothing sent yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
