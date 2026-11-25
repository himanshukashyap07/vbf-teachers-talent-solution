import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { razorpayConfigured } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/**
 * Setup check: open /api/health after adding your Atlas URI. Reports only yes/no flags
 * and never any secret or connection detail.
 */
export async function GET() {
  let database: "ok" | "not-configured" | "unreachable" = "ok";
  if (!process.env.MONGODB_URI) database = "not-configured";
  else {
    try {
      const m = await connectDB();
      await m.connection.db?.admin().ping();
    } catch {
      database = "unreachable";
    }
  }
  const healthy = database === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", database, email: emailConfigured, payments: razorpayConfigured() },
    { status: healthy ? 200 : 503 },
  );
}
