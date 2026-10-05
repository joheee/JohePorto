import { timeAgo } from "./format";

// The checks behind the dashboard's "System status" panel. Each returns one line: a name, a status and a short
// detail. The ones that touch the network or Firestore take what they need as arguments, so they can be
// tested without either. Nothing here ever prints a secret: configuration is reported by name only.
export type Status = "ok" | "warn" | "fail";
export type Check = { name: string; status: Status; detail: string };

// The worst status of the lot: one failure means the system is down, one warning means degraded.
export function overall(checks: Check[]): Status {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return "warn";
  return "ok";
}

// "2 h 14 m", "3 h", "9 m", "expired".
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} m`;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

const SESSION_WARN_MS = 15 * 60_000;

// Your admin session ends at a fixed time after sign-in, without warning: say how long is left.
export function sessionCheck(expiresAt: number | null, now = Date.now()): Check {
  if (expiresAt === null) return { name: "session", status: "warn", detail: "unknown" };
  const left = expiresAt - now;
  if (left <= 0) return { name: "session", status: "fail", detail: "expired, sign in again" };
  if (left < SESSION_WARN_MS) return { name: "session", status: "warn", detail: `${formatRemaining(left)} left, save your work and sign in again soon` };
  return { name: "session", status: "ok", detail: `signed in · ${formatRemaining(left)} left` };
}

const CACHE_STALE_MS = 70 * 60_000; // the cache renews every hour

// When the public site's cached data was last read from Firestore.
export function cacheCheck(readAt: string | null, now = new Date()): Check {
  if (!readAt) return { name: "site cache", status: "fail", detail: "could not be read" };
  const age = now.getTime() - new Date(readAt).getTime();
  const when = timeAgo(readAt, now);
  return age > CACHE_STALE_MS
    ? { name: "site cache", status: "warn", detail: `read ${when}, older than it should be: refresh it` }
    : { name: "site cache", status: "ok", detail: `read ${when} · renews every hour` };
}

// What you have to set for the site to work: the service account and owner (server) and the six web-config
// values of the Firebase project (browser). Reported by name, never by value.
export const REQUIRED_ENV = [
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "ADMIN_UID",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export function configCheck(env: Record<string, string | undefined>): Check {
  const missing = REQUIRED_ENV.filter((name) => !env[name]?.trim());
  return missing.length === 0
    ? { name: "config", status: "ok", detail: `${REQUIRED_ENV.length}/${REQUIRED_ENV.length} variables set` }
    : { name: "config", status: "fail", detail: `missing ${missing.join(", ")}` };
}

// Where this copy of the site is running, and which commit (Vercel sets these on a deploy).
export function deployCheck(env: Record<string, string | undefined>): Check {
  const vercel = env.VERCEL_ENV;
  const sha = env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const message = env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0]?.trim();
  if (!vercel) return { name: "deploy", status: "ok", detail: "local · not a Vercel deployment" };
  const parts = [vercel, sha, message && message.length > 60 ? `${message.slice(0, 57)}…` : message].filter(Boolean);
  return { name: "deploy", status: "ok", detail: parts.join(" · ") };
}

const SLOW_MS = 1500;

// Runs `read` (a small Firestore read) and times it.
export async function firestoreCheck(read: () => Promise<unknown>): Promise<Check> {
  const started = performance.now();
  try {
    await read();
  } catch {
    return { name: "firestore", status: "fail", detail: "read failed" };
  }
  const ms = Math.round(performance.now() - started);
  return { name: "firestore", status: ms > SLOW_MS ? "warn" : "ok", detail: ms > SLOW_MS ? `slow · ${ms} ms` : `ok · ${ms} ms` };
}

type Fetch = (url: string, init?: { method?: string; signal?: AbortSignal; cache?: "no-store" }) => Promise<{ ok: boolean; status: number; headers: { get(name: string): string | null }; text(): Promise<string> }>;

// Asks one of the site's own addresses and reports what came back. `describe` turns a good answer into the
// detail text, or returns null when the content is not what it should be.
async function httpCheck(
  name: string,
  url: string,
  fetchFn: Fetch,
  describe: (res: Awaited<ReturnType<Fetch>>) => Promise<string | null>,
  method = "GET",
): Promise<Check> {
  try {
    const res = await fetchFn(url, { method, signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!res.ok) return { name, status: "fail", detail: `HTTP ${res.status}` };
    const detail = await describe(res);
    return detail === null ? { name, status: "fail", detail: "unexpected content" } : { name, status: "ok", detail };
  } catch {
    return { name, status: "fail", detail: "no answer" };
  }
}

export const pdfCheck = (origin: string, fetchFn: Fetch = fetch as unknown as Fetch) =>
  httpCheck("resume.pdf", `${origin}/resume.pdf`, fetchFn, async (r) => {
    const type = r.headers.get("content-type") ?? "";
    return type.includes("application/pdf") ? `200 · ${type.split(";")[0]}` : null;
  }, "HEAD");

export const sitemapCheck = (origin: string, fetchFn: Fetch = fetch as unknown as Fetch) =>
  httpCheck("sitemap", `${origin}/sitemap.xml`, fetchFn, async (r) => {
    const urls = (await r.text()).match(/<url>/g)?.length ?? 0;
    return urls > 0 ? `ok · ${urls} ${urls === 1 ? "url" : "urls"}` : null;
  });

export const robotsCheck = (origin: string, fetchFn: Fetch = fetch as unknown as Fetch) =>
  httpCheck("robots", `${origin}/robots.txt`, fetchFn, async (r) => ((await r.text()).includes("Disallow: /admin") ? "ok · /admin kept out of search" : null));
