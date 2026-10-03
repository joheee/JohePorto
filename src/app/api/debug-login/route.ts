// TEMPORARY DIAGNOSTIC: delete after debugging the /admin/login 500 on Vercel.
// Runs the same server-side steps as the login page, reporting each result (no secrets).
export const dynamic = "force-dynamic";

const msg = (e: unknown) => {
  const err = e as { code?: string; message?: string; stack?: string };
  return `${err.code ?? ""} ${(err.message ?? String(e)).slice(0, 300)}`.trim();
};

export async function GET() {
  const steps: Record<string, string> = {};

  try {
    await import("@/lib/firebase-admin");
    steps["import firebase-admin module"] = "ok";
  } catch (e) {
    steps["import firebase-admin module"] = `FAILED: ${msg(e)}`;
  }

  try {
    const { cookies } = await import("next/headers");
    await cookies();
    steps["cookies()"] = "ok";
  } catch (e) {
    steps["cookies()"] = `FAILED: ${msg(e)}`;
  }

  try {
    const { getAdmin } = await import("@/lib/auth");
    const admin = await getAdmin();
    steps["getAdmin() (no cookie => null)"] = admin ? "returned a user" : "null (expected)";
  } catch (e) {
    steps["getAdmin() (no cookie => null)"] = `FAILED: ${msg(e)}`;
  }

  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    await adminAuth().getUser(process.env.ADMIN_UID ?? "");
    steps["adminAuth().getUser(ADMIN_UID)"] = "ok";
  } catch (e) {
    steps["adminAuth().getUser(ADMIN_UID)"] = `FAILED: ${msg(e)}`;
  }

  try {
    await import("@/components/admin/LoginForm");
    steps["import LoginForm (client SDK)"] = "ok";
  } catch (e) {
    steps["import LoginForm (client SDK)"] = `FAILED: ${msg(e)}`;
  }

  return Response.json(steps);
}
