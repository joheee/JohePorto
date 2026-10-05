import type { Metrics, PageSpeedRun, Scores, Strategy } from "./model";

// Runs one PageSpeed Insights test through Google's public API (the same Lighthouse as pagespeed.web.dev).
// `fetch` is passed in so the tests need no network. The address is always the site's own (never typed in).
const API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

export class PageSpeedError extends Error {}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const score = (cat: unknown): number | null => {
  const s = num((cat as { score?: unknown } | undefined)?.score);
  return s === null ? null : Math.round(s * 100);
};

// Reads the numbers we show out of the (large) Lighthouse result.
export function parsePageSpeed(json: unknown, strategy: Strategy, url: string, at: Date): PageSpeedRun {
  const lh = (json as { lighthouseResult?: { categories?: Record<string, unknown>; audits?: Record<string, { numericValue?: unknown }> } } | null)?.lighthouseResult;
  if (!lh?.categories) throw new PageSpeedError("Google answered without a result. Try again in a minute.");
  const c = lh.categories;
  const a = lh.audits ?? {};
  const scores: Scores = { performance: score(c.performance), accessibility: score(c.accessibility), bestPractices: score(c["best-practices"]), seo: score(c.seo) };
  const metrics: Metrics = {
    lcp: num(a["largest-contentful-paint"]?.numericValue),
    cls: num(a["cumulative-layout-shift"]?.numericValue),
    tbt: num(a["total-blocking-time"]?.numericValue),
    fcp: num(a["first-contentful-paint"]?.numericValue),
    si: num(a["speed-index"]?.numericValue),
  };
  return { at: at.toISOString(), strategy, url, scores, metrics };
}

export type RunOptions = { apiKey?: string; fetch?: typeof fetch; now?: () => Date; timeoutMs?: number };

export async function runPageSpeed(url: string, strategy: Strategy, { apiKey, fetch: doFetch = fetch, now = () => new Date(), timeoutMs = 55_000 }: RunOptions = {}): Promise<PageSpeedRun> {
  const query = new URLSearchParams({ url, strategy });
  for (const c of CATEGORIES) query.append("category", c);
  if (apiKey) query.set("key", apiKey);

  let res: Response;
  try {
    res = await doFetch(`${API}?${query}`, { cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new PageSpeedError("Google did not answer in time. Try again in a minute.");
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // handled below by the status
  }
  if (!res.ok) {
    const message = (body as { error?: { message?: string } } | null)?.error?.message;
    if (res.status === 429) throw new PageSpeedError("Google's PageSpeed quota is used up. Try again later, or set PAGESPEED_API_KEY (a free key) for a bigger quota.");
    throw new PageSpeedError(`Google could not test the page (${res.status})${message ? `: ${message.slice(0, 160)}` : "."}`);
  }
  return parsePageSpeed(body, strategy, url, now());
}
