"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { entryLabel, withCreatedAt } from "@/lib/format";
import { buildSkillIndex, canonicalizeStack } from "@/lib/skills";
import { getProfile, loadProfile } from "@/lib/settings";
import { adminDb } from "@/lib/firebase-admin";
import type { EducationItem, ExperienceItem, ReviewItem } from "@/types/content";
import { SLUG_RE, ValidationError, assertHasLink, parsePost, parseProfile, parseProject } from "@/lib/validation";

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

// Clears the cached copy of the site data (profile and projects) and rebuilds the pages, so the next visit reads
// Firestore again. Saves in the editor already do this; this is for changes made anywhere else (the Firebase
// console, a script, local development) and for a page that looks out of date.
export async function refreshSiteCache(): Promise<ActionResult> {
  return guard(async () => {});
}

export async function saveProfile(input: unknown): Promise<ActionResult> {
  return guard(() => writeProfile(parseProfile(input)));
}

// The profile fields an editor can send on their own (see SettingsForm `cards`).
const PROFILE_FIELDS = ["name", "roles", "pitch", "bio", "location", "status", "focus", "skillGroups", "email", "socials", "experience", "education", "reviews"];

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

// Removes one experience, education or review entry. `label` must match the stored entry, so a stale page can't
// delete the wrong one after the list changed.
export async function deleteProfileItem(kind: string, index: number, label: string): Promise<ActionResult> {
  return guard(async () => {
    if ((kind !== "experience" && kind !== "education" && kind !== "review") || !Number.isInteger(index) || index < 0) throw new ValidationError("Invalid entry");
    const current = await loadProfile();
    const field = kind === "review" ? "reviews" : kind;
    const list: (ExperienceItem | EducationItem | ReviewItem)[] = current[field];
    const item = list[index];
    if (!item || entryLabel(kind, item) !== label) throw new ValidationError("This entry changed. Refresh the page and try again.");
    await writeProfile(parseProfile({ ...current, [field]: list.filter((_, i) => i !== index) }));
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

// Saves a post (the slug is the document ID). The first time it is published it gets its publish date; after that
// the date stays, even if the post goes back to draft and is published again.
export async function savePost(input: unknown, isNew: boolean): Promise<ActionResult> {
  return guard(async () => {
    const { slug, ...post } = parsePost(input);
    const ref = adminDb().collection("posts").doc(slug);
    const existing = await ref.get();
    if (isNew && existing.exists) throw new ValidationError("A post with this slug already exists");
    if (!isNew && !existing.exists) throw new ValidationError("Post not found");

    const publishedAt = existing.data()?.publishedAt ?? (post.status === "published" ? Timestamp.fromDate(new Date()) : null);
    await ref.set({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags,
      status: post.status,
      publishedAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function deletePost(slug: string): Promise<ActionResult> {
  return guard(async () => {
    if (typeof slug !== "string" || !SLUG_RE.test(slug)) throw new ValidationError("Invalid post");
    await adminDb().collection("posts").doc(slug).delete();
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
