"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { mainNav } from "@/config/site";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { status, data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { mobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();

  // Close the drawer on navigation.
  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  const authed = status === "authenticated" && Boolean(session?.user?.id);

  const authActions = authed ? (
    <>
      {isAdmin && (
        <Button asChild variant="accent" size="sm">
          <Link href="/admin">Admin</Link>
        </Button>
      )}
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Log out
      </Button>
    </>
  ) : (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">Sign up</Link>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/95 backdrop-blur-sm print:hidden">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Brand />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-field px-3 py-2 text-sm font-medium text-base-content/75 hover:bg-base-200 hover:text-base-content",
                  active && "bg-base-200 text-base-content",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <NotificationBell />
          {authActions}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <NotificationBell />
          <button
            type="button"
            className="grid size-10 place-items-center rounded-field border border-base-300"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            onClick={toggleMobileNav}
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div id="mobile-nav" className="border-t border-base-300 bg-base-100 lg:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col py-3">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-base-300/60 py-3 text-base font-medium last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-wrap gap-2">{authActions}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
