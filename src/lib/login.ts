import { blockedFor, clearHits, clientIp, limiterKey, recordHit, retryAfterSeconds, type LimitDb, type Rule } from "@/lib/limiter";
import { SignInUnavailable, type PasswordResult } from "@/lib/firebase-rest";

// POST /api/login: the admin sign-in. Only FAILED attempts count: 5 in 5 minutes from one address locks that
// address out until the oldest failure is 5 minutes old. While locked, the password is not even checked (a locked
// address cannot keep guessing). A success clears the address's failures. It is per address, never per account,
// so nobody can lock the owner out by typing the owner's email. Dependencies are passed in for the tests.
export const FAILED_LOGINS: Rule = { limit: 5, windowMs: 5 * 60_000 };

export type LoginDeps = {
  limitDb: LimitDb;
  signIn: (email: string, password: string) => Promise<PasswordResult>;
  startSession: (idToken: string) => Promise<"ok" | "not-owner">; // verifies the owner and sets the cookie
  salt: string;
  now?: () => number;
};

const tooMany = (ms: number) => {
  const retryAfter = retryAfterSeconds(ms);
  return Response.json({ error: "Too many failed attempts. Try again later.", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
};

export async function handleLogin(request: Request, deps: LoginDeps): Promise<Response> {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || email.length > 320 || password.length > 1024) return Response.json({ error: "Bad request" }, { status: 400 });

  const key = limiterKey("login", clientIp(request.headers), deps.salt);
  const now = deps.now?.();

  // If the counter cannot be read, sign-in is refused: failing open would switch the protection off.
  let wait: number;
  try {
    wait = await blockedFor(deps.limitDb, key, FAILED_LOGINS, now);
  } catch (e) {
    console.error("login: the rate limiter failed", e instanceof Error ? e.message : e);
    return Response.json({ error: "Sign-in is temporarily unavailable. Try again in a minute." }, { status: 503 });
  }
  if (wait > 0) return tooMany(wait);

  const fail = async (status: number, error: string) => {
    await recordHit(deps.limitDb, key, FAILED_LOGINS.windowMs, now).catch((e) => console.error("login: could not record the failure", e instanceof Error ? e.message : e));
    return Response.json({ error }, { status });
  };

  let result: PasswordResult;
  try {
    result = await deps.signIn(email, password);
  } catch (e) {
    console.error("login: Firebase Auth unavailable:", e instanceof SignInUnavailable ? e.message : e);
    return Response.json({ error: "Sign-in is temporarily unavailable. Try again in a minute." }, { status: 502 }); // not the visitor's fault: no count
  }
  if (result.kind === "invalid") return fail(401, "Invalid email or password.");
  if (result.kind === "throttled") return fail(429, "Too many attempts. Try again later.");

  let started: "ok" | "not-owner";
  try {
    started = await deps.startSession(result.idToken);
  } catch (e) {
    console.error("login: could not start the session", e instanceof Error ? e.message : e);
    return Response.json({ error: "Sign-in failed. Try again." }, { status: 500 });
  }
  if (started === "not-owner") return fail(403, "This account is not authorized.");

  await clearHits(deps.limitDb, key).catch(() => {});
  return Response.json({ ok: true });
}
