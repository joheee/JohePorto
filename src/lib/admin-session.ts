import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/session-cookie";

// Turns a fresh Firebase ID token into the httpOnly session cookie, for the owner only. Used right after the
// server checked the password (lib/login.ts), so the token is seconds old.
export async function startAdminSession(idToken: string): Promise<"ok" | "not-owner"> {
  const adminUid = process.env.ADMIN_UID;
  if (!adminUid) throw new Error("ADMIN_UID is not set");
  const decoded = await adminAuth().verifyIdToken(idToken, true);
  if (decoded.uid !== adminUid) return "not-owner";

  const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
  (await cookies()).set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return "ok";
}
