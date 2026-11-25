import { connectDB } from "@/lib/db";
import { AdminSelect } from "@/components/admin/admin-controls";
import { User } from "@/models/User";

const statuses = ["registered", "screened", "needs-follow-up", "submitted", "placed", "inactive"] as const;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string }> }) {
  const { q, role, status } = await searchParams;
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (role === "candidate" || role === "school") filter.role = role;
  if (status && (statuses as readonly string[]).includes(status)) filter.pipelineStatus = status;
  if (q?.trim()) {
    const rx = new RegExp(escapeRegex(q.trim().slice(0, 60)), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3" action="/admin/users">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Search</span>
          <input name="q" defaultValue={q} placeholder="Name, email or mobile" className="h-10 w-56 rounded-field border border-base-300 bg-base-100 px-3" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Type</span>
          <select name="role" defaultValue={role ?? ""} className="h-10 rounded-field border border-base-300 bg-base-100 px-2">
            <option value="">All</option>
            <option value="candidate">Teachers</option>
            <option value="school">Schools</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Status</span>
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-field border border-base-300 bg-base-100 px-2">
            <option value="">Any</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-field bg-primary px-4 text-sm font-semibold text-primary-content">Filter</button>
      </form>

      <p className="text-sm text-base-content/60">Showing {users.length} (newest first, max 100)</p>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Contact</th><th>Details</th><th>Joined</th><th>Pipeline status</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={String(u._id)}>
                <td className="font-semibold">{u.name}</td>
                <td>{u.role ?? <span className="text-base-content/50">no role yet</span>}</td>
                <td className="text-sm">
                  <div>
                    {u.email} {u.emailVerified ? <span className="badge badge-success badge-xs">verified</span> : <span className="badge badge-warning badge-xs">unverified</span>}
                  </div>
                  <div className="text-base-content/60">{u.phone ?? "—"}</div>
                </td>
                <td className="max-w-xs text-sm text-base-content/75">
                  {u.role === "candidate" && u.candidateProfile
                    ? `${u.candidateProfile.qualification} · ${u.candidateProfile.subjects?.join(", ")} · ${u.candidateProfile.experienceYears} yrs · ${u.candidateProfile.district}`
                    : u.role === "school" && u.schoolProfile
                      ? `${u.schoolProfile.schoolName} · ${u.schoolProfile.board} · ${u.schoolProfile.district}`
                      : "—"}
                </td>
                <td className="whitespace-nowrap text-sm">{new Date(u.createdAt as unknown as Date).toLocaleDateString("en-IN")}</td>
                <td>
                  {u.role === "candidate" || u.role === "school" ? (
                    <AdminSelect endpoint={`/api/admin/users/${u._id}`} field="pipelineStatus" value={u.pipelineStatus ?? "registered"} options={statuses} />
                  ) : "—"}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="text-center text-base-content/60">No users match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
