import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">We could not find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-base-content/70">
        The link may be old or mistyped. Try the home page or tell us what you were looking for.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild><Link href="/">Go to home</Link></Button>
        <Button asChild variant="outline"><Link href="/contact">Contact us</Link></Button>
      </div>
    </div>
  );
}
