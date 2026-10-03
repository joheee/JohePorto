import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/session-cookie";

// Exchange a fresh Firebase ID token for an httpOnly session cookie (owner only).
export async function POST(request: Request) {
  const adminUid = process.env.ADMIN_UID;
  const body = await request.json().catch(() => null);
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";

  if (!adminUid || !idToken) {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    if (decoded.uid !== adminUid) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    // Only accept tokens from a sign-in in the last 5 minutes.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return Response.json({ error: "Recent sign-in required" }, { status: 401 });
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    (await cookies()).set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
}

// Sign out: clear the cookie.
export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
