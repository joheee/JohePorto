import { startAdminSession } from "@/lib/admin-session";
import { adminDb } from "@/lib/firebase-admin";
import { signInWithPassword } from "@/lib/firebase-rest";
import type { LimitDb } from "@/lib/limiter";
import { handleLogin } from "@/lib/login";
import { siteUrl } from "@/lib/site";

// The admin sign-in. The rules (failed-attempt limit, owner check) are in lib/login.ts.
export async function POST(request: Request) {
  return handleLogin(request, {
    limitDb: adminDb() as unknown as LimitDb,
    signIn: (email, password) => signInWithPassword(email, password, { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, referer: `${siteUrl}/` }),
    startSession: startAdminSession,
    salt: process.env.ANALYTICS_SALT || process.env.ADMIN_UID || "",
  });
}
