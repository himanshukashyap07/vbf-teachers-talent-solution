import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Vacancy } from "@/models/Vacancy";
import Link from "next/link";
import { Payment } from "@/models/Payment";
import { emailConfigured } from "@/lib/email";
import { isAdminUser } from "@/lib/roles";
import { formatINR } from "@/lib/payments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { VacancyForm } from "@/components/forms/vacancy-form";
import { VerifyBanner } from "@/components/forms/verify-banner";
import { PayButton } from "@/components/payments/pay-button";
import { siteConfig } from "@/config/site";

const paymentBadge: Record<string, string> = {
  paid: "badge-success",
  requested: "badge-warning",
  pending: "badge-info",
  failed: "badge-error",
  cancelled: "badge-ghost",
  refunded: "badge-neutral",
};

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  registered: "Registered",
  screened: "Screened",
  "needs-follow-up": "Needs follow-up",
  submitted: "Profile submitted to a school",
  placed: "Placed",
  inactive: "Inactive",
};

const vacancyStatusLabel: Record<string, string> = {
  "pending-verification": "Awaiting our confirmation",
  open: "Open — sourcing candidates",
  "on-hold": "On hold",
  filled: "Filled",
  closed: "Closed",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  if (!session.user.profileComplete) redirect("/onboarding");

  let user, vacancies, payments;
  try {
    await connectDB();
    user = await User.findById(session.user.id).lean();
    payments = await Payment.find({ user: session.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    vacancies = session.user.role === "school" ? await Vacancy.find({ school: session.user.id }).sort({ createdAt: -1 }).limit(50).lean() : [];
  } catch {
    return (
      <div className="container-page py-12">
        <Notice tone="error">The dashboard could not load because the database is unavailable. Please try again shortly.</Notice>
      </div>
    );
  }
  if (!user) redirect("/login");

  const isSchool = user.role === "school";
  const c = user.candidateProfile;
  const s = user.schoolProfile;

  return (
    <div className="container-page py-10 lg:py-14">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">
        {isSchool ? "School account" : "Teacher account"}
      </p>
      <h1 className="mt-1 mb-6 text-3xl font-bold sm:text-4xl">Welcome, {user.name}</h1>

      {isAdminUser(user) && (
        <Notice tone="info" className="mb-6">
          You have staff access. <Link href="/admin" className="font-semibold underline">Open the admin area</Link>
        </Notice>
      )}
      {!user.emailVerified && user.email && emailConfigured && <VerifyBanner email={user.email} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>What we have on record. Contact us to correct anything.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-base-300 text-sm">
              <Row label="Email" value={user.email} />
              <Row label="Mobile" value={user.phone} />
              {isSchool && s ? (
                <>
                  <Row label="School" value={s.schoolName} />
                  <Row label="Board" value={s.board} />
                  <Row label="District" value={s.district} />
                  <Row label="Your role" value={s.designation} />
                </>
              ) : (
                c && (
                  <>
                    <Row label="Qualification" value={c.qualification} />
                    <Row label="Subjects" value={c.subjects?.join(", ")} />
                    <Row label="Level" value={c.gradeLevel} />
                    <Row label="Experience" value={c.experienceYears != null ? `${c.experienceYears} years` : undefined} />
                    <Row label="District" value={c.district} />
                    <Row label="Expected salary" value={c.expectedSalary ? `₹${c.expectedSalary.toLocaleString("en-IN")} / month` : undefined} />
                  </>
                )
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {!isSchool && (
            <Card>
              <CardHeader>
                <CardTitle>Where you stand</CardTitle>
                <CardDescription>Your registration with {siteConfig.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="badge badge-primary badge-lg">{statusLabel[user.pipelineStatus ?? "registered"]}</span>
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-base-content/80">
                  <li>Our team will call you on <strong>{user.phone ?? "your mobile number"}</strong> to confirm your details.</li>
                  <li>We screen your resume and take an interview, virtually or in person.</li>
                  <li>You review and agree to the Candidate Agreement before any profile is shared.</li>
                  <li>We send your profile and interview summary to matching schools and keep you informed of each response.</li>
                </ol>
                {!siteConfig.candidateFeesEnabled && (
                  <Notice tone="info">No fee is being charged to teachers at this time. If that ever changes, you will see the terms in writing before you agree to anything.</Notice>
                )}
              </CardContent>
            </Card>
          )}

          {isSchool && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Post a requirement</CardTitle>
                  <CardDescription>
                    Tell us what you need. We will call to confirm the details before we start sourcing candidates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VacancyForm defaultDistrict={s?.district ?? undefined} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  {vacancies && vacancies.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Position</th>
                            <th>Salary (₹ / month)</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vacancies.map((v) => (
                            <tr key={String(v._id)}>
                              <td>
                                <div className="font-semibold">{v.title}</div>
                                <div className="text-xs text-base-content/60">{v.subject} · {v.district}</div>
                              </td>
                              <td className="whitespace-nowrap">
                                {v.salaryMin.toLocaleString("en-IN")} – {v.salaryMax.toLocaleString("en-IN")}
                                <div className="text-xs text-base-content/60">{v.salaryBasis}</div>
                              </td>
                              <td><span className="badge badge-outline">{vacancyStatusLabel[v.status ?? "pending-verification"]}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/70">No requirements posted yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Payments: shown when there is something to pay/show, or when the teacher registration fee is switched on */}
      {(payments && payments.length > 0) || (!isSchool && siteConfig.candidateFeesEnabled) ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Pay securely by UPI, card or net banking through Razorpay. Receipts appear here once paid.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSchool && siteConfig.candidateFeesEnabled && !payments?.some((p) => p.purpose === "registration") && (
              <div className="flex flex-col gap-3 rounded-field border border-base-300 bg-base-200/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Registration fee — {formatINR(siteConfig.candidateRegistrationFeePaise)}</p>
                  <p className="text-sm text-base-content/70">One-time, non-refundable fee for registration and resume screening. It does not guarantee a job. After you are placed and paid your first salary, a placement fee applies (see the <Link href="/payment-policy" className="underline">payment policy</Link>).</p>
                </div>
                <PayButton registration label={`Pay ${formatINR(siteConfig.candidateRegistrationFeePaise)}`} variant="accent" />
              </div>
            )}
            {payments && payments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>For</th><th>Amount</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={String(p._id)}>
                        <td>
                          <div className="font-semibold">{p.description}</div>
                          <div className="text-xs text-base-content/60">{p.receiptNo} · {new Date(p.createdAt as unknown as Date).toLocaleDateString("en-IN")}</div>
                        </td>
                        <td className="whitespace-nowrap font-semibold">{formatINR(p.amountPaise)}</td>
                        <td><span className={`badge ${paymentBadge[p.status ?? "requested"]}`}>{p.status === "requested" ? "due" : p.status}</span></td>
                        <td className="text-right">
                          {["requested", "pending", "failed"].includes(p.status ?? "") && (
                            <PayButton paymentId={String(p._id)} label={p.status === "failed" ? "Try again" : "Pay now"} />
                          )}
                          {(p.status === "paid" || p.status === "refunded") && (
                            <Link href={`/receipt/${p._id}`} className="btn btn-sm btn-outline">Receipt</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-base-content/60">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
