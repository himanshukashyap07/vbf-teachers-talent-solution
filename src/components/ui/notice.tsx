import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  error: "border-error/30 bg-error/5 text-error",
  success: "border-success/30 bg-success/5 text-success",
  info: "border-info/30 bg-info/5 text-info",
} as const;

const icons = { error: AlertCircle, success: CheckCircle2, info: Info };

export function Notice({
  tone = "info",
  className,
  children,
}: {
  tone?: keyof typeof styles;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-2.5 rounded-field border p-3 text-sm leading-6", styles[tone], className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="text-base-content/85">{children}</div>
    </div>
  );
}
