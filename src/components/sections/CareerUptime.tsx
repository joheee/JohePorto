import { formatMonthYear } from "@/lib/format";
import type { CareerUptime as Uptime } from "@/lib/career";

// A status page's uptime strip for the hero, drawn from the experience entries (see careerUptime): a green
// bar for each stretch you held a role, a dark one for a gap. `summary` is the headline numbers in words.
// The bars are decoration; the figures are described once for screen readers.
export default function CareerUptime({ uptime, summary }: { uptime: Uptime; summary: string }) {
  const percent = `${uptime.percent}%`;
  return (
    <div
      role="img"
      aria-label={`Career uptime ${percent} since ${formatMonthYear(uptime.since.month, uptime.since.year)}. ${summary}`}
      className="rounded-xl border border-border bg-card/60 px-4 py-3"
    >
      <div aria-hidden>
        <div className="flex items-baseline justify-between font-mono text-xs text-muted">
          <span>career uptime</span>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{percent}</span>
        </div>
        <div className="mt-2 flex h-8 items-stretch gap-[2px]">
          {uptime.bars.map((up, i) => (
            <span
              key={i}
              className={`uptime-bar min-w-0 flex-1 rounded-[2px] ${up ? "bg-emerald-600 dark:bg-emerald-500" : "bg-border"}`}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted">
          <span>{formatMonthYear(uptime.since.month, uptime.since.year)}</span>
          <span>now</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">{summary}</p>
      </div>
    </div>
  );
}
