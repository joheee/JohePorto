import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

// Basic version: validation + honeypot. Rate limiting / App Check comes in the security step.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot filled: pretend success, store nothing.
  if (typeof body.website === "string" && body.website !== "") {
    return Response.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (
    !name || name.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 ||
    !text || text.length > 5000
  ) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  await adminDb()
    .collection("messages")
    .add({ name, email, text, read: false, createdAt: FieldValue.serverTimestamp() });

  return Response.json({ ok: true });
}
