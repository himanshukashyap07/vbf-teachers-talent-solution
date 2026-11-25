# Vbf Teachers and Talent Solution — Teacher Recruitment Website

Website, accounts, payments and a staff admin area for a teacher recruitment & placement agency
in Uttar Pradesh. Built from the PRD: manual-first MVP, real digital plumbing underneath.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| Styling / UI | Tailwind CSS v4 + daisyUI 5 tokens, shadcn-style primitives (hand-written) |
| Forms / validation | react-hook-form + **Zod 4** (same schemas in browser and server) |
| State | **Zustand** (signup wizard, mobile nav) |
| Auth | **NextAuth v4**: email-or-mobile + password, Google, LinkedIn; JWT sessions |
| Database | **MongoDB Atlas** via Mongoose 9 |
| Payments | **Razorpay** (Orders API + Checkout + webhooks) |
| Email | **Nodemailer** over any SMTP provider |
| Email validation | `mailchecker` (disposable domains) + DNS mail-server check |

## Quick start

```bash
npm install
# open .env and fill MONGODB_URI (Atlas). Everything else is optional to start.
npm run dev          # http://localhost:3000
```

Then open **http://localhost:3000/api/health**. It tells you, without exposing any secret, whether
the database is reachable and whether email and payments are configured.

Scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## 1. MongoDB Atlas setup

1. Atlas → create a free **M0** cluster.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add the IP of the machine running the app. `0.0.0.0/0` is fine while testing
   but tighten it for production. (Most "cannot connect" problems are this.)
4. **Database → Connect → Drivers** → copy the `mongodb+srv://…` string.
5. Put it in `.env` as `MONGODB_URI`, replacing `<password>`. **URL-encode special characters** in the
   password (`@`→`%40`, `#`→`%23`, `/`→`%2F`, `:`→`%3A`).
6. The database name comes from `MONGODB_DB` (default `vbf-teachers-talent-solution`). An explicit `MONGODB_DB`
   wins over a name inside the URI. Collections and indexes are created automatically on first use.
7. Restart `npm run dev` and check `/api/health`.

## 2. Razorpay (payments)

**Why Razorpay:** the most widely used gateway in India, UPI + cards + net banking + wallets in one
checkout, good docs, a free test mode, no setup fee. Standard pricing is around **2% per
transaction + GST** (rates change and depend on payment method and your volume: confirm on
razorpay.com/pricing before going live). Cashfree is a similar alternative; swapping would mean
replacing `src/lib/razorpay.ts` and the three payment routes.

Setup:
1. Create a Razorpay account → **Account & Settings → API Keys** → generate **Test** keys (`rzp_test_…`).
2. Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.
3. **Webhooks** → add `https://YOUR-DOMAIN/api/webhooks/razorpay` with events `payment.captured`,
   `order.paid`, `payment.failed`; choose a secret and put it in `RAZORPAY_WEBHOOK_SECRET`.
   (Locally, expose your port with a tunnel such as ngrok.)
4. Test with Razorpay's test cards/UPI, then complete KYC and switch to `rzp_live_…` keys.

