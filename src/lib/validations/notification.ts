import { z } from "zod";
import { upDistricts } from "@/config/site";
import { parseIdentifier } from "./common";

/** Same-site path only: "/dashboard", "/receipt/abc". Rejects "https://…", "//host", "javascript:…". */
const linkField = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || (/^\/(?![/\\])[^\s\u0000-\u001f]*$/.test(v)), "Use a path on this site, like /dashboard")
  .optional();

const audienceUsers = z.object({
  mode: z.literal("users"),
  /** emails and/or 10-digit mobile numbers */
  identifiers: z
    .array(z.string().trim().min(1).max(120))
    .min(1, "Add at least one email or mobile number")
    .max(500, "At most 500 people per message when choosing individually"),
});

const audienceGroup = z.object({
  mode: z.literal("group"),
  role: z.enum(["all", "candidate", "school"]),
  district: z.enum(upDistricts).optional(),
  pipelineStatus: z.enum(["registered", "screened", "needs-follow-up", "submitted", "placed", "inactive"]).optional(),
});

export const sendNotificationSchema = z.object({
  title: z.string().trim().min(3, "Add a short title").max(120),
  body: z.string().trim().min(3, "Write the message").max(1000),
  level: z.enum(["info", "success", "warning"]).default("info"),
  link: linkField,
  audience: z.discriminatedUnion("mode", [audienceUsers, audienceGroup]),
  /** true = only count who would receive it; nothing is sent */
  dryRun: z.boolean().optional(),
});
export type SendNotificationInput = z.input<typeof sendNotificationSchema>;

export const markReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/)).min(1).max(100) }),
]);

/** Splits free text (commas, spaces, semicolons, new lines) into unique cleaned identifiers. */
export function splitIdentifiers(text: string): string[] {
  const parts = text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

export const isValidIdentifier = (v: string) => parseIdentifier(v) !== null;
