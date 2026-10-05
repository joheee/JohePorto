import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Sign out: clear the cookie. (Signing in is POST /api/login, which checks the password on the server.)
export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
