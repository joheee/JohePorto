// A PageSpeed Insights test (Google's Lighthouse run against the live site) as the Analytics page keeps it.
export type Strategy = "mobile" | "desktop";
export const STRATEGIES: Strategy[] = ["mobile", "desktop"];

export type Scores = { performance: number | null; accessibility: number | null; bestPractices: number | null; seo: number | null }; // 0-100
export type Metrics = { lcp: number | null; cls: number | null; tbt: number | null; fcp: number | null; si: number | null }; // ms, cls has no unit

export type PageSpeedRun = {
  id?: string;
  at: string; // ISO time the test finished
  strategy: Strategy;
  url: string;
  scores: Scores;
  metrics: Metrics;
};

export const SCORE_LABELS: Record<keyof Scores, string> = { performance: "Performance", accessibility: "Accessibility", bestPractices: "Best practices", seo: "SEO" };

export type Grade = "good" | "ok" | "poor" | "none";

// Lighthouse's own bands: 90 and up is green, 50 to 89 amber, below 50 red.
export function scoreGrade(score: number | null): Grade {
  if (score === null) return "none";
  return score >= 90 ? "good" : score >= 50 ? "ok" : "poor";
}

// Core Web Vitals thresholds (good / needs improvement / poor), https://web.dev/articles/vitals
export function metricGrade(name: "lcp" | "cls" | "tbt", value: number | null): Grade {
  if (value === null) return "none";
  const [good, ok] = name === "lcp" ? [2500, 4000] : name === "cls" ? [0.1, 0.25] : [200, 600];
  return value <= good ? "good" : value <= ok ? "ok" : "poor";
}

export function formatMetric(name: keyof Metrics, value: number | null): string {
  if (value === null) return "n/a";
  if (name === "cls") return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") || "0";
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
}
