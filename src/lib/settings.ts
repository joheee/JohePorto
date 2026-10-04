import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { cache } from "react";
import type { Profile } from "@/types/content";
import { defaultProfile } from "./content";
import { adminDb } from "./firebase-admin";
import { parseProfile } from "./validation";

// Reads settings/profile (Admin SDK). Falls back to the placeholder profile if the document
// doesn't exist yet or can't be read, so the site never breaks.
export const getProfile = cache(async (): Promise<Profile> => {
  try {
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
  } catch (e) {
    console.error("getProfile failed, using defaults:", e);
    return defaultProfile;
  }
});
