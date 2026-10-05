"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runSpeedTest } from "@/app/admin/(protected)/pagespeed-actions";
import { ghostButtonClass } from "@/components/ui/fields";
import Icon from "@/components/ui/Icons";
import { Panel } from "./Charts";
import { SCORE_LABELS, formatMetric, metricGrade, scoreGrade, type Grade, type PageSpeedRun, type Scores } from "@/lib/pagespeed/model";
import { latestByStrategy } from "@/lib/pagespeed/store";

const TONE: Record<Grade, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  ok: "text-amber-700 dark:text-amber-400",
  poor: "text-red-600 dark:text-red-400",
  none: "text-muted",
};
const GRADE_WORD: Record<Grade, string> = { good: "good", ok: "needs work", poor: "poor", none: "no score" };

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const KEYS = Object.keys(SCORE_LABELS) as (keyof Scores)[];

// The PageSpeed Insights panel of the Analytics page: a button that tests the live site (mobile and desktop),
// the latest scores and Core Web Vitals, and the earlier runs for a trend. `disabledReason` explains why the
// button is off (for example on localhost, where Google cannot reach the site).
export default function SpeedPanel({ runs, testUrl, disabledReason }: { runs: PageSpeedRun[]; testUrl: string; disabledReason?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "warning" | "done"; text: string } | null>(null);

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await runSpeedTest();
      if (res.ok) {
        setMessage(res.warning ? { kind: "warning", text: res.warning } : { kind: "done", text: "Test finished. The numbers below are new." });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: res.error });
      }
    });
  }

  const latest = latestByStrategy(runs);
  const history = runs.slice(0, 10);

  return (
    <Panel id="speed" title="Site speed" hint="Google PageSpeed Insights">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button type="button" onClick={run} disabled={pending || !!disabledReason} className={ghostButtonClass}>
          <Icon name="refresh" className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Testing… about 30 seconds" : "Run test"}
        </button>
        <p className="font-mono text-xs text-muted">
          tests {testUrl} on mobile and desktop
        </p>
      </div>
      {disabledReason && <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">{disabledReason}</p>}
      <p role={message?.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm ${message?.kind === "error" ? "text-red-600 dark:text-red-400" : message?.kind === "warning" ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"} ${message ? "" : "sr-only"}`}>
        {message?.text ?? ""}
      </p>

      {runs.length === 0 ? (
        <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
          No test yet. Press Run test: Google loads your live page in a lab (a throttled phone, then a desktop) and scores performance, accessibility, best practices and SEO. Each run is kept here so you can see the trend after a change.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {(["mobile", "desktop"] as const).map((s) => {
              const r = latest[s];
              return (
                <section key={s} aria-label={`Latest ${s} test`} className="rounded-xl border border-border bg-background/60 p-4">
                  <h3 className="flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-muted">
                    <span>{s}</span>
                    <span className="normal-case tracking-normal">{r ? when(r.at) : "not tested yet"}</span>
                  </h3>
                  {r && (
                    <>
                      <ul className="mt-3 grid grid-cols-4 gap-2">
                        {KEYS.map((k) => {
                          const g = scoreGrade(r.scores[k]);
                          return (
                            <li key={k}>
                              <p className={`text-3xl font-bold tracking-tight ${TONE[g]}`}>
                                {r.scores[k] ?? "–"}
                                <span className="sr-only"> ({GRADE_WORD[g]})</span>
                              </p>
                              <p className="mt-0.5 text-xs leading-4 text-muted">{SCORE_LABELS[k]}</p>
                            </li>
                          );
                        })}
                      </ul>
                      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 font-mono text-xs">
                        {(["lcp", "cls", "tbt"] as const).map((m) => {
                          const g = metricGrade(m, r.metrics[m]);
                          return (
                            <div key={m}>
                              <dt className="uppercase text-muted">{m === "tbt" ? "TBT" : m === "lcp" ? "LCP" : "CLS"}</dt>
                              <dd className={`mt-0.5 text-sm font-semibold ${TONE[g]}`}>
                                {formatMetric(m, r.metrics[m])}
                                <span className="sr-only"> ({GRADE_WORD[g]})</span>
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </>
                  )}
                </section>
              );
            })}
          </div>

          <h3 className="mb-3 mt-8 font-mono text-xs uppercase tracking-widest text-muted">Earlier runs</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <caption className="sr-only">Earlier PageSpeed runs, newest first</caption>
              <thead className="font-mono text-xs uppercase text-muted">
                <tr>
                  <th scope="col" className="py-1.5 pr-4 font-normal">When</th>
                  <th scope="col" className="py-1.5 pr-4 font-normal">Device</th>
                  {KEYS.map((k) => (
                    <th key={k} scope="col" className="py-1.5 pr-4 text-right font-normal">
                      {SCORE_LABELS[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id ?? r.at + r.strategy} className="border-t border-border">
                    <td className="py-2 pr-4 text-muted">{when(r.at)}</td>
                    <td className="py-2 pr-4">{r.strategy}</td>
                    {KEYS.map((k) => (
                      <td key={k} className={`py-2 pr-4 text-right font-mono font-semibold ${TONE[scoreGrade(r.scores[k])]}`}>
                        {r.scores[k] ?? "–"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}
