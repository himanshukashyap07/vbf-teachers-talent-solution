"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { upDistricts } from "@/config/site";
import { splitIdentifiers } from "@/lib/validations/notification";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/utils";

const formSchema = z
  .object({
    title: z.string().trim().min(3, "Add a short title").max(120),
    body: z.string().trim().min(3, "Write the message").max(1000),
    level: z.enum(["info", "success", "warning"]),
    link: z.string().trim().max(200).refine((v) => v === "" || /^\/(?![/\\])\S*$/.test(v), "Use a path on this site, like /dashboard"),
    mode: z.enum(["users", "group"]),
    identifiersText: z.string(),
    role: z.enum(["all", "candidate", "school"]),
    district: z.string(),
    pipelineStatus: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.mode === "users" && splitIdentifiers(d.identifiersText).length === 0) {
      ctx.addIssue({ code: "custom", path: ["identifiersText"], message: "Add at least one email or mobile number" });
    }
  });
type FormValues = z.infer<typeof formSchema>;

interface Preview {
  recipients: number;
  description: string;
  sample: string[];
  unresolved: string[];
  truncated: boolean;
  limit: number;
}

const statuses = ["registered", "screened", "needs-follow-up", "submitted", "placed", "inactive"];

export function NotificationComposer() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { level: "info", mode: "users", role: "all", district: "", pipelineStatus: "", identifiersText: "", link: "" },
  });
  const mode = useWatch({ control, name: "mode" });

  function payload(v: FormValues, dryRun: boolean) {
    return {
      title: v.title,
      body: v.body,
      level: v.level,
      link: v.link || undefined,
      dryRun,
      audience:
        v.mode === "users"
          ? { mode: "users", identifiers: splitIdentifiers(v.identifiersText) }
          : { mode: "group", role: v.role, district: v.district || undefined, pipelineStatus: v.pipelineStatus || undefined },
    };
  }

  async function call(v: FormValues, dryRun: boolean) {
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(v, dryRun)),
    });
    return { res, json: await res.json().catch(() => null) };
  }

  // Step 1: validate + preview who will receive it.
  async function onPreview(v: FormValues) {
    setError(null);
    const { res, json } = await call(v, true);
    if (!res.ok) return setError(json?.error ?? "Could not check the audience.");
    setPreview(json.data);
  }

  // Step 2: the actual send, after the admin has seen the audience.
  async function onSend(v: FormValues) {
    setSending(true);
    setError(null);
    const { res, json } = await call(v, false);
    setSending(false);
    if (!res.ok) return setError(json?.error ?? "Could not send.");
    toast.success(`Sent to ${json.data.recipients} ${json.data.recipients === 1 ? "person" : "people"}`);
    setPreview(null);
    reset();
    router.refresh();
  }

  const submit = handleSubmit(preview ? onSend : onPreview);

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}

      <fieldset className="space-y-3" disabled={sending}>
        <legend className="text-sm font-semibold">Send to</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["users", "Specific people", "One person, two, or a list of emails / mobile numbers"],
              ["group", "A group", "Everyone matching a type, district or status"],
            ] as const
          ).map(([value, title, desc]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-box border bg-base-100 p-4 hover:border-primary/60",
                mode === value ? "border-primary ring-1 ring-primary" : "border-base-300",
              )}
            >
              <input type="radio" value={value} className="radio radio-primary radio-sm mt-0.5" {...register("mode", { onChange: () => setPreview(null) })} />
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-base-content/65">{desc}</span>
              </span>
            </label>
          ))}
        </div>

        {mode === "users" ? (
          <Field label="Emails or mobile numbers" htmlFor="n-ids" error={errors.identifiersText?.message} hint="Separate with commas, spaces or new lines. Up to 500." required>
            <Textarea id="n-ids" rows={3} placeholder={"teacher@gmail.com\n9876543210"} aria-invalid={!!errors.identifiersText} {...register("identifiersText", { onChange: () => setPreview(null) })} />
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Who" htmlFor="n-role" required>
              <Select id="n-role" {...register("role", { onChange: () => setPreview(null) })}>
                <option value="all">All teachers and schools</option>
                <option value="candidate">Teachers only</option>
                <option value="school">Schools only</option>
              </Select>
            </Field>
            <Field label="District (optional)" htmlFor="n-district">
              <Select id="n-district" {...register("district", { onChange: () => setPreview(null) })}>
                <option value="">Any district</option>
                {upDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Pipeline status (optional)" htmlFor="n-status">
              <Select id="n-status" {...register("pipelineStatus", { onChange: () => setPreview(null) })}>
                <option value="">Any status</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Title" htmlFor="n-title" error={errors.title?.message} required className="sm:col-span-2">
          <Input id="n-title" maxLength={120} aria-invalid={!!errors.title} {...register("title", { onChange: () => setPreview(null) })} />
        </Field>
        <Field label="Type" htmlFor="n-level">
          <Select id="n-level" {...register("level")}>
            <option value="info">Information</option>
            <option value="success">Good news</option>
            <option value="warning">Needs attention</option>
          </Select>
        </Field>
        <Field label="Message" htmlFor="n-body" error={errors.body?.message} required className="sm:col-span-3">
          <Textarea id="n-body" rows={4} maxLength={1000} aria-invalid={!!errors.body} {...register("body", { onChange: () => setPreview(null) })} />
        </Field>
        <Field label="Link (optional)" htmlFor="n-link" error={errors.link?.message} hint="A page on this site that opens when clicked, e.g. /dashboard or /teachers" className="sm:col-span-3">
          <Input id="n-link" placeholder="/dashboard" aria-invalid={!!errors.link} {...register("link", { onChange: () => setPreview(null) })} />
        </Field>
      </div>

      {preview && (
        <div className="rounded-box border border-primary/40 bg-primary/5 p-4 text-sm leading-6" role="status">
          <p className="font-semibold">
            This will be sent to {preview.recipients} {preview.recipients === 1 ? "person" : "people"}
            <span className="font-normal text-base-content/70"> ({preview.description})</span>
          </p>
          {preview.sample.length > 0 && (
            <p className="text-base-content/75">
              Including: {preview.sample.join(", ")}
              {preview.recipients > preview.sample.length ? ", …" : ""}
            </p>
          )}
          {preview.truncated && <p className="text-warning">More than {preview.limit} users match; only the {preview.limit} most recent will receive it. Narrow the audience to reach everyone.</p>}
          {preview.unresolved.length > 0 && (
            <p className="text-error">
              No account found for: {preview.unresolved.slice(0, 8).join(", ")}
              {preview.unresolved.length > 8 ? ` and ${preview.unresolved.length - 8} more` : ""}. These will be skipped.
            </p>
          )}
          {preview.recipients === 0 && <p className="font-semibold text-error">Nobody matches, so there is nothing to send.</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {preview ? (
          <>
            <Button type="submit" loading={sending} disabled={preview.recipients === 0}>
              Send to {preview.recipients}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPreview(null)} disabled={sending}>
              Edit
            </Button>
          </>
        ) : (
          <Button type="submit" loading={isSubmitting}>Preview recipients</Button>
        )}
      </div>
    </form>
  );
}
