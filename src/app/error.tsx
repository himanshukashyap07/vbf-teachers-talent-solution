"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-base-content/70">
        This is on our side. Please try again, and if it keeps happening, contact us.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/contact">Contact us</Link></Button>
      </div>
    </div>
  );
}
