"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { entryLabel, withCreatedAt } from "@/lib/format";
import { buildSkillIndex, canonicalizeStack } from "@/lib/skills";
import { getProfile, loadProfile } from "@/lib/settings";
import { adminDb } from "@/lib/firebase-admin";
import type { EducationItem, ExperienceItem } from "@/types/content";
import { SLUG_RE, ValidationError, assertHasLink, parseProfile, parseProject } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Server Actions are reachable by direct POST, so every one re-checks the owner itself.
async function guard(fn: () => Promise<void>, { paths }: { paths?: string[] } = {}): Promise<ActionResult> {
  if (!(await getAdmin())) return { ok: false, error: "Not authorized. Please sign in again." };
  try {
    await fn();
    // Default: rebuild the whole site (public pages, name/metadata in the layout, admin lists).
    // `paths`: refresh only those pages. Either way the page you're on updates in the same response.
    if (paths) paths.forEach((p) => revalidatePath(p));
    else {
      updateTag("site"); // the cached profile/projects reads (lib/settings.ts, lib/projects.ts)
      revalidatePath("/", "layout");
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.message };
    console.error("admin action failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveProfile(input: unknown): Promise<ActionResult> {
  return guard(() => writeProfile(parseProfile(input)));
}

// The profile fields an editor can send on their own (see SettingsForm `cards`).
const PROFILE_FIELDS = ["name", "roles", "pitch", "bio", "location", "status", "focus", "skillGroups", "email", "socials", "experience", "education"];

// Saves some sections only: the fields sent replace the stored ones, everything else is kept as it is now.
// The merged profile goes through the same validation and stack rewrite as a full save.
export async function saveProfileSection(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const o = (input ?? {}) as Record<string, unknown>;
    const patch = Object.fromEntries(PROFILE_FIELDS.filter((k) => k in o).map((k) => [k, o[k]]));
    if (Object.keys(patch).length === 0) throw new ValidationError("Nothing to save");
    await writeProfile(parseProfile({ ...(await loadProfile()), ...patch }));
  });
}

// Removes one experience or education entry. `label` must match the stored entry, so a stale page can't
// delete the wrong one after the list changed.
export async function deleteProfileItem(kind: string, index: number, label: string): Promise<ActionResult> {
  return guard(async () => {
    if ((kind !== "experience" && kind !== "education") || !Number.isInteger(index) || index < 0) throw new ValidationError("Invalid entry");
    const current = await loadProfile();
    const list: (ExperienceItem | EducationItem)[] = current[kind];
    const item = list[index];
    if (!item || entryLabel(kind, item) !== label) throw new ValidationError("This entry changed. Refresh the page and try again.");
    await writeProfile(parseProfile({ ...current, [kind]: list.filter((_, i) => i !== index) }));
  });
}

async function writeProfile(parsed: ReturnType<typeof parseProfile>) {
  // Rewrite every technology to its spelling in the skill groups (ReactJS -> React JS, Golang -> Go).
  const index = buildSkillIndex(parsed.skillGroups);
  const profile = { ...parsed, experience: parsed.experience.map((e) => ({ ...e, stack: canonicalizeStack(e.stack, index) })) };
  const db = adminDb();

  // Same for the projects. updatedAt is left alone: older projects borrow it as their date.
  const projects = await db.collection("projects").get();
  const batch = db.batch();
  for (const doc of projects.docs) {
    const stack: unknown = doc.data().stack;
    if (!Array.isArray(stack)) continue;
    const fixed = canonicalizeStack(stack.filter((s): s is string => typeof s === "string"), index);
    if (JSON.stringify(fixed) !== JSON.stringify(stack)) batch.update(doc.ref, { stack: fixed });
  }

  await db
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
  await batch.commit();
}

export async function saveProject(input: unknown, isNew: boolean): Promise<ActionResult> {
  return guard(async () => {
    const parsed = parseProject(input);
    const project = { ...parsed, stack: canonicalizeStack(parsed.stack, buildSkillIndex((await getProfile()).skillGroups)) };
    assertHasLink(project);
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
