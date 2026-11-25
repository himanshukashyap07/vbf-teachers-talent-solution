import { connectDB } from "@/lib/db";
import { AdminSelect } from "@/components/admin/admin-controls";
import { Inquiry } from "@/models/Inquiry";

const statuses = ["new", "contacted", "closed"] as const;

export default async function AdminInquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  await connectDB();
  const filter: Record<string, unknown> = status && (statuses as readonly string[]).includes(status) ? { status } : {};
  const items = await Inquiry.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  return (
    <div className="space-y-4">
      <form className="flex items-end gap-3" action="/admin/inquiries">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Status</span>
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-field border border-base-300 bg-base-100 px-2">
            <option value="">All</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-field bg-primary px-4 text-sm font-semibold text-primary-content">Filter</button>
      </form>

      <div className="space-y-3">
        {items.map((i) => (
          <article key={String(i._id)} className="rounded-box border border-base-300 bg-base-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{i.name} <span className="badge badge-outline badge-sm ml-1">{i.audience}</span></p>
                <p className="text-sm text-base-content/65">
                  <a className="underline" href={`mailto:${i.email}`}>{i.email}</a>
                  {i.phone && <> · <a className="underline" href={`tel:${i.phone}`}>{i.phone}</a></>}
                  {" · "}{new Date(i.createdAt as unknown as Date).toLocaleString("en-IN")}
                </p>
              </div>
              <AdminSelect endpoint={`/api/admin/inquiries/${i._id}`} field="status" value={i.status ?? "new"} options={statuses} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-7 text-base-content/85">{i.message}</p>
          </article>
        ))}
        {items.length === 0 && <p className="text-base-content/60">No inquiries.</p>}
      </div>
    </div>
  );
}
