"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { withCreatedAt } from "@/lib/format";
import { adminDb } from "@/lib/firebase-admin";
import { SLUG_RE, ValidationError, parseProfile, parseProject } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Server Actions are reachable by direct POST, so every one re-checks the owner itself.
async function guard(fn: () => Promise<void>, { paths }: { paths?: string[] } = {}): Promise<ActionResult> {
  if (!(await getAdmin())) return { ok: false, error: "Not authorized. Please sign in again." };
  try {
    await fn();
    // Default: rebuild the whole site (public pages, name/metadata in the layout, admin lists).
    // `paths`: refresh only those pages. Either way the page you're on updates in the same response.
    if (paths) paths.forEach((p) => revalidatePath(p));
    else revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.message };
    console.error("admin action failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveProfile(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const profile = parseProfile(input);
    await adminDb()
      .doc("settings/profile")
      .set({
        ...profile,
        // createdAt is a real Firestore Timestamp: kept for existing entries, set now for new ones.
        experience: withCreatedAt(profile.experience).map((e) => ({
          ...e,
          createdAt: Timestamp.fromDate(new Date(e.createdAt)),
        })),
        updatedAt: FieldValue.serverTimestamp(),
      });
  });
}

export async function saveProject(input: unknown, isNew: boolean): Promise<ActionResult> {
  return guard(async () => {
    const project = parseProject(input);
    const ref = adminDb().collection("projects").doc(project.slug);
    const { slug, ...data } = project; // the slug is the document ID
    void slug;

    if (isNew) {
      if ((await ref.get()).exists) throw new ValidationError("A project with this slug already exists");
      await ref.create({ ...data, updatedAt: FieldValue.serverTimestamp() });
    } else {
      if (!(await ref.get()).exists) throw new ValidationError("Project not found");
      await ref.set({ ...data, updatedAt: FieldValue.serverTimestamp() });
    }
  });
}

export async function deleteProject(slug: string): Promise<ActionResult> {
  return guard(async () => {
    if (typeof slug !== "string" || !SLUG_RE.test(slug)) throw new ValidationError("Invalid project");
    await adminDb().collection("projects").doc(slug).delete();
  });
}

// Firestore auto-generated document IDs.
const MESSAGE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

// The public site doesn't show messages: refresh only the inbox and the dashboard counts.
const MESSAGE_PATHS = ["/admin/messages", "/admin"];

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  return guard(
    async () => {
      if (typeof id !== "string" || !MESSAGE_ID_RE.test(id) || typeof read !== "boolean") {
        throw new ValidationError("Invalid message");
      }
      const ref = adminDb().collection("messages").doc(id);
      if (!(await ref.get()).exists) throw new ValidationError("Message not found");
      await ref.update({ read });
    },
    { paths: MESSAGE_PATHS },
  );
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return guard(
    async () => {
      if (typeof id !== "string" || !MESSAGE_ID_RE.test(id)) throw new ValidationError("Invalid message");
      await adminDb().collection("messages").doc(id).delete();
    },
    { paths: MESSAGE_PATHS },
  );
}
