// Checks an email and password against Firebase Authentication from the server, through its REST API (the same
// service the browser SDK used to call). The password never has to be checked in the browser, so the server can
// count failed attempts. `fetch` is passed in for tests.
const ENDPOINT = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

export type PasswordResult = { kind: "ok"; idToken: string } | { kind: "invalid" } | { kind: "throttled" };

// Firebase's answers for a wrong email or password (it says INVALID_LOGIN_CREDENTIALS when email enumeration
// protection is on, the others when it is off).
const BAD_CREDENTIALS = new Set(["INVALID_LOGIN_CREDENTIALS", "INVALID_PASSWORD", "EMAIL_NOT_FOUND", "INVALID_EMAIL", "MISSING_PASSWORD", "USER_DISABLED"]);

export class SignInUnavailable extends Error {}

export async function signInWithPassword(
  email: string,
  password: string,
  { apiKey, referer, fetch: doFetch = fetch }: { apiKey: string | undefined; referer?: string; fetch?: typeof fetch },
): Promise<PasswordResult> {
  if (!apiKey) throw new SignInUnavailable("NEXT_PUBLIC_FIREBASE_API_KEY is not set");
  let res: Response;
  try {
    res = await doFetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      // A browser key can be limited to your site's address; the server has no browser, so it names the site itself.
      headers: { "Content-Type": "application/json", ...(referer ? { Referer: referer } : {}) },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new SignInUnavailable("could not reach Firebase Auth");
  }
  const body = (await res.json().catch(() => null)) as { idToken?: unknown; error?: { message?: string } } | null;
  if (res.ok && typeof body?.idToken === "string") return { kind: "ok", idToken: body.idToken };

  const code = (body?.error?.message ?? "").split(" ")[0];
  if (BAD_CREDENTIALS.has(code)) return { kind: "invalid" };
  if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") return { kind: "throttled" };
  throw new SignInUnavailable(`Firebase Auth answered ${res.status} ${code || "without a reason"}`);
}
