import Link from "next/link";
import PingDot from "@/components/PingDot";
import Reveal from "@/components/motion/Reveal";
import RotatingText from "@/components/motion/RotatingText";
import { experienceStats } from "@/lib/format";
import { getProfile } from "@/lib/settings";

// Staggered entrance in plain CSS (see .rise in globals.css): it starts on first paint, so the text is
// visible before JavaScript has loaded. That keeps Largest Contentful Paint fast.
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function Hero() {
  const profile = await getProfile();
  const stats = experienceStats(profile.experience, profile.skills.length);

  return (
    <section
      id="hero"
      className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20"
    >
      <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div>
          {profile.status && (
            <div className="rise" style={rise(0)}>
              <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border bg-card/60 py-1.5 pl-3 pr-4 text-sm text-muted">
                <PingDot />
                {profile.status}
              </p>
            </div>
          )}
          <div className="rise" style={rise(1)}>
            <p className="mb-4 font-mono text-base text-accent sm:text-lg">
              <RotatingText words={profile.roles} />
            </p>
          </div>
          <div className="rise" style={rise(2)}>
            {/* w-fit: the gradient spans the name itself, not the whole row */}
            <h1 className="w-fit bg-linear-to-r from-foreground from-30% to-accent bg-clip-text pb-2 text-6xl font-bold leading-[0.95] tracking-tighter text-transparent sm:text-8xl lg:text-9xl">
              {profile.name}
            </h1>
          </div>
          {profile.pitch && (
            <div className="rise" style={rise(3)}>
              <p className="mt-8 max-w-xl text-lg leading-8 text-muted sm:text-xl">{profile.pitch}</p>
            </div>
          )}
          <div className="rise mt-10 flex flex-wrap items-center gap-3" style={rise(4)}>
            <Link
              href="/#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90"
            >
              Get in touch
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            {profile.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {stats.length > 0 && (
          <Reveal delay={0.5} className="hidden lg:block">
            <ul className="space-y-3">
              {stats.map((s) => (
                <li key={s.label} className="rounded-2xl border border-border bg-card/60 px-5 py-4 transition-colors hover:border-accent">
                  <p className="text-4xl font-bold tracking-tight">{s.value}</p>
                  <p className="mt-1 text-sm text-muted">{s.label}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>

      {/* Scroll cue */}
      <Link
        href="/#about"
        aria-label="Scroll to the About section"
        className="absolute bottom-6 left-6 hidden items-center gap-3 text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground sm:flex"
      >
        <span aria-hidden className="relative block h-10 w-px overflow-hidden bg-border">
          <span className="scroll-cue-bar absolute inset-0 block bg-accent [animation:scroll-cue_2s_ease-in-out_infinite]" />
        </span>
        Scroll
      </Link>
    </section>
  );
}
