# Session notes: Shikshak Setu (teacher recruitment website)

Saved 2026-11-05 so work can resume later. Read this first, then `README.md`, `backend.md`, `frontend.md`.

## 1. The business (from the owner's PRD)
A two-person, remote teacher recruitment and placement agency in **Uttar Pradesh**.
Flow: call schools for requirements -> teachers register -> interview (manual or AI-assisted, always human-reviewed) ->
candidate summary -> candidate signs agreement -> resume + summary sent to schools -> school selects/rejects ->
fee -> if rejected, re-match to other schools.

**Legal gate (PRD section 12): teacher-paid fees (Rs 349 registration, 50% of first-month salary) must NOT be switched on
until a UP lawyer approves.** The server enforces this with `CANDIDATE_FEES_ENABLED=false` (default). School-paid fees are fine.
Competitor research found Indian platforms advertise "free for teachers" or "free for schools", so reconsider the Rs 349 fee.

## 2. What exists (all built and tested)
Project folder: `C:\Users\Rohit Laumas\WebComponents\shikshak-setu`

| Area | Details |
|---|---|
| Stack | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 + daisyUI tokens, hand-written shadcn-style UI, Zod 4, Zustand, react-hook-form |
| Public site | Home, For Schools, For Teachers, How It Works, About, FAQ, Contact, Privacy and Terms (drafts), 404/error, WhatsApp floating button |
| Auth | NextAuth v4: login by email OR mobile + password, Google, LinkedIn. 2-step signup (school/teacher + details + consent). OAuth users finish at `/onboarding` |
| Database | MongoDB Atlas via Mongoose (`MONGODB_URI`, `MONGODB_DB`). `/api/health` reports db/email/payments status |
| Email | Nodemailer (any SMTP). Email verification + password reset (hashed single-use tokens) |
| Email validation | `mailchecker` (disposable domains) + DNS mail-server check, on signup and contact form |
| Payments | Razorpay Orders + Checkout + signed webhooks; receipts at `/receipt/<id>`; amounts always server-side |
| Admin | `/admin`: overview, users (pipeline status), vacancies (verify), inquiries, payments (raise/cancel/mark refunded), notifications |
| Notifications | Bell in header, `/notifications` page, admin composer (specific people or groups, with a preview step), auto messages for signup, payment due/received, vacancy and status changes |
| Security | CSP + security headers, login brute-force lockout (failures only), CSRF/Origin + content-type guard, request size caps, 72-byte password rule, session revocation on password reset, open-redirect fix, `npm audit` = 0 |
| SEO | Per-page metadata, canonical links, OG/Twitter share image, JSON-LD (Organization, FAQ, breadcrumbs), sitemap, robots, manifest, noindex on private pages |

Other pages: dashboard (school: post vacancy; teacher: profile + status; both: payments), onboarding, forgot/reset/verify email.

## 3. Placeholders and things you must do yourself
- Brand name **"Shikshak Setu" is a placeholder**; email/phone in `src/config/site.ts` are placeholders.
- Fill `.env` (template exists, secrets not stored here): `MONGODB_URI` (Atlas), `NEXTAUTH_SECRET` (already generated),
  `NEXTAUTH_URL`, Razorpay keys + webhook secret, SMTP settings, `ADMIN_EMAILS`, Google/LinkedIn keys,
  `NEXT_PUBLIC_WHATSAPP_NUMBER`, and **`NEXT_PUBLIC_SITE_URL` = your real https domain** (canonical/sitemap/share images).
- Atlas: allow your server IP under Network Access; URL-encode special characters in the password.
- Razorpay: webhook URL `https://YOUR-DOMAIN/api/webhooks/razorpay`, events `payment.captured`, `order.paid`, `payment.failed`.
- To become staff: put your email in `ADMIN_EMAILS`, sign up with it, confirm the email.
- Have a lawyer review Privacy, Terms, the candidate agreement, and teacher fees before launch.

## 4. How to run
```
npm install
npm run dev          # http://localhost:3000   (then open /api/health)
npm run build && npm start
npm run lint ; npm run typecheck ; npm audit
```
Dev note: daisyUI's `join` component is excluded in `src/app/globals.css` because its CSS broke `next dev`
("Invalid empty selector"). If you ever need `join`, test `next dev` first.

## 5. Testing status (be honest about this)
Tested with a local MongoDB, a mock Razorpay API, a local SMTP sink, real DNS, and Playwright with real Chrome:
84 + 44 checks (payments, admin, email, legal gate), 20 (email validation), 80 (notifications + security), plus a browser run with
zero console/CSP errors. SEO audit went 28 problems -> 0; security probe 6 weaknesses -> defended.

**NOT tested:** real MongoDB Atlas, the live Razorpay payment popup under the strict CSP, real Razorpay webhooks,
a real SMTP provider, Google/LinkedIn login, load, multiple server instances. If a Razorpay method is blocked, the browser console
names the host to add to the CSP in `next.config.ts`.

