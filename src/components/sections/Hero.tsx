import Link from "next/link";
import { buildConsole } from "@/lib/console";
import { careerUptime } from "@/lib/career";
import { experienceStats, sortExperienceNewestFirst } from "@/lib/format";
import { getProfile } from "@/lib/settings";
import { getProjects } from "@/lib/projects";
import { shellUser } from "@/lib/navPath";
import { formatPeriod } from "@/lib/format";
import type { TerminalData } from "@/lib/terminal";
import CareerUptime from "./CareerUptime";
import InfraConsole from "./InfraConsole";

// Staggered entrance in plain CSS (see .rise in globals.css): it starts on first paint, so the text is
// visible before JavaScript has loaded. That keeps Largest Contentful Paint fast.
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

// A block cursor that blinks after a button's label while it is hovered or focused (its space is always
// reserved, so nothing shifts). Decoration: it needs the `group` class on the button.
function Cursor() {
  return (
    <span
      aria-hidden
      className="btn-cursor -ml-0.5 inline-block h-3.5 w-1.5 bg-current opacity-0"
    />
  );
}

// `action`: extra controls shown in the corner (the editor puts its Edit button there).
// `anchorBase`: where the in-page links point; "" keeps them on the current page (the editor preview).
export default async function Hero({ action, anchorBase = "/" }: { action?: React.ReactNode; anchorBase?: string }) {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  const stats = experienceStats(profile.experience, profile.skills.length);
  // The newest role you are still in (nothing to maintain: it follows Settings > Experience).
  const current = sortExperienceNewestFirst(profile.experience).find((e) => e.current);
  const consoleLines = buildConsole({ roles: profile.roles, pitch: profile.pitch, skills: profile.skills, status: profile.status });
  // What the typeable terminal can answer with (small: this is sent to the browser)
  const terminalData: TerminalData = {
    user: shellUser(profile.name),
    name: profile.name,
    email: profile.email,
    location: profile.location,
    status: profile.status,
    roles: profile.roles,
    pitch: profile.pitch,
    bio: profile.bio,
    skillGroups: profile.skillGroups.map((g) => ({ name: g.name, items: g.items.map((i) => i.name) })),
    socials: profile.socials,
    experience: sortExperienceNewestFirst(profile.experience).map((e) => ({ role: e.role, company: e.company, period: formatPeriod(e) })),
    projects: projects.map((p) => ({ slug: p.slug, title: p.title, year: p.year })),
  };
  const uptime = careerUptime(profile.experience);
  const summary = stats.map((s) => `${s.value} ${s.label}`).join(" · ");

  return (
    <section
      id="hero"
      className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20"
    >
      {action && <div className="absolute right-6 top-4 z-10">{action}</div>}
      {/* Three grid items. On phones: the name, the terminal (it holds the role and the pitch, so they show
          up right under the name), then the buttons. From lg: the name and the buttons stack in the left
          column and the terminal spans both rows on the right. */}
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="lg:col-start-1 lg:self-end">
          <div className="rise" style={rise(0)}>
            {/* w-fit: the gradient spans the name itself, not the whole row */}
            <h1 className="w-fit bg-linear-to-r from-foreground from-30% to-accent bg-clip-text pb-2 text-6xl font-bold leading-[0.95] tracking-tighter text-transparent sm:text-8xl">
              {profile.name}
              {/* A blinking underscore after the name (a thin bar looked like an extra "l") (not on phones: no room) */}
              <span aria-hidden className="term-cursor ml-2 inline-block h-[0.1em] w-[0.5em] bg-accent max-sm:hidden" />
            </h1>
          </div>
          {current && (
            <div className="rise" style={rise(1)}>
              <p className="mt-5 font-mono text-sm text-muted">
                <span aria-hidden className="mr-2 rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">HEAD → main</span>
                <span className="sr-only">Currently </span>
                <span className="text-foreground">{current.role}</span> @ <span className="text-foreground">{current.company}</span>
              </p>
            </div>
          )}
        </div>

        {consoleLines.length > 0 && (
          <div className="rise min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center" style={rise(1)}>
            <InfraConsole lines={consoleLines} data={terminalData} />
          </div>
        )}

        <div className="lg:col-start-1 lg:self-start">
          {/* Phones: the two main actions side by side, the social links as an even row below.
              From sm up the wrappers disappear (`contents`) and everything sits in one row. */}
          {/* sm+: the wrapper is as wide as the two main buttons, and the social buttons share that width equally */}
          <div className="rise flex flex-col gap-4 sm:w-fit" style={rise(2)}>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Link
                href={`${anchorBase}#contact`}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-mono text-sm font-medium text-accent-foreground transition hover:brightness-110 active:translate-y-px sm:px-5"
              >
                <span className="sr-only">Get in touch</span>
                <span aria-hidden className="opacity-70">$</span>
                <span aria-hidden>./contact.sh</span>
                <Cursor />
                {/* An Enter key cap: the command waiting to run */}
                <kbd aria-hidden className="rounded border border-current/30 px-1.5 font-mono text-[11px] leading-5 opacity-80">↵</kbd>
              </Link>
              <a
                href="/resume.pdf"
                download
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-accent/60 px-4 py-3 font-mono text-sm font-medium text-accent transition-colors hover:bg-accent/10 active:translate-y-px sm:px-5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </svg>
                <span className="sr-only">Download resume</span>
                <span aria-hidden className="sm:hidden">resume.pdf</span>
                <span aria-hidden className="max-sm:hidden">curl -O resume.pdf</span>
                <Cursor />
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 max-[360px]:grid-cols-2 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
              {profile.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center rounded-lg border border-border px-2 py-3 font-mono text-[13px] font-medium lowercase transition-colors hover:border-accent hover:text-accent active:translate-y-px sm:px-5 sm:text-sm"
                >
                  <span aria-hidden>./</span>
                  {s.label}
                  <Cursor />
                </a>
              ))}
            </div>
          </div>
          {uptime && (
            <div className="mt-8 hidden max-w-md lg:block">
              <CareerUptime uptime={uptime} summary={summary} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
