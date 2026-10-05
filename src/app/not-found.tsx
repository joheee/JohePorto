import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-7xl">Page not found</h1>
      <p className="mt-6 max-w-md text-lg leading-8 text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or it has moved.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90">
          Back home
        </Link>
        <Link href="/#contact" className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent">
          Get in touch
        </Link>
      </div>
    </section>
  );
}