The test scripts lived in the Claude session scratchpad (temporary, may be gone): mock Razorpay + SMTP sink (`services.mjs`),
`e2e2/e2e3/e2e4.mjs`, `seo-audit.mjs`, `sec-probe.mjs`, Playwright screenshot scripts. They are not part of the repo. If needed again,
ask Claude to recreate them. Lessons: use the Write tool for big scripts on Windows (long bash heredocs fail); Next client-side
navigation never fires a browser "load" event (Playwright `waitUntil: "commit"`); keep mock gateway order IDs unique per boot.

## 6. Known limits
- Rate limits are in memory (use Redis/Upstash for more than one instance). `X-Forwarded-For` is only trustworthy behind a proxy that sets it.
- The CSP allows inline scripts (Next.js needs it without nonces).
- A known account can be locked for 15 minutes by wrong guesses; the owner can reset by email.
- Session revocation after a password reset takes up to ~60 s.
- Receipts are acknowledgements, not GST tax invoices; refunds are done in the Razorpay dashboard (admin button only records them).
- No resume/document upload, no AI interview tooling, no school-side candidate review yet.
- A test MongoDB may still be running on port 55236 from the build session (harmless; a restart clears it).

## 7. Next steps (agreed priority, from the competitor review)
**Before launch:** real trust signals (a "What we verify" page, real business details and team, testimonials and counts only when real),
clear school-fee page, lawyer-reviewed legal pages incl. refund/cancellation policy, Hindi versions of key pages, decide on the Rs 349 teacher fee.

**Next build (recommended order):**
1. **School review portal**: schools see shortlisted candidate summaries and respond (interview / hold / reject), second reviewer.
2. **Public vacancy pages** (school name hidden until consent), e.g. "TGT Maths jobs in Lucknow" (note: PRD excluded a public job board from MVP; this is a deliberate step up).
3. **Job alerts** by email/WhatsApp for matching teachers.
4. Resume/document upload with private storage + profile-completeness meter.
5. Admin matching helper (subject, level, district, salary; a person decides) and an interview-notes form that drafts the one-page summary.
6. Articles for SEO (UPTET/CTET, TGT vs PGT salary, interview tips).

**Later:** WhatsApp Business messages, admin 2FA, Redis rate limiter, error/uptime monitoring, SPF/DKIM for email, school profile pages.

## 8. Where things are (quick map)
- Config + feature flags: `src/config/site.ts`, `next.config.ts` (headers/CSP), `.env` / `.env.example`
- Auth: `src/lib/auth.ts`; request guard: `src/lib/api.ts`; limiter: `src/lib/rate-limit.ts`
- Models: `src/models/` (User, Vacancy, Inquiry, AuthToken, Payment, Notification)
- Payments: `src/lib/razorpay.ts`, `src/lib/payments.ts`, `src/app/api/payments/**`, `src/app/api/webhooks/razorpay`
- Notifications: `src/lib/notifications.ts`, `src/app/api/notifications/**`, `src/components/notifications/**`, `src/app/admin/notifications`
- SEO: `src/lib/seo.ts`, `src/app/{sitemap,robots,manifest,opengraph-image,apple-icon}`
- Email + validation: `src/lib/email.ts`, `src/lib/email-validation.ts`
- Claude's own memory of this project: `C:\Users\Rohit Laumas\.claude\projects\C--Users-Rohit-Laumas-WebComponents\memory\project_shikshak_setu_site.md`

## 9. To resume in a new Claude session
Say: "Read `shikshak-setu/session.md`, then continue with <the next step you want>" (for example, the school review portal).

## 7. Update 2026-11-09: rebrand, fees and legal documents (owner's decisions)
- Agency is **VBF Teachers & Talent Solution** (sole proprietorship, owner Saraswati, Loni, Ghaziabad, UP). All details live in `src/config/business.json` (placeholders: phone, WhatsApp, website, Udyam no., grievance contact).
- Fees: Rs 399 registration (paid at the start after sharing resume, non-refundable) + 40% of first month's **in-hand** salary, due within 3 days after first salary, only on placement; charged again for each new placement; no refund once paid (duplicate/erroneous payments are refunded); schools pay nothing. Service area: UP only. Interviews are virtual or in person, **no AI interview**.
- `CANDIDATE_FEES_ENABLED=true` in `.env` (owner chose to switch on without lawyer review; the old legal gate in section 1 no longer applies, but a lawyer review is still advised).
- Legal documents (English + Hindi): source is `src/content/legal/*.json`; website pages `/terms /privacy /rules /payment-policy /candidate-agreement /working-methods`; Word copies in `legal-docs/`. Text uses `{{tokens}}` filled from business.json.
- Privacy: data kept securely, deleted on request, shared only with consent; AI-model training only with a separate optional consent.
- Open items: signing method for the agreement (undecided), stamp duty, jurisdiction set to Ghaziabad (inferred from address), lawyer review.
