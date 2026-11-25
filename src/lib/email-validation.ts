import { resolve4, resolveMx } from "node:dns/promises";
import MailChecker from "mailchecker";

/**
 * Rejects throwaway and fake email addresses at signup / contact time.
 *
 *  1. Disposable-domain check, offline, using the `mailchecker` list (tens of thousands of
 *     temp-mail domains: Mailinator, 10MinuteMail, Guerrilla Mail, YOPmail, …, subdomains included).
 *     Add your own with BLOCKED_EMAIL_DOMAINS="a.com,b.net".
 *  2. DNS check: the domain must publish an MX record (or at least an A record, which is the
 *     RFC fallback). This catches typos and invented domains such as "gmial.con" or "abc.xyz123".
 *     A DNS *outage* never blocks a real user: only a definite "no such domain / no mail server"
 *     answer rejects. Set EMAIL_DNS_CHECK=false to turn this step off (e.g. offline development).
 *
 * Neither check proves the inbox exists; the verification link we email does that.
 */
export type EmailCheck = { ok: true } | { ok: false; reason: "disposable" | "no-mail-server"; message: string };

const extra = (process.env.BLOCKED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);
if (extra.length) MailChecker.addCustomDomains(extra);

export const DISPOSABLE_MESSAGE =
  "Temporary or disposable email addresses are not accepted. Please use your regular email address.";
export const NO_MAIL_SERVER_MESSAGE =
  "We could not find a mail server for this email domain. Please check the spelling or use another address.";

const dnsCache = new Map<string, { ok: boolean; at: number }>();
const DNS_TTL_MS = 60 * 60 * 1000;
const DEFINITE_NO = new Set(["ENOTFOUND", "ENODATA"]);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("dns timeout"), { code: "ETIMEOUT" })), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

/** true = domain can receive mail (or we could not tell); false = definitely cannot. */
async function domainAcceptsMail(domain: string): Promise<boolean> {
  const hit = dnsCache.get(domain);
  if (hit && Date.now() - hit.at < DNS_TTL_MS) return hit.ok;

  let ok: boolean;
  try {
    const mx = await withTimeout(resolveMx(domain), 3000);
    // RFC 7505 "null MX" ("." with priority 0) means the domain explicitly accepts no mail.
    ok = mx.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (DEFINITE_NO.has(code)) {
      try {
        ok = (await withTimeout(resolve4(domain), 3000)).length > 0; // implicit-MX fallback
      } catch (e2) {
        ok = !DEFINITE_NO.has((e2 as { code?: string }).code ?? ""); // timeout/other => fail open
      }
    } else {
      console.warn("[email-validation] DNS lookup inconclusive for", domain, code);
      return true; // fail open, and do not cache an unclear answer
    }
  }
  dnsCache.set(domain, { ok, at: Date.now() });
  if (dnsCache.size > 2000) dnsCache.clear();
  return ok;
}

export async function validateRealEmail(email: string): Promise<EmailCheck> {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1];
  if (!domain) return { ok: false, reason: "no-mail-server", message: NO_MAIL_SERVER_MESSAGE };

  if (!MailChecker.isValid(normalized)) {
    return { ok: false, reason: "disposable", message: DISPOSABLE_MESSAGE };
  }
  if (process.env.EMAIL_DNS_CHECK !== "false" && !(await domainAcceptsMail(domain))) {
    return { ok: false, reason: "no-mail-server", message: NO_MAIL_SERVER_MESSAGE };
  }
  return { ok: true };
}
