# Backend

Next.js Route Handlers (`src/app/api/**`) + Mongoose models (MongoDB Atlas) + NextAuth. No separate server.

## Layout

```
src/app/api/
  auth/[...nextauth]/        NextAuth
  register/                  POST   credentials signup (+ verification email)
  onboarding/                POST   finish profile after Google/LinkedIn
  vacancies/                 GET/POST   school's own vacancies
  contact/                   POST   contact form
  health/                    GET    setup check (db/email/payments flags only)
  account/
    send-verification/       POST   resend verification email (auth)
    verify-email/            POST   consume emailed token
    forgot-password/         POST   email a reset link (never reveals if account exists)
    reset-password/          POST   consume token, set new password
  payments/
    registration/            POST   teacher registration-fee row (only if fees enabled)
    [id]/order/              POST   create/reuse a Razorpay order for MY payment
    verify/                  POST   verify Razorpay Checkout signature -> paid
  webhooks/razorpay/         POST   signed Razorpay events -> paid / failed
  admin/
    users/[id]               PATCH  pipelineStatus
    vacancies/[id]           PATCH  status
    inquiries/[id]           PATCH  status
    payments                 POST   raise a payment request
    payments/[id]            PATCH  cancel unpaid / mark paid as refunded

src/lib/  auth, db, api, rate-limit, profile, roles, admin, email, email-validation,
          tokens, razorpay, payments, payment-constants, validations/{common,auth,account,admin,vacancy}
src/models/  User, Vacancy, Inquiry, AuthToken, Payment
```

## Response envelope

```jsonc
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": "Readable message", "fieldErrors": { "email": ["..."] } }
```
401 not logged in · 403 wrong role / gate closed · 404 · 409 conflict · 422 validation · 429 rate limit ·
502 payment provider failed · 503 DB or service not configured/reachable · 500 unexpected (logged only).

## Database: MongoDB Atlas

`connectDB()` (src/lib/db.ts) reads `MONGODB_URI` lazily, caches the connection on `globalThis`
(hot reload and serverless safe), uses `dbName` = `MONGODB_DB` or a default when the URI names none, and
`serverSelectionTimeoutMS: 8000`. Connection failures (IP not allow-listed, bad password, paused cluster)
are mapped to a clean 503 and logged with an Atlas checklist. `GET /api/health` reports `database:
ok | not-configured | unreachable`.

### Models

- **User**: `email` (unique sparse, lowercase), `phone` (unique sparse), `passwordHash` (select:false),
  `emailVerified`, `providers[]`, `role` (candidate | school | admin), `profileComplete`,
  `candidateProfile` / `schoolProfile` (with consent timestamps + privacy version), `pipelineStatus`.
- **Vacancy**: school ref, requirement fields, `status` pending-verification → open → on-hold | filled | closed.
- **Inquiry**: contact messages, `status` new | contacted | closed.
- **AuthToken**: `user`, `type` (verify-email | reset-password), **`tokenHash`** (SHA-256, never the raw
  token), `expiresAt` with a TTL index (MongoDB deletes expired rows itself).
- **Payment**: `user`, `purpose` (registration | placement-fee | other), `description`, **`amountPaise`**
  (integer paise), `status` (requested → pending → paid | failed; cancelled; refunded), unique `receiptNo`
  (`SS-YYYYMM-XXXXXX`), `razorpayOrderId`, `razorpayPaymentId`, `paidAt`, optional `vacancy`, `createdBy`.

## Email (Nodemailer, `src/lib/email.ts`)

SMTP transport from `SMTP_*`; HTML + plain-text bodies; link base is `NEXTAUTH_URL`. No SMTP → printed
to console in development, skipped with a warning in production. Sending never blocks signup.

### Email validation (`src/lib/email-validation.ts`)

`validateRealEmail(email)` runs on `/api/register` and `/api/contact` *before* touching the database:
1. `mailchecker` offline list (disposable/temp-mail domains incl. subdomains), plus `BLOCKED_EMAIL_DOMAINS`.
2. DNS: MX record required (A record accepted as the RFC fallback; RFC 7505 null-MX rejected). Only
   definite "no such domain / no data" answers reject; timeouts and server errors fail open. 1-hour
   in-memory cache. `EMAIL_DNS_CHECK=false` disables this step.
Returns 422 with `fieldErrors.email`; the signup form sends the user back to step 1 and shows it.

