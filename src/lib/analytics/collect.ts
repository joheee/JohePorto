import { SESSION_COOKIE } from "../session-cookie";
import { validateBeacon } from "./parse";
import { record, type Db } from "./record";

// The logic behind POST /api/collect, with its dependencies passed in so every rule can be tested.
// It answers 204 with no body to everything: the browser never learns what was counted or why not.

export const MAX_BODY_BYTES = 4096;

// Analytics counts real visits only. The development server shares its Firestore with production, so it is
// off there unless you turn it on (ANALYTICS_ENABLED=1); ANALYTICS_ENABLED=0 turns it off anywhere.
export function analyticsEnabled(env: Record<string, string | undefined>): boolean {
  if (env.ANALYTICS_ENABLED === "0") return false;
  return env.NODE_ENV === "production" || env.ANALYTICS_ENABLED === "1";
}

export type CollectDeps = {
  db: Db;
  inc: (n: number) => unknown;
  env: Record<string, string | undefined>;
  allow: (key: string) => boolean; // the rate limiter
  now?: Date;
};

const noContent = () => new Response(null, { status: 204 });

export async function handleCollect(request: Request, deps: CollectDeps): Promise<Response> {
  const { env } = deps;
  if (!analyticsEnabled(env)) return noContent();

  const h = request.headers;
  // Your own visits (you are signed in to the admin) and people who asked not to be tracked are not counted.
  if ((h.get("cookie") ?? "").split(/;\s*/).some((c) => c.startsWith(`${SESSION_COOKIE}=`))) return noContent();
  if (h.get("dnt") === "1" || h.get("sec-gpc") === "1") return noContent();

  // Only the site's own pages report to it.
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const origin = h.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== host) return noContent();
    } catch {
      return noContent();
    }
  }

  const declared = Number(h.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return noContent();
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return noContent();

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return noContent();
  }
  const beacon = validateBeacon(raw);
  if (!beacon) return noContent();

  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  if (!deps.allow(ip || "unknown")) return noContent();

  try {
    await record(deps.db, {
      beacon,
      userAgent: h.get("user-agent") ?? "",
      ip,
      country: h.get("x-vercel-ip-country"),
      acceptLanguage: h.get("accept-language"),
      ownHost: host,
      salt: env.ANALYTICS_SALT || env.ADMIN_UID || "portfolio",
      inc: deps.inc,
      now: deps.now,
      timeZone: env.ANALYTICS_TIMEZONE || "UTC",
    });
  } catch (e) {
    // Counting must never break a visit.
    console.error("analytics: could not record", e instanceof Error ? e.message : e);
  }
  return noContent();
}
