# Frontend

Next.js App Router, React 19, TypeScript, Tailwind v4 + daisyUI 5, Zustand, react-hook-form + Zod.

## Design intent

Content-first and calm: a hiring service people must trust, not a SaaS landing page.

- Warm paper background, white cards, thin borders, almost no shadow.
- Serif headings (Source Serif 4) + humanist sans body (Source Sans 3) via `next/font`.
- Navy primary, muted green secondary, ochre accent used sparingly for eyebrows and one CTA.
- **No** gradients, glow, blobs, parallax, scroll-triggered or looping animation. The only motion is
  hover colour changes and a spinner. `prefers-reduced-motion` is respected.
- Real copy on every page (process, requirements, rights, FAQ, legal drafts) and **no invented
  statistics, testimonials or client logos**. The sample candidate summary is labelled *Illustrative sample*.

### About the three UI libraries

- **daisyUI** supplies the design tokens (`base-100/200/300`, `primary`, `accent`, radii…) through
  one custom theme named `setu` in `src/app/globals.css`, plus a few no-JS components: `badge`,
  `collapse` (FAQ), `table`, `checkbox`.
- **shadcn/ui pattern:** `src/components/ui/*` are shadcn-style primitives (class-variance-authority,
  Radix `Slot`, `cn()` helper) written by hand and themed with the daisyUI tokens, so there is a
  single colour system. They were not generated with the shadcn CLI.
- **Aceternity UI:** deliberately **not used** — it is animation-heavy, which contradicts the brief.
  Its only influence is layout ideas (bento-style cards, a vertical timeline for the process).

## Structure

```
src/
  app/                       routes (see below), layout.tsx, globals.css, icon.svg, robots/sitemap
  components/
    ui/                      button, form-controls (Input/Select/Textarea/Field/Checkbox), card, notice
    layout/                  site-header (client), site-footer, brand, whatsapp-button
    forms/                   login, signup (2-step), onboarding, contact, vacancy, role-fields, oauth-buttons
    sections.tsx             PageHeader, Section, StepList, CheckList, FaqItem, CtaBand, SampleSummary
    auth-shell.tsx           two-column frame for login/signup/onboarding
    providers.tsx            SessionProvider + sonner Toaster
  config/site.ts             brand, nav, districts, boards, qualifications, feature flags
  store/                     signup-store.ts, ui-store.ts (Zustand)
  lib/                       utils (cn), validations/, auth, db …
```

## Routes