## Verification and password reset

- Tokens: 32 random bytes (hex); only the hash is stored; **single use** (atomic `findOneAndDelete`);
  verify = 24 h, reset = 1 h; requesting a new one replaces the old.
- `forgot-password` always answers the same success message and sends nothing for unknown accounts
  (no account enumeration); limited per IP (10/h) and per identifier (3/h). It accepts email *or* mobile
  and mails the account's email.
- A successful reset also marks the email verified, deletes all other outstanding tokens, and adds the
  `credentials` provider (so Google-only users can set a password).
- **Pre-hijack protection:** if someone registered an address with a password but never verified it, and
  the real owner later signs in with Google/LinkedIn, that unverified password is **discarded**.

## Payments (Razorpay, `src/lib/razorpay.ts`, `src/lib/payments.ts`)

Plain `fetch` to the Orders API; no SDK. Key rules:

1. **Amounts are server-decided.** Teacher registration fee from config; everything else from staff.
   Bodies from the browser never carry an amount (tested: a client-supplied amount is ignored).
2. **Order:** `POST /api/payments/:id/order` – only the payment's owner; refuses paid/cancelled/refunded;
   requires a verified email (when SMTP is configured); reuses an existing Razorpay order (so retries
   don't create duplicates; a race keeps the first order).
3. **Confirm, two independent paths**, both idempotent via `markPaid()` (atomic filter on status):
   - Browser → `/api/payments/verify`: HMAC-SHA256(`order_id|payment_id`, key secret), constant-time compare.
   - Razorpay → `/api/webhooks/razorpay`: HMAC-SHA256(raw body, webhook secret) over the **raw** text; the
     amount must equal ours or it is *not* auto-confirmed (logged for a human).
   A late `payment.failed` can never downgrade a paid payment; cancelled rows still become paid if money
   really arrived.
4. **Legal gate:** with `CANDIDATE_FEES_ENABLED` not `"true"` the server refuses (403) to create the
   registration fee, to let staff raise a payment for a teacher, and to open checkout for any existing
   teacher payment. School payments are unaffected.
5. Refund = done in the Razorpay dashboard; admin "Mark refunded" only records it.
6. We never see card/UPI details; Razorpay Checkout handles them.

## Admin

`getAdmin()` (src/lib/admin.ts) re-reads the user from the DB each call. Staff = `role: "admin"`, or an
email in `ADMIN_EMAILS` **that is verified**. Every admin route and `/admin/*` page calls it; non-staff get
403 / a redirect.

## Authentication notes (`src/lib/auth.ts`)

JWT sessions (14 days). Credentials: identifier parsed as email or mobile; bcrypt compare always runs
(dummy hash when the user doesn't exist) so timing doesn't reveal accounts; same message for wrong user and
wrong password. Providers register only when their env vars exist. The JWT carries `role` (staff shown
as `admin`) and `profileComplete`; the session updates after onboarding via `useSession().update()`.

## Notifications

- **Model:** `Notification` is one row per recipient (own read state, one indexed query per user), with a TTL index
  (90 days). `NotificationBatch` records each staff send for the history view.
- **User API (own data only; every query is scoped to `session.user.id`):** `GET /api/notifications`
  (`limit`, `before`, `unread`), `GET /api/notifications/unread-count` (polled by the bell every 60 s while the tab is visible),
  `POST /api/notifications/read` (`{ids}` or `{all:true}`; ids that are not yours are silently ignored).
- **Admin API:** `POST /api/admin/notifications` with `audience: {mode:"users", identifiers:[…]}` (up to 500) or
  `{mode:"group", role, district?, pipelineStatus?}` (up to 5000, most recent first). `dryRun:true` returns count, sample
  names and unmatched identifiers without sending. Limited to 30 sends per hour per admin.
- **Content safety:** `link` must be a same-site path (`/x`; `https://…`, `//host`, backslash tricks and `javascript:` are rejected);
  text is stored as plain text and rendered by React (escaped), never as HTML.
- **System events** call `notifyUser()`, which never throws, so a notification problem can never fail a payment or status change:
  welcome (signup), payment due (staff raise a request), payment received (inside `markPaid`, so exactly once whether the browser
  callback or the webhook wins), vacancy status, teacher pipeline status.

## Security

### Layers
1. **Headers (`next.config.ts`):** CSP (`default-src 'self'`; scripts also allow Razorpay Checkout; `frame-src` Razorpay;
   `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), X-Frame-Options DENY, nosniff,
   Referrer-Policy, HSTS, Permissions-Policy, CORP. `Cache-Control: private, no-store` on `/api`, dashboard, admin, notifications,
   receipts. Trade-off: `'unsafe-inline'` for scripts/styles (needed by Next without nonces).
2. **Request guard (`src/lib/api.ts`):** `readJson()` = JSON content-type (415) + same-origin check (403) + size cap read as a stream (413)
   + strict parse (400). `assertSameOrigin()` covers body-less POSTs. The Razorpay webhook uses `readTextLimited()` instead (signed raw body).
3. **Authentication:** bcrypt; passwords must be at most 72 **bytes** (bcrypt ignores the rest, which previously let a different password match);
   identical error for unknown user vs wrong password; dummy-hash compare so timing does not reveal accounts.
4. **Brute force:** failed logins are counted per account (10 per 15 min) and per IP (100 per 15 min); a success clears the account counter.
   Only failures count, because many users share one carrier/campus IP.
5. **Sessions:** JWT, 14 days. `User.sessionVersion` is bumped on password reset; the JWT callback re-checks it against the database every
   `SESSION_RECHECK_SECONDS` (default 60) and marks stale tokens revoked, so `getServerSession` yields no user (401 / redirect). An
   `update()` call can never revive a revoked token.
6. **Open redirect:** `safeRedirectPath()` allows only same-site paths for `callbackUrl`; the receipt page validates and encodes its redirect.
7. **Authorisation:** server-side checks on every protected route; admin re-read from the DB each request; users can only touch their own
   payments, notifications and receipts (404 rather than 403, to avoid revealing existence).
8. **Data handling:** Zod on every endpoint; no raw client objects reach Mongo queries; tokens hashed (SHA-256) and single-use; HMAC-verified
   payments with constant-time comparison; pre-hijack protection for OAuth linking; no account enumeration on password reset.
9. **Dependencies:** `npm audit` = 0 vulnerabilities. Nodemailer is on v10 (older 7.x had SMTP-injection and DoS advisories); next-auth is
   told to use it via `overrides` (we never use next-auth's own email provider).

### Known limits (honest list)
- Rate limits are **in memory** per server instance. Use Redis/Upstash when running more than one instance or serverless.
- `X-Forwarded-For` is only trustworthy behind a proxy that overwrites it. Login limits also key on the account, so spoofing the IP does not help.
- Sign-up reveals that an email/mobile is already registered (409). That is a usability trade-off; it is rate-limited.
- No lockout notification email, audit log, bounce handling, 2FA, or nonce-based CSP.
- Revocation after a reset is eventual (within `SESSION_RECHECK_SECONDS`), not instant.

## Testing performed

Against a real local MongoDB, a **mock Razorpay API**, a local **SMTP sink** (so real Nodemailer ran) and real DNS:
- 84 checks with teacher fees on: signup, verification email delivery, token single-use, password reset (by email
  and by mobile, no enumeration), admin access rules, admin APIs, full payment flow (server-side amount, forged
  signature rejected, cross-user access blocked, idempotency, receipts), webhooks (bad/missing signature, amount
  mismatch, failed→paid, duplicates, late failure), cancel/refund rules.
- 44 checks with fees off: the legal gate blocks every teacher-payment entry point; school payments still work.
- 20 checks on email validation: 10 disposable domains, case-insensitivity, 3 fake/null-MX domains rejected;
  Gmail, Outlook, Yahoo, Zoho accepted; contact form uses the same check.

- 80 checks for notifications and security (send to 1 / 2 / many / groups, dry-run, unmatched identifiers, isolation between users, read state,
  pagination, unsafe links, headers, CSRF/Origin, body size incl. chunked, 72-byte passwords, lockout, session revocation) and a browser run
  (real Chrome: bell, dropdown, admin composer, open-redirect, mobile, **no console/CSP errors**).
- Before/after audits: SEO 28 problems → 0; security probe 6 weaknesses → all defended; `npm audit` 10 → 0.

**Not tested:** real MongoDB Atlas, the live Razorpay Checkout popup under the new CSP and real Razorpay webhooks (need your keys and a
public URL), a real SMTP provider, Google/LinkedIn login, and anything under heavy load or multiple server instances.
