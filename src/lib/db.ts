import mongoose from "mongoose";

/**
 * MongoDB Atlas connection, cached on globalThis so hot reloads and serverless
 * invocations reuse one connection. The URI is read lazily so the app builds and
 * public pages render without a database configured.
 *
 * Atlas checklist (see README): use the `mongodb+srv://` string, URL-encode special
 * characters in the password, and allow your server's IP under Network Access.
 */
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalCache = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = (globalCache._mongoose ??= { conn: null, promise: null });

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env and restart the server.");
    this.name = "DatabaseNotConfiguredError";
  }
}

const DEFAULT_DB = "vbf-teachers-talent-solution";

/**
 * Atlas copy-paste URIs usually have no database name, which makes the driver silently
 * use "test". Use MONGODB_DB if set; otherwise fall back to a sensible default
 * when the URI itself does not name a database.
 */
function resolveDbName(uri: string): string | undefined {
  if (process.env.MONGODB_DB) return process.env.MONGODB_DB;
  try {
    const url = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:"));
    return url.pathname.length > 1 ? undefined : DEFAULT_DB;
  } catch {
    return undefined; // multi-host non-SRV URI: leave it to the driver
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseNotConfiguredError();
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, {
    dbName: resolveDbName(uri),
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
    retryWrites: true,
  });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // allow retry on next request
    throw err;
  }
  return cache.conn;
}

/** True for errors that mean "database unreachable / bad credentials / IP not allowed". */
export function isDatabaseConnectionError(err: unknown): boolean {
  const name = (err as { name?: string })?.name ?? "";
  const code = (err as { code?: number | string })?.code;
  return (
    /ServerSelection|MongoNetwork|MongoParseError|MongoAPIError/.test(name) ||
    code === 18 || // authentication failed
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED"
  );
}
