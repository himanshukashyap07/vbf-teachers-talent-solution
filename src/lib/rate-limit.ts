/**
 * Minimal in-memory sliding-window limiter. Good enough for a single Node
 * instance / MVP. On serverless or multiple instances, swap for Redis/Upstash.
 *
 * Note on client IPs: x-forwarded-for can be forged by a client that reaches the app directly.
 * It is only trustworthy behind a proxy/host that overwrites it (Vercel, Cloudflare, nginx with
 * proxy_set_header). Sensitive limits (login, password reset) therefore ALSO key on the account
 * identifier, so spoofing the IP does not unlock unlimited guesses against one account.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}

/** True if `key` already has >= limit recorded hits in the window. Does NOT record anything. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  return recent.length >= limit;
}

/** Record one hit (e.g. one FAILED login) against `key`. */
export function recordHit(key: string): void {
  const arr = hits.get(key) ?? [];
  arr.push(Date.now());
  if (arr.length > 200) arr.splice(0, arr.length - 200); // bound memory under a flood
  hits.set(key, arr);
}

/** Forget a key (e.g. after a successful login so a typo streak doesn't linger). */
export function resetRateLimit(key: string) {
  hits.delete(key);
}

export function clientIp(req: Request | { headers: Headers | Record<string, string | string[] | undefined> }): string {
  const headers = req.headers as Headers | Record<string, string | string[] | undefined>;
  const raw = typeof (headers as Headers).get === "function"
    ? (headers as Headers).get("x-forwarded-for")
    : (headers as Record<string, string | string[] | undefined>)["x-forwarded-for"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.split(",")[0]?.trim() || "unknown";
}
