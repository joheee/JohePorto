"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { SLUG_RE, ValidationError, parseProfile, parseProject } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Server Actions are reachable by direct POST, so every one re-checks the owner itself.
async function guard(fn: () => Promise<void>): Promise<ActionResult> {
  if (!(await getAdmin())) return { ok: false, error: "Not authorized. Please sign in again." };
  try {
    await fn();
    // Rebuild the public pages (and the layout: name, metadata) with the new data.
    revalidatePath("/", "layout");
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
      .set({ ...profile, updatedAt: FieldValue.serverTimestamp() });
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
