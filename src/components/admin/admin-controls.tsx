"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function patch(endpoint: string, body: unknown) {
  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? "Update failed.");
}

/** Inline status dropdown that saves immediately. */
export function AdminSelect({
  endpoint,
  field,
  value,
  options,
  className,
}: {
  endpoint: string;
  field: string;
  value: string;
  options: readonly string[];
  className?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    const previous = current;
    setCurrent(next);
    setBusy(true);
    try {
      await patch(endpoint, { [field]: next });
      toast.success("Saved");
      router.refresh();
    } catch (e) {
      setCurrent(previous);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={current}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      aria-label={`Change ${field}`}
      className={cn("h-9 rounded-field border border-base-300 bg-base-100 px-2 text-sm disabled:opacity-60", className)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** One-click action (cancel a request, mark refunded) with a confirmation prompt. */
export function AdminAction({
  endpoint,
  body,
  label,
  confirmText,
}: {
  endpoint: string;
  body: unknown;
  label: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      loading={busy}
      onClick={async () => {
        if (!window.confirm(confirmText)) return;
        setBusy(true);
        try {
          await patch(endpoint, body);
          toast.success("Updated");
          router.refresh();
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {label}
    </Button>
  );
}
