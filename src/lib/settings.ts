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

// The cached entry is the profile plus the moment it was read from Firestore (the dashboard shows that, next to
// its "Refresh cache" button). The key has a version: change it whenever the cached shape changes, so
// entries written by older code (which would be missing `readAt`) are never read.
const readProfile = unstable_cache(
  async () => ({ profile: await loadProfile(), readAt: new Date().toISOString() }),
  ["profile", "v2", process.env.VERCEL_GIT_COMMIT_SHA ?? "local"],
  { tags: ["site"], revalidate: 3600 },
);

// One cached read per request, shared by getProfile and getProfileReadAt.
const readCached = cache(() => readProfile());

// The cached value can be older than the code: an entry written before a field was added to the profile (the
// data cache outlives a code change in dev, and an hour-old entry can outlive a deploy's first requests) has
// no such field, and `profile.reviews.length` would take every page down. Fields that are missing get their
// default, so a new field never needs the cache to be cleared first.
export function withNewFields(cached: Profile): Profile {
  return { ...cached, reviews: cached.reviews ?? [] };
}

// A failed read is never cached (the cached function throws), it just shows the placeholder this once.
export const getProfile = cache(async (): Promise<Profile> => {
  try {
    return withNewFields((await readCached()).profile);
  } catch (e) {
    console.error("getProfile failed, using defaults:", e);
    return defaultProfile;
  }
});

// When the cached copy of the site data was read from Firestore (ISO time), or null if it could not be read.
// Right after a refresh it is "just now".
export async function getProfileReadAt(): Promise<string | null> {
  try {
    return (await readCached()).readAt;
  } catch {
    return null;
  }
}
