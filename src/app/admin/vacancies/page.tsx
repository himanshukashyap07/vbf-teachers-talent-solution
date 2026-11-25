import { connectDB } from "@/lib/db";
import { AdminSelect } from "@/components/admin/admin-controls";
import { Vacancy } from "@/models/Vacancy";

const statuses = ["pending-verification", "open", "on-hold", "filled", "closed"] as const;

export default async function AdminVacancies({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  await connectDB();
  const filter: Record<string, unknown> = status && (statuses as readonly string[]).includes(status) ? { status } : {};
  const vacancies = await Vacancy.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  return (
    <div className="space-y-4">
      <form className="flex items-end gap-3" action="/admin/vacancies">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Status</span>
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-field border border-base-300 bg-base-100 px-2">
            <option value="">All</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-field bg-primary px-4 text-sm font-semibold text-primary-content">Filter</button>
      </form>
      <p className="text-sm text-base-content/70">
        New vacancies start as <strong>pending-verification</strong>. Call the school to confirm, then set the status to <strong>open</strong>.
      </p>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr><th>School</th><th>Position</th><th>Requirements</th><th>Salary (₹/mo)</th><th>Status</th><th>Vacancy ID</th></tr>
          </thead>
          <tbody>
            {vacancies.map((v) => (
              <tr key={String(v._id)}>
                <td className="font-semibold">{v.schoolName}<div className="text-xs font-normal text-base-content/60">{v.district}</div></td>
                <td>{v.title}<div className="text-xs text-base-content/60">{v.subject} · {v.employmentType}</div></td>
                <td className="text-sm text-base-content/75">{v.qualification}, {v.minExperienceYears}+ yrs<div className="text-xs">{v.gradeLevel}</div></td>
                <td className="whitespace-nowrap text-sm">{v.salaryMin.toLocaleString("en-IN")} – {v.salaryMax.toLocaleString("en-IN")}<div className="text-xs text-base-content/60">{v.salaryBasis}</div></td>
                <td><AdminSelect endpoint={`/api/admin/vacancies/${v._id}`} field="status" value={v.status ?? "pending-verification"} options={statuses} /></td>
                <td><code className="select-all text-xs">{String(v._id)}</code></td>
              </tr>
            ))}
            {vacancies.length === 0 && <tr><td colSpan={6} className="text-center text-base-content/60">No vacancies.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
