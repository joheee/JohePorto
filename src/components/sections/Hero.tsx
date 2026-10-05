import Link from "next/link";
import TypedText from "@/components/motion/TypedText";
import { buildConsole } from "@/lib/console";
import { experienceStats, sortExperienceNewestFirst } from "@/lib/format";
import { getProfile } from "@/lib/settings";
import InfraConsole from "./InfraConsole";

// Staggered entrance in plain CSS (see .rise in globals.css): it starts on first paint, so the text is
// visible before JavaScript has loaded. That keeps Largest Contentful Paint fast.
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

// "4+" -> counts 0..4 then shows "+". The real value stays in the page for screen readers; the animated
// digits are drawn by CSS (see .count in globals.css).
function StatValue({ value }: { value: string }) {
  const m = /^(\d+)(.*)$/.exec(value);
  if (!m) return <p className="text-3xl font-bold tracking-tight">{value}</p>;
  return (
    <p className="text-3xl font-bold tracking-tight">
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        <span className="count" style={{ "--to": m[1] } as React.CSSProperties} />
        {m[2]}
      </span>
    </p>
  );
}

// `action`: extra controls shown in the corner (the editor puts its Edit button there).
// `anchorBase`: where the in-page links point; "" keeps them on the current page (the editor preview).
export default async function Hero({ action, anchorBase = "/" }: { action?: React.ReactNode; anchorBase?: string }) {
  const profile = await getProfile();
  const stats = experienceStats(profile.experience, profile.skills.length);
  // The newest role you are still in (nothing to maintain: it follows Settings > Experience).
  const current = sortExperienceNewestFirst(profile.experience).find((e) => e.current);
  const consoleLines = buildConsole({
    name: profile.name,
    roles: profile.roles,
    current: current && { role: current.role, company: current.company },
    skills: profile.skills,
    stats,
    status: profile.status,
  });

  return (
    <section
      id="hero"
      className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20"
    >
      {action && <div className="absolute right-6 top-4 z-10">{action}</div>}
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <div className="rise" style={rise(0)}>
            {/* One terminal session: each command in muted mono, its output indented under it ("$ " is 2ch wide). */}
            <div className="mb-8 font-mono text-base leading-7 sm:text-lg">
              <p aria-hidden className="select-none text-muted">
                <span className="text-emerald-700 dark:text-emerald-400">$</span> whoami --role
              </p>
              <p className="pl-[2ch]">
                <TypedText words={profile.roles} className="text-accent" />
              </p>
              {profile.pitch && (
                <>
                  <p aria-hidden className="mt-4 select-none text-muted">
                    <span className="text-emerald-700 dark:text-emerald-400">$</span> cat pitch.txt
                  </p>
                  {/* The indent sits on a wrapper so "2ch" is measured in the same font size as the role line above */}
                  <div className="pl-[2ch]">
                    <p className="max-w-2xl text-sm leading-7 text-foreground/80 sm:text-base">{profile.pitch}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="rise" style={rise(1)}>
            {/* w-fit: the gradient spans the name itself, not the whole row */}
            <h1 className="w-fit bg-linear-to-r from-foreground from-30% to-accent bg-clip-text pb-2 text-6xl font-bold leading-[0.95] tracking-tighter text-transparent sm:text-8xl">
              {profile.name}
            </h1>
          </div>
          {current && (
            <div className="rise" style={rise(2)}>
              <p className="mt-5 font-mono text-sm text-muted">
                <span aria-hidden className="mr-2 rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">HEAD → main</span>
                <span className="sr-only">Currently </span>
                <span className="text-foreground">{current.role}</span> @ <span className="text-foreground">{current.company}</span>
              </p>
            </div>
          )}
          {/* Phones: the two main actions side by side, the social links as an even row below.
              From sm up the wrappers disappear (`contents`) and everything sits in one row. */}
          <div className="rise mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" style={rise(3)}>
            <div className="grid grid-cols-2 gap-3 sm:contents">
              <Link
                href={`${anchorBase}#contact`}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 font-mono text-sm font-medium text-accent-foreground transition hover:opacity-90 sm:px-6"
              >
                <span className="sr-only">Get in touch</span>
                <span aria-hidden>./contact.sh</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a
                href="/resume.pdf"
                download
                className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/60 px-4 py-3 font-mono text-sm font-medium text-accent transition-colors hover:bg-accent/10 sm:px-6"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </svg>
                <span className="sr-only">Download resume</span>
                <span aria-hidden className="sm:hidden">resume.pdf</span>
                <span aria-hidden className="max-sm:hidden">curl -O resume.pdf</span>
              </a>
            </div>
            <div className="flex flex-wrap gap-2 sm:contents">
              {profile.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-full border border-border px-4 py-2.5 text-center font-mono text-sm font-medium lowercase transition-colors hover:border-accent hover:text-accent sm:flex-none sm:px-6 sm:py-3"
                >
                  <span aria-hidden>./</span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* The console, and under it (desktop) the headline numbers as small tiles. On phones it sits below the buttons. */}
        {(consoleLines.length > 0 || stats.length > 0) && (
          <div className="rise min-w-0" style={rise(3)}>
            <InfraConsole lines={consoleLines} />
            {stats.length > 0 && (
              <ul className="mt-4 hidden gap-3 lg:flex">
                {stats.map((s) => (
                  <li key={s.label} className="min-w-0 flex-1 rounded-xl border border-border bg-card/60 px-4 py-3 transition-colors hover:border-accent">
                    <StatValue value={s.value} />
                    <p className="mt-1 text-xs leading-4 text-muted">{s.label}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
