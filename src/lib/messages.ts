import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import type { Message } from "@/types/content";
import { adminDb } from "./firebase-admin";

// Newest first. Admin SDK only: the public can create messages but never read them.
export async function getMessages(limit = 200): Promise<Message[]> {
  const snap = await adminDb().collection("messages").orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      name: String(x.name ?? ""),
      email: String(x.email ?? ""),
      text: String(x.text ?? ""),
      createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate().toISOString() : "",
      read: x.read === true,
    };
  });
}
