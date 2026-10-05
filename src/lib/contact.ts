import { clientIp, consume, limiterKey, retryAfterSeconds, type LimitDb, type Rule } from "@/lib/limiter";

// POST /api/contact: validation, the honeypot, a rate limit, then the message is stored. Dependencies are passed
// in so the rules can be tested without Firestore.
export const VISITOR_RULES: Rule[] = [
  { limit: 3, windowMs: 10 * 60_000 }, // a person sends one, maybe two
  { limit: 10, windowMs: 24 * 3_600_000 }, // and a slow drip is stopped
];
export const SITE_RULES: Rule[] = [{ limit: 100, windowMs: 24 * 3_600_000 }]; // a flood from many addresses

export type ContactDeps = {
  limitDb: LimitDb;
  save: (message: { name: string; email: string; text: string }) => Promise<void>;
  salt: string;
  now?: () => number;
};

export async function handleContact(request: Request, deps: ContactDeps): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot filled: pretend success, store nothing (and spend no counts).
  if (typeof body.website === "string" && body.website !== "") return Response.json({ ok: true });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || !text || text.length > 5000) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  // Only a message that would be stored counts. If the limiter itself fails, the message is still accepted:
  // a broken counter must not lose a real message.
  try {
    const verdict = await consume(
      deps.limitDb,
      [
        { key: limiterKey("contact", clientIp(request.headers), deps.salt), rules: VISITOR_RULES },
        { key: "contact_site", rules: SITE_RULES },
      ],
      deps.now?.(),
    );
    if (!verdict.ok) {
      const retryAfter = retryAfterSeconds(verdict.retryAfterMs);
      return Response.json({ error: "Too many messages. Please try again later.", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }
  } catch (e) {
    console.error("contact: the rate limiter failed, accepting the message", e instanceof Error ? e.message : e);
  }

  await deps.save({ name, email, text });
  return Response.json({ ok: true });
}
