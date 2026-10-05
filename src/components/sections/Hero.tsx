import Link from "next/link";
import PingDot from "@/components/PingDot";
import { EditButton } from "@/components/admin/SiteEditor";
import RotatingText from "@/components/motion/RotatingText";
import { experienceStats, sortExperienceNewestFirst } from "@/lib/format";
import { getProfile } from "@/lib/settings";

// Staggered entrance in plain CSS (see .rise in globals.css): it starts on first paint, so the text is
// visible before JavaScript has loaded. That keeps Largest Contentful Paint fast.
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

// "4+" -> counts 0..4 then shows "+". The real value stays in the page for screen readers; the animated
// digits are drawn by CSS (see .count in globals.css).
function StatValue({ value }: { value: string }) {
  const m = /^(\d+)(.*)$/.exec(value);
  if (!m) return <p className="text-4xl font-bold tracking-tight">{value}</p>;
  return (
    <p className="text-4xl font-bold tracking-tight">
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        <span className="count" style={{ "--to": m[1] } as React.CSSProperties} />
        {m[2]}
      </span>
    </p>
  );
}

// `admin`: the copy on /admin/site, with an Edit button and in-page links.
export default async function Hero({ admin = false }: { admin?: boolean }) {
  const profile = await getProfile();
  const stats = experienceStats(profile.experience, profile.skills.length);
  // The newest role you are still in (nothing to maintain: it follows Settings > Experience).
  const current = sortExperienceNewestFirst(profile.experience).find((e) => e.current);
  const home = admin ? "" : "/"; // on /admin/site the in-page links must stay on that page

  return (
    <section
      id="hero"
      className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20"
    >
      {admin && <EditButton section="hero" className="absolute right-6 top-4 z-10" />}
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
          {current && (
            <div className="rise" style={rise(4)}>
              <p className="mt-5 font-mono text-sm text-muted">
                Currently <span className="text-foreground">{current.role}</span> at <span className="text-foreground">{current.company}</span>
              </p>
            </div>
          )}
          {/* Phones: the two main actions side by side, the social links as an even row below.
              From sm up the wrappers disappear (`contents`) and everything sits in one row. */}
          <div className="rise mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" style={rise(5)}>
            <div className="grid grid-cols-2 gap-3 sm:contents">
              <Link
                href={`${home}#contact`}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90 sm:px-6"
              >
                Get in touch
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a
                href="/resume.pdf"
                download
                aria-label="Download resume"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/60 px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent/10 sm:px-6"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </svg>
                <span aria-hidden className="sm:hidden">Resume</span>
                <span aria-hidden className="max-sm:hidden">Download resume</span>
              </a>
            </div>
            <div className="flex flex-wrap gap-2 sm:contents">
              {profile.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium transition-colors hover:border-accent hover:text-accent sm:flex-none sm:px-6 sm:py-3"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {stats.length > 0 && (
          <div className="rise hidden lg:block" style={rise(5)}>
            <ul className="space-y-3">
              {stats.map((s) => (
                <li key={s.label} className="rounded-2xl border border-border bg-card/60 px-5 py-4 transition-colors hover:border-accent">
                  <StatValue value={s.value} />
                  <p className="mt-1 text-sm text-muted">{s.label}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Scroll cue */}
      <Link
        href={`${home}#about`}
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
