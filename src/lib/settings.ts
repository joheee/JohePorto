import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Profile } from "@/types/content";
import { defaultProfile } from "./content";
import { adminDb } from "./firebase-admin";
import { parseProfile } from "./validation";

// Reads settings/profile (Admin SDK). Falls back to the placeholder profile if the document
// doesn't exist yet or can't be read, so the site never breaks.
// Pages render per request now (CSP nonce), so the Firestore read is cached across requests. Saves clear
// it (updateTag("site") in the actions); the hourly refresh and the deploy id in the key cover changes made
// from local dev, which cannot reach the production cache.
// The uncached read. Also used by the admin actions that change one section: they must merge into the
// document as it is now, not into a cached copy.
export async function loadProfile(): Promise<Profile> {
  const snap = await adminDb().doc("settings/profile").get();
  if (!snap.exists) return defaultProfile;
  const data = snap.data()!;
  // Firestore Timestamps can't cross into client components: hand them over as ISO strings.
  const experience = Array.isArray(data.experience)
    ? data.experience.map((e: Record<string, unknown>) => ({
        ...e,
        createdAt: e.createdAt instanceof Timestamp ? e.createdAt.toDate().toISOString() : e.createdAt,
      }))
    : data.experience;
  // A profile saved before skill groups existed must turn its own flat `skills` into a group,
  // not pick up the placeholder groups.
  const skillGroups = data.skillGroups ?? (data.skills ? undefined : defaultProfile.skillGroups);
  return parseProfile({ ...defaultProfile, ...data, skillGroups, experience });
}

const readProfile = unstable_cache(
  loadProfile,
  ["profile", process.env.VERCEL_GIT_COMMIT_SHA ?? "local"],
  { tags: ["site"], revalidate: 3600 },
);

// A failed read is never cached (the cached function throws), it just shows the placeholder this once.
export const getProfile = cache(async (): Promise<Profile> => {
  try {
    return await readProfile();
  } catch (e) {
    console.error("getProfile failed, using defaults:", e);
    return defaultProfile;
  }
});