| Route | Type | Notes |
|---|---|---|
| `/`, `/schools`, `/teachers`, `/how-it-works`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms` | static | content pages |
| `/login`, `/signup` | server (reads session) | redirect away if already logged in |
| `/onboarding` | server, protected | only for OAuth users with an incomplete profile |
| `/dashboard` | server, protected | schools: vacancy form + table; teachers: profile + progress |

## Screens added with accounts, payments and admin

| Route | Purpose |
|---|---|
| `/forgot-password`, `/reset-password?token=` | request / complete a password reset |
| `/verify-email?token=` | confirms the emailed link (POSTs the token once on open) |
| `/dashboard` | now also shows: verify-email banner + resend, **Payments** card (Pay now / Try again / Receipt), staff link |
| `/receipt/[id]` | printable receipt (owner or staff only); header, footer and WhatsApp button are hidden when printing |
| `/admin`, `/admin/users`, `/admin/vacancies`, `/admin/inquiries`, `/admin/payments` | staff area; status dropdowns save on change, payment request form, cancel / mark refunded |

- **Pay button** (`components/payments/pay-button.tsx`) loads `checkout.razorpay.com/v1/checkout.js` on demand,
  asks the server for an order, opens Razorpay Checkout, then posts the signed result to `/api/payments/verify`.
  The amount shown always comes from the server.
- **Signup** sends the user back to step 1 with the reason when the server rejects the email (disposable or
  non-existent mail domain) or finds a duplicate. The message lives in `signup-store.serverError`.
- Client files must not import server-only modules (Mongoose models, `node:` packages). Shared constants live in
  `lib/payment-constants.ts` for that reason.

## Notifications UI

- **Bell** (`components/notifications/notification-bell.tsx`) sits in the header for logged-in users on desktop and mobile. Unread badge ("9+" cap),
  dropdown of the latest 6, "Mark all as read", "See all notifications". It polls the cheap unread-count endpoint every 60 s only while the
  tab is visible and on focus. Escape closes it; the button has an accurate `aria-label` ("Notifications, 6 unread"); the dropdown is a
  region named "Your notifications" (named differently from the toast library's own "Notifications" landmark so screen readers are not confused).
- **State:** `store/notification-store.ts` (Zustand): unread count, latest items, optimistic mark-read reconciled with the server's count.
- **/notifications page:** server-rendered first page, "Load older notifications", mark one/all as read.
- **/admin/notifications:** composer (specific people or group, title, message, type, optional link) with a mandatory **Preview recipients** step,
  then **Send to N**; history table with read counts. Links only open if they are same-site paths (checked again in the browser).

## SEO in the UI layer

`lib/seo.ts` (`pageMetadata`, `organizationLd`, `breadcrumbLd`, `faqLd`) + `components/json-ld.tsx`. A new public page should call `pageMetadata({title, description, path})`
and include a breadcrumb `<JsonLd/>`. Keep titles under about 45 characters (the layout appends the brand) and descriptions 70 to 160. The share image and
Apple icon are generated in `app/opengraph-image.tsx` and `app/apple-icon.tsx`.

## Configuration you will edit most

`src/config/site.ts`:
- `name`, `tagline`, `description` — brand text (name "VBF Teachers & Talent Solution")
- `email`, `phoneDisplay` — **TODO placeholders**
- `candidateFeesEnabled` — read from `CANDIDATE_FEES_ENABLED` (default `false`); **keep it off** until the legal gate is cleared. Public copy switches on it (rebuild after changing); the server enforces it independently
- `candidateRegistrationFeePaise` — 34900 (₹349), used only when the flag is on
- `upDistricts`, `boards`, `qualifications`, `gradeLevels`, `teacherCategories` — feed both the UI and Zod enums,
  so a new option appears in forms *and* is accepted by the server in one edit.

## State management (Zustand)

- `signup-store` — current step (1|2), the step-1 account data and chosen role. **Not persisted**:
  the password must never reach localStorage/sessionStorage. Refreshing mid-signup restarts it.
- `ui-store` — mobile menu open/closed; the header closes it on route change.

Server data (session, vacancies) is **not** duplicated in a client store: the session comes from
NextAuth's `useSession`, and the dashboard is rendered on the server from the database.

## Forms

Pattern everywhere: `useForm` + `zodResolver(schema)`, native controls (`<select>` rather than custom
dropdowns — more reliable on low-end Android), `Field` wrapper for label/hint/error, errors announced via
`role="alert"`, a `Notice` for server errors, a sonner toast on success.

- **Signup:** step 1 validates `accountStepSchema` and stores it; step 2 validates the role's details,
  POSTs everything to `/api/register`, then signs in with NextAuth and goes to `/dashboard`.
  A 409 (email/mobile exists) shows an inline message with a link back to step 1.
- **Login:** one field for email *or* mobile; generic error on failure; honours `?callbackUrl`.
- **Number inputs:** `valueAsNumber` / `setValueAs` so Zod receives numbers (optional ones become `undefined`).
- Server-side `fieldErrors` are not mapped back onto fields; the client schema is identical, so it only matters for races.

## WhatsApp button

`components/layout/whatsapp-button.tsx`, mounted once in `app/layout.tsx`: fixed bottom-right, 56px,
opens `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=…` in a new tab. With no number configured it opens
WhatsApp's generic share screen, so **set the variable before launch**.

## Responsiveness & accessibility

- Mobile-first; header collapses to a menu below `lg`; multi-column layouts stack.
- Checked with Playwright at 1366px and iPhone 13 (390px): no horizontal overflow on `/`, `/schools`,
  `/teachers`, `/how-it-works`, `/faq`, `/contact`, `/signup`, `/login`.
- Skip-to-content link, visible focus ring, labelled controls, `aria-current` on nav,
  `aria-expanded` on the menu button, 44px-high inputs/buttons for touch.
- Contrast: body text and primary buttons use dark-on-light/light-on-navy pairs; the ochre accent is a dark shade for text use.

## Adding things

- **New content page:** copy `app/faq/page.tsx`, use `PageHeader` + `Section`, add the link to `mainNav`
  in `config/site.ts` and the path to `app/sitemap.ts`.
- **New form field:** add it to the Zod schema, the `Field` in `role-fields.tsx`, and the mapper in `lib/profile.ts` + the model.
- **New colour:** edit the `setu` theme tokens in `globals.css`; components only use tokens.

## Known gaps

- Server `fieldErrors` are only surfaced for the signup email/mobile case (sent back to step 1); other forms show the summary message.
- The live Razorpay Checkout popup and the OAuth buttons could not be tested without real credentials (everything server-side was).
- Admin tab links don't highlight the current tab.
- The strict CSP could block a Razorpay payment method that loads from a host not yet allow-listed; this is untested without live keys (see README section 7).
- (Fixed) daisyUI's unused `join` component generated an invalid CSS rule that broke `next dev` ("Invalid empty selector"); it is now excluded in `globals.css`. If you ever use `join`, re-test dev first.
