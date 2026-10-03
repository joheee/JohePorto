import "server-only";
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
    return parseProfile({ ...defaultProfile, ...snap.data() });
  } catch (e) {
    console.error("getProfile failed, using defaults:", e);
    return defaultProfile;
  }
});
