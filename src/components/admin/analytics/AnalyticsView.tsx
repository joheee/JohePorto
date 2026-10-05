import Link from "next/link";
import { SECTION_LABELS, countryName, labelFor, number, shortDay } from "@/lib/analytics/labels";
import { RANGES, type Range } from "@/lib/analytics/range";
import type { Ranked, Summary } from "@/lib/analytics/summarize";
import { BarChart, Panel, RankedBars, Stat } from "./Charts";
import LinkBuilder from "./LinkBuilder";

const FUNNEL_LABELS: Record<string, string> = { visits: "Visited the page", started: "Started the contact form", sent: "Sent a message" };

// Everything the Analytics page shows, for a summary of one period. Server-rendered: no script on the page
// apart from the link builder.
export default function AnalyticsView({ summary: s, range, collecting, siteUrl, timeZone }: { summary: Summary; range: Range; collecting: boolean; siteUrl: string; timeZone: string }) {
  const previous = `vs the ${range} days before`;

  const funnel: Ranked = [
    { key: "visits", count: s.totals.views, share: s.totals.views > 0 ? 1 : 0 },
    ...s.journey.sections
      .filter((x) => x.id !== "hero" && !(x.id === "reviews" && x.count === 0))
      .map((x) => ({ key: x.id, count: x.count, share: x.share })),
    { key: "started", count: s.journey.started, share: s.journey.startedShare },
    { key: "sent", count: s.journey.sent, share: s.journey.sentShare },
  ];
  const funnelLabel = (key: string) => FUNNEL_LABELS[key] ?? `Reached ${SECTION_LABELS[key as keyof typeof SECTION_LABELS] ?? key}`;

  const tiles: [string, number][] = [
    ["Resume opened", s.clicks.resume],
    ["GitHub", s.clicks.github],
    ["LinkedIn", s.clicks.linkedin],
    ["Upwork", s.clicks.upwork],
    ["Other profiles", s.clicks.other],
    ["Email copied", s.clicks.copyEmail],
    ["git clone copied", s.clicks.copyClone],
    ["curl copied", s.clicks.copyCurl],
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Analytics</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Who visits, and what they do</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">Visits to your public home page, counted without cookies. Only daily totals are kept: no visitor profiles.</p>
        </div>
        <nav aria-label="Period" className="flex gap-1.5">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${r === range ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent hover:text-foreground"}`}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </header>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
        <span className={`inline-flex items-center gap-2 ${collecting ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
          <span aria-hidden className={`h-2 w-2 rounded-full ${collecting ? "bg-emerald-500" : "bg-amber-500"}`} />
          {collecting ? "collecting visits" : "not collecting here: development visits are not counted (set ANALYTICS_ENABLED=1 to test)"}
        </span>
        <span>
          {shortDay(s.from)} to {shortDay(s.to)} · days in {timeZone}
        </span>
      </p>

      {!s.hasData ? (
        <Panel id="empty" title="No visits counted yet">
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Counting starts when the site is live: visits show up here within a minute of happening, and the first numbers fill in as people arrive. Your own visits while you are signed in, bots (counted separately), and
            people who send Do Not Track are left out. Meanwhile, you can make the tracked links below, so you know where the first visitors come from.
          </p>
        </Panel>
      ) : (
        <>
          <Panel id="traffic" title="Traffic" hint={`last ${range} days`}>
            <div className="mb-6 grid gap-6 sm:grid-cols-3">
              <Stat label="Page views" value={number(s.totals.views)} change={s.change.views} previousLabel={previous} />
              <Stat label="Visitors" value={number(s.totals.visitors)} change={s.change.visitors} previousLabel={previous} />
              <Stat label="Bots filtered" value={number(s.totals.bots)} />
            </div>
            <BarChart series={s.series} />
          </Panel>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel id="sources" title="Where visitors come from">
              <RankedBars rows={s.referrers} label={labelFor} />
              {s.campaigns.length > 0 && (
                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Your tracked links (utm_source)</h3>
                  <RankedBars rows={s.campaigns} />
                </div>
              )}
            </Panel>

            <Panel id="journey" title="How far visitors get" hint="share of visits">
              <RankedBars rows={funnel} label={funnelLabel} />
            </Panel>
          </div>

          <Panel id="clicks" title="What they click" hint={`last ${range} days`}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tiles
                .filter(([name, n]) => n > 0 || name !== "Other profiles")
                .map(([name, n]) => (
                  <li key={name} className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-2xl font-bold tracking-tight">{number(n)}</p>
                    <p className="mt-0.5 text-xs text-muted">{name}</p>
                  </li>
                ))}
            </ul>
            <h3 className="mb-3 mt-6 font-mono text-xs uppercase tracking-widest text-muted">Projects opened</h3>
            <RankedBars rows={s.projects} empty="No project links clicked yet." />
          </Panel>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel id="countries" title="Countries">
              <RankedBars rows={s.countries} label={countryName} />
            </Panel>
            <Panel id="devices" title="Devices and browsers">
              <RankedBars rows={s.devices} label={labelFor} />
              <div className="mt-6 border-t border-border pt-5">
                <RankedBars rows={s.browsers} label={labelFor} />
              </div>
              {s.themes.length > 0 && (
                <div className="mt-6 border-t border-border pt-5">
                  <RankedBars rows={s.themes} label={labelFor} />
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      <Panel id="links" title="Tracked links" hint="know which link works">
        <LinkBuilder siteUrl={siteUrl} />
      </Panel>

      <Panel id="privacy" title="How this counts, and what it never keeps">
        <ul className="space-y-2 text-sm leading-6 text-muted">
          <li>No cookies, and nothing is stored in the visitor&apos;s browser.</li>
          <li>No IP addresses and no browser details are kept. To count a visitor once a day, a one-way hash of the day, address and browser is used; it is deleted after two days, and only the totals remain.</li>
          <li>Not counted: you while signed in, people who send Do Not Track, local development, and bots (their visits are only counted as filtered traffic).</li>
          <li>Country comes from your host, device and browser from the browser&apos;s own description, and the page a visitor reached from what the page reports as they leave.</li>
        </ul>
      </Panel>
    </div>
  );
}
