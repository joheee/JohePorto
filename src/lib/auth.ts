import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminAuth } from "./firebase-admin";
import { SESSION_COOKIE } from "./session-cookie";

export type AdminUser = { uid: string; email: string | null };

// Data access layer: the real admin check. Verifies the session cookie with Firebase
// (including revocation) and that the user is the owner. Fails closed.
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const adminUid = process.env.ADMIN_UID;
  if (!adminUid) return null;

  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(value, true);
    if (decoded.uid !== adminUid) return null;
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
});

// For admin pages/layouts: redirect to the login page when not the owner.
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
