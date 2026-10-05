import { FieldValue } from "firebase-admin/firestore";
import { handleContact } from "@/lib/contact";
import { adminDb } from "@/lib/firebase-admin";
import type { LimitDb } from "@/lib/limiter";

// The rules (validation, honeypot, rate limit) are in lib/contact.ts.
export async function POST(request: Request) {
  return handleContact(request, {
    limitDb: adminDb() as unknown as LimitDb,
    save: async (message) => {
      await adminDb().collection("messages").add({ ...message, read: false, createdAt: FieldValue.serverTimestamp() });
    },
    salt: process.env.ANALYTICS_SALT || process.env.ADMIN_UID || "",
  });
}
