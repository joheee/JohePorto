import { changeText, number, percent, shortDay } from "@/lib/analytics/labels";
import type { Ranked } from "@/lib/analytics/summarize";

// A card of the Analytics page: a mono title, then its content.
export function Panel({ id, title, hint, children, className = "" }: { id: string; title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`rounded-2xl border border-border bg-card/60 p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {hint && <span className="font-mono text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

// A big number with how it changed against the period before.
export function Stat({ label, value, change, previousLabel }: { label: string; value: string; change?: number | null; previousLabel?: string }) {
  const tone = change === null || change === undefined || change === 0 ? "text-muted" : change > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight">{value}</p>
      {change !== undefined && (
        <p className={`mt-1 font-mono text-xs ${tone}`}>
          {changeText(change)}
          <span className="sr-only">{change === null ? ", nothing to compare with" : change > 0 ? `, up ${previousLabel ?? ""}` : change < 0 ? `, down ${previousLabel ?? ""}` : `, unchanged ${previousLabel ?? ""}`}</span>
          {previousLabel && <span aria-hidden className="text-muted"> {previousLabel}</span>}
        </p>
      )}
    </div>
  );
}

// Views per day as bars, with the visitors of each day drawn over them. Plain SVG, no library.
export function BarChart({ series }: { series: { day: string; views: number; visitors: number }[] }) {
  const n = series.length;
  const max = Math.max(1, ...series.map((s) => s.views));
  const w = 100 / n;
  const height = (v: number) => (v > 0 ? Math.max(2, (v / max) * 100) : 0);
  const total = series.reduce((sum, s) => sum + s.views, 0);
  const first = series[0]?.day;
  const last = series[n - 1]?.day;
  const middle = series[Math.floor((n - 1) / 2)]?.day;

  return (
    <figure>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-36 w-full overflow-visible" role="img" aria-label={`Views per day from ${first ? shortDay(first) : ""} to ${last ? shortDay(last) : ""}: ${number(total)} in total`}>
        <line x1="0" y1="100" x2="100" y2="100" className="stroke-border" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        {series.map((s, i) => (
          <g key={s.day}>
            <title>{`${shortDay(s.day)}: ${number(s.views)} views, ${number(s.visitors)} visitors`}</title>
            <rect x={i * w + w * 0.15} y={100 - height(s.views)} width={w * 0.7} height={height(s.views)} className="fill-accent/35" />
            <rect x={i * w + w * 0.15} y={100 - height(Math.min(s.visitors, s.views))} width={w * 0.7} height={height(Math.min(s.visitors, s.views))} className="fill-accent" />
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between font-mono text-xs text-muted">
        <span>{first && shortDay(first)}</span>
        <span className="max-sm:hidden">{middle && shortDay(middle)}</span>
        <span>{last && shortDay(last)}</span>
      </figcaption>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-sm bg-accent/35" /> views
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-sm bg-accent" /> visitors
        </span>
      </p>
    </figure>
  );
}

// A ranked list: each row has a name, its count and share, and a bar as wide as the share.
export function RankedBars({ rows, label = (k: string) => k, empty = "Nothing yet." }: { rows: Ranked; label?: (key: string) => string; empty?: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ol className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{label(r.key)}</span>
            <span className="shrink-0 font-mono text-xs text-muted">
              {number(r.count)} · {percent(r.share)}
            </span>
          </div>
          <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, r.share * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
