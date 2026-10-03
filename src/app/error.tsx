"use client";

import Link from "next/link";

// Shown when something unexpected throws while rendering a page. The real error stays in the
// server logs; visitors only get a calm message and the digest to quote.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20">
      <p className="font-mono text-sm text-accent">Error</p>
      <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-7xl">Something went wrong</h1>
      <p className="mt-6 max-w-md text-lg leading-8 text-muted">An unexpected error occurred. You can try again, or head back home.</p>
      {error.digest && <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p>}
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent">
          Back home
        </Link>
      </div>
    </section>
  );
}
