import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { appBaseUrl } from "@/config/site";
import { DatabaseNotConfiguredError, isDatabaseConnectionError } from "./db";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ ok: false, error: message, fieldErrors }, { status });
}

/** Thrown by readJson() and turned into a clean 4xx by handleError(). */
export class RequestRejected extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "RequestRejected";
  }
}

const DEFAULT_MAX_BYTES = 64 * 1024;

/**
 * Safe replacement for `await req.json()` in every JSON endpoint:
 *  - Content-Type must be application/json (blocks cross-site <form enctype="text/plain"> tricks) -> 415
 *  - a browser-supplied Origin must be this site (blocks cross-site requests that carry the user's cookie) -> 403
 *  - the body is size-limited BEFORE parsing (default 64 KB) -> 413
 * Requests with no Origin header (curl, server-to-server) are allowed through the origin check: those
 * cannot be forged by a victim's browser. Webhooks must not use this helper.
 */
export async function readJson(req: Request, maxBytes = DEFAULT_MAX_BYTES): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    throw new RequestRejected("Content-Type must be application/json.", 415);
  }

  assertSameOrigin(req);

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new RequestRejected("Request body is too large.", 413);

  const text = await readTextLimited(req, maxBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestRejected("The request body is not valid JSON.", 400);
  }
}

/**
 * Rejects requests whose browser-supplied Origin is another site. Use on EVERY state-changing
 * endpoint, including ones with no body. A missing Origin (curl, server-to-server) is allowed because
 * a victim's browser always sends Origin on cross-site POSTs.
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;
  if (origin === "null") throw new RequestRejected("Cross-site request blocked.", 403);
  const allowed = new Set(
    [req.headers.get("host"), req.headers.get("x-forwarded-host"), safeHost(appBaseUrl)].filter(Boolean) as string[],
  );
  if (!allowed.has(safeHost(origin) ?? "")) throw new RequestRejected("Cross-site request blocked.", 403);
}

/** Reads a request body as text, aborting as soon as it exceeds `maxBytes` (Content-Length can lie). */
export async function readTextLimited(req: Request, maxBytes = DEFAULT_MAX_BYTES): Promise<string> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RequestRejected("Request body is too large.", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function handleError(err: unknown) {
  if (err instanceof RequestRejected) return fail(err.message, err.status);
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return fail("Please check the highlighted fields.", 422, fieldErrors);
  }
  if (err instanceof SyntaxError) {
    return fail("The request body is not valid JSON.", 400);
  }
  if (err instanceof DatabaseNotConfiguredError) {
    return fail("The service is not fully configured yet. Please try again later.", 503);
  }
  if (isDatabaseConnectionError(err)) {
    console.error(
      "[api] Cannot reach MongoDB. On Atlas check: (1) Network Access allows this server's IP, " +
        "(2) username/password are correct and URL-encoded, (3) the cluster is not paused.",
      (err as Error).message,
    );
    return fail("We could not reach our database. Please try again in a moment.", 503);
  }
  console.error("[api]", err);
  return fail("Something went wrong on our side. Please try again.", 500);
}
