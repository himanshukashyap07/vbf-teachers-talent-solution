import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Brand({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${siteConfig.name} home`}>
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-field font-serif text-sm font-bold",
          inverted ? "bg-primary-content text-primary" : "bg-primary text-primary-content",
        )}
      >
        VBF
      </span>
      <span className="leading-tight">
        <span className="block font-serif text-base font-bold sm:text-lg">{siteConfig.name}</span>
        <span className={cn("block text-[11px] uppercase tracking-wider", inverted ? "text-primary-content/70" : "text-base-content/60")}>
          Teacher recruitment · UP
        </span>
      </span>
    </Link>
  );
}
