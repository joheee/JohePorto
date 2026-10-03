// TEMPORARY DIAGNOSTIC: delete this file after debugging the Vercel 500.
// Exposes only the (public) project ID and true/false flags, never secret values.
export const dynamic = "force-dynamic";

export async function GET() {
  const e = process.env;

  let serviceAccount: string = "missing";
  if (e.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const k = JSON.parse(e.FIREBASE_SERVICE_ACCOUNT_KEY);
      serviceAccount =
        k.project_id === e.NEXT_PUBLIC_FIREBASE_PROJECT_ID
          ? "parses, project_id matches"
          : "parses, but project_id differs from NEXT_PUBLIC_FIREBASE_PROJECT_ID";
    } catch {
      serviceAccount = "set but NOT valid JSON (check quotes / one line)";
    }
  }

  // Reproduce what the login page does: load the Firebase client SDK.
  let clientInit = "ok";
  try {
    await import("@/lib/firebase");
  } catch (err) {
    clientInit = `FAILED: ${(err as { code?: string }).code ?? (err as Error).message}`;
  }

  return Response.json({
    projectId: e.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
    present: {
      apiKey: !!e.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!e.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      storageBucket: !!e.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!e.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!e.NEXT_PUBLIC_FIREBASE_APP_ID,
      adminUid: !!e.ADMIN_UID,
    },
    serviceAccount,
    clientInit,
  });
}