How a payment works:
- Staff raises a **payment request** for a user in **/admin/payments** (e.g. a school's placement fee).
  The amount is always set on the server, never by the browser.
- The user sees it on **/dashboard** → **Pay now** → Razorpay Checkout (UPI / card / net banking).
- The server verifies Razorpay's HMAC signature; a signed **webhook** is the independent backup if
  the user closes the tab. Either path marks it paid exactly once.
- A printable **receipt** appears at `/receipt/<id>` for the payer and for staff.

## 3. Email (Nodemailer)

Used for **email verification** and **password reset**. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `EMAIL_FROM` for any SMTP provider (Brevo, Amazon SES, Zoho, Resend SMTP, Gmail app
password, …). Without them, development prints the email (with its link) in the server console and
production skips sending with a warning.

**Fake / disposable email protection.** Signup and the contact form reject:
- throwaway addresses (Mailinator, 10MinuteMail, Guerrilla Mail, YOPmail, TempMail, … including
  subdomains), using the offline `mailchecker` list. Add your own with `BLOCKED_EMAIL_DOMAINS`;
- domains with no mail server (typos like `gmial.con`, invented domains, or domains that publish
  a "null MX"), via a DNS lookup. A DNS *outage* never blocks a real user. Set
  `EMAIL_DNS_CHECK=false` to disable this step.

This stops obvious junk; it cannot prove the inbox exists. The emailed verification link does that.

## 4. Admin area (`/admin`)

Set `ADMIN_EMAILS=you@yourdomain.in,partner@yourdomain.in`. Each person **signs up normally with that
address and confirms it by email**; after that an **Admin** button appears in the header. Access is
re-checked against the database on every request, so removing an address revokes it immediately.

Tabs: **Overview** (counts, collected revenue), **Users** (search/filter, change pipeline status),
**Vacancies** (verify → `open`), **Inquiries** (mark contacted/closed), **Payments** (raise requests,
cancel, mark refunded, open receipts).

## 5. Legal gate: fees charged to teachers

The PRD blocks teacher-paid fees (₹349 registration, 50% placement fee) until a UP lawyer signs off.
`CANDIDATE_FEES_ENABLED=false` is the default and the **server enforces it**: it refuses to create,
raise or charge any payment for a teacher, regardless of what the UI does. School-paid fees are not
affected. Public copy changes with the flag (rebuild after changing it). Do not set it to `true`
without written legal approval and updated terms.

## 6. Notifications (bell icon)

Every logged-in user has a **bell** in the header (unread badge, dropdown of the latest messages) and a
full **/notifications** page (mark one or all as read, load older). Messages are kept 90 days.

**Staff sending** (**Admin → Notifications**): write a title and message, optionally add a link to a page on
this site, then choose the audience:
- **Specific people:** one person, two, or a list (up to 500) of emails and/or mobile numbers;
- **A group:** all users, all teachers or all schools, optionally narrowed by district and pipeline status.

Nothing is sent blindly: **Preview recipients** first shows how many people it reaches, a few names, and any
email/mobile that matched nobody; only then **Send**. A history table shows every message with how many
recipients have read it.

The system also sends notifications by itself: a welcome message at signup, **payment due** when staff raise a
request, **payment received** (exactly once, from either confirmation path), **requirement update** when a
vacancy is verified or closed, and **registration update** when a teacher's status changes.

## 7. Security

Hardening in place (all covered by automated tests, see backend.md):
- **Headers:** Content-Security-Policy (only Razorpay + Google/LinkedIn avatars allowed), X-Frame-Options DENY,
  nosniff, Referrer-Policy, HSTS, Permissions-Policy; personal and staff pages are `no-store`.
- **Login brute-force protection:** 10 failed attempts per account or 100 per IP in 15 minutes blocks further
  tries (failures only, so shared campus/carrier IPs are safe). A locked-out user can still reset their password.
- **CSRF:** every state-changing endpoint rejects a foreign `Origin`, and JSON endpoints require
  `Content-Type: application/json`.
- **Request size limits** (64 KB; webhooks 256 KB) enforced while reading, even without a Content-Length.
- **Open-redirect fix** on `?callbackUrl=`; **72-byte bcrypt limit** enforced; **sessions are revoked** on password reset.
- **Dependencies:** `npm audit` reports 0 vulnerabilities (Nodemailer upgraded to v10; a `minimatch` override for lint tooling).
- The CSP allows `'unsafe-inline'` scripts because Next.js needs it without per-request nonces (nonces would make
  every page dynamic). If a Razorpay payment method fails to load, the browser console names the host to add in `next.config.ts`.

Run `npm audit` regularly, and keep the site on HTTPS behind a proxy/host that sets `X-Forwarded-For` itself.

## 8. SEO

Every public page has a unique title and description, a canonical URL, Open Graph + Twitter cards with a
generated share image, and structured data (Organization/WebSite on the home page, FAQPage on /faq,
BreadcrumbList on inner pages). `sitemap.xml`, `robots.txt`, a web manifest and an Apple touch icon are
generated. Login, dashboards, admin, receipts, notifications and reset pages are `noindex` and disallowed.

**Before launch:** set `NEXT_PUBLIC_SITE_URL` to your real https domain (canonical links, sitemap and share
images use it), replace the placeholder email/phone in `src/config/site.ts`, add the site in Google Search
Console and submit `/sitemap.xml`. Add your real address/phone to the Organization data in `src/lib/seo.ts` once available.

## Environment variables

See `.env.example` (fully commented). Required to start: `MONGODB_URI`, `NEXTAUTH_SECRET`,
`NEXTAUTH_URL`. Everything else activates its feature when set.

## Authentication flow

1. **Sign up** (`/signup`, 2 steps): name, school/teacher, email, mobile, password → role details +
   consent → account saved → verification email sent → auto-login.
2. **Log in** (`/login`): email **or** 10-digit mobile + password; **Forgot password?** → emailed link
   (1 hour, single use) → new password.
3. **Google / LinkedIn:** first-time users are saved to the DB and finish their profile at
   `/onboarding`; their email counts as verified. Credentials need no extra setup.

## Not built / known limitations

- No admin UI to *edit* a user's details or upload resumes; AI interview tooling is out of scope (PRD).
- Session revocation after a password reset takes effect within about a minute (sessions are re-checked against the database every 60 s).
- A determined attacker can deliberately lock a known account for 15 minutes by guessing wrong passwords; the owner can still reset the password by email.
- Rate limiting is in memory (per server instance); use Redis/Upstash when scaling out.
- Refunds are issued in the Razorpay dashboard; the admin button only *records* it.
- Receipts are acknowledgements, not GST tax invoices. Ask your CA what invoicing you need.
- Brand name, contact details and legal text are placeholders; Privacy and Terms are drafts.

## Documentation

- [`backend.md`](./backend.md): models, API contracts, auth, payments, security
- [`frontend.md`](./frontend.md): structure, design system, components, state, forms
