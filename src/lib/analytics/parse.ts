import { createHash } from "node:crypto";
import { MAX_EVENTS, SECTION_IDS, isEventName, type Beacon, type SectionId, type Utm } from "./model";

// Everything the server works out about a request before counting it. Pure (apart from hashing), so it is
// tested without a browser or a database.

const BOT = /bot|crawl|spider|slurp|scrape|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|curl\/|wget|python-requests|httpclient|go-http|java\/|okhttp|axios|node-fetch|libwww|phantomjs|selenium|puppeteer|playwright/i;

// A request with no browser name at all, or one that says it is a crawler, is not a visitor.
export function isBot(userAgent: string): boolean {
  return !userAgent.trim() || BOT.test(userAgent);
}

export function deviceOf(userAgent: string): "phone" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk|playbook/i.test(userAgent) || (/android/i.test(userAgent) && !/mobile/i.test(userAgent))) return "tablet";
  if (/mobi|iphone|ipod|android|windows phone/i.test(userAgent)) return "phone";
  return "desktop";
}

export function browserOf(userAgent: string): string {
  if (/edg(e|a|ios)?\//i.test(userAgent)) return "edge";
  if (/opr\/|opera/i.test(userAgent)) return "opera";
  if (/firefox\/|fxios/i.test(userAgent)) return "firefox";
  if (/samsungbrowser/i.test(userAgent)) return "samsung";
  if (/chrome\/|crios/i.test(userAgent)) return "chrome";
  if (/safari\//i.test(userAgent) && /version\//i.test(userAgent)) return "safari";
  return "other";
}

// A short, safe label: lower case, only letters, digits and . _ - (anything else becomes -), cut to `max`.
export function cleanToken(value: unknown, max = 40): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

// Shortened links and app referrers that name a site more usefully than their own host does.
const REFERRER_ALIASES: Record<string, string> = {
  "lnkd.in": "linkedin.com",
  "t.co": "x.com",
  "twitter.com": "x.com",
  "l.facebook.com": "facebook.com",
  "lm.facebook.com": "facebook.com",
  "m.facebook.com": "facebook.com",
  "out.reddit.com": "reddit.com",
  "com.google.android.gm": "gmail",
  "mail.google.com": "gmail",
  "com.google.android.googlequicksearchbox": "google.com",
  "com.linkedin.android": "linkedin.com",
};

// Where a visit came from, as a site name: "linkedin.com", or "direct" when there is no referrer or it is this
// very site (a link inside the page).
export function referrerHost(referrer: string, ownHost: string): string {
  if (!referrer.trim()) return "direct";
  let host = "";
  try {
    const url = new URL(referrer);
    host = url.protocol === "android-app:" ? url.hostname || url.pathname.replace(/^\/+/, "") : url.hostname;
  } catch {
    return "direct";
  }
  host = host.toLowerCase().replace(/^www\./, "");
  if (!host) return "direct";
  const own = ownHost.toLowerCase().replace(/^www\./, "").replace(/:\d+$/, "");
  if (host === own) return "direct";
  const alias = REFERRER_ALIASES[host];
  if (alias) return alias;
  return cleanToken(host, 60) || "direct";
}

// "id-ID,id;q=0.9,en;q=0.8" -> "id"; anything unusual -> "xx".
export function languageOf(acceptLanguage: string | null): string {
  const first = (acceptLanguage ?? "").split(",")[0]?.trim().split(/[-;]/)[0]?.toLowerCase() ?? "";
  return /^[a-z]{2,3}$/.test(first) ? first : "xx";
}

// Vercel puts the visitor's country in a header; anything else is "xx" (unknown).
export function countryOf(header: string | null): string {
  const c = (header ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : "xx";
}

// "2026-10-06": the day a visit is counted on, in the time zone the owner reads the numbers in (UTC unless set).
export function dayKey(date: Date, timeZone = "UTC"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

// Counts a visitor once a day without keeping who they are: the hash mixes the day, the address, the browser
// and a secret, so it cannot be turned back into an address, and it means nothing on another day.
export function visitorHash(day: string, ip: string, userAgent: string, salt: string): string {
  return createHash("sha256").update([salt, day, ip, userAgent].join("|")).digest("base64url").slice(0, 22);
}

// A key that is safe as a field of a Firestore map: lower case letters, digits and . _ : -, cut to 60.
export function mapKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._:-]/g, "_").slice(0, 60) || "_";
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

// Checks what the browser sent. Anything that is not exactly what we expect is dropped (null), and the
// text that is kept is cut and cleaned: the endpoint is public, so it trusts nothing.
export function validateBeacon(raw: unknown): Beacon | null {
  if (!isObject(raw)) return null;
  if (raw.kind === "view") {
    const utm = isObject(raw.utm) ? raw.utm : {};
    const clean = (k: string) => cleanToken(utm[k]);
    const width = typeof raw.width === "number" && Number.isFinite(raw.width) ? Math.max(0, Math.min(10_000, Math.round(raw.width))) : 0;
    const cleanUtm: Utm = { source: clean("source"), medium: clean("medium"), campaign: clean("campaign") };
    return {
      kind: "view",
      ref: typeof raw.ref === "string" ? raw.ref.slice(0, 500) : "",
      utm: cleanUtm,
      theme: raw.theme === "light" ? "light" : "dark",
      width,
    };
  }
  if (raw.kind === "end") {
    const sections = Array.isArray(raw.sections) ? [...new Set(raw.sections.filter((s): s is SectionId => (SECTION_IDS as readonly unknown[]).includes(s)))] : [];
    const events = Array.isArray(raw.events) ? raw.events.filter((e): e is string => typeof e === "string" && isEventName(e)).slice(0, MAX_EVENTS) : [];
    return { kind: "end", sections, events };
  }
  return null;
}
