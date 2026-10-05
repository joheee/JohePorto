import { describe, expect, it, vi } from "vitest";
import { profile, review } from "@/test/fixtures";

// settings.ts reads Firestore: only the pure helper is tested here.
vi.mock("server-only", () => ({}));
// A Firestore with no profile document: the placeholder profile is used, which is enough to see the cache entry.
vi.mock("./firebase-admin", () => ({ adminDb: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

describe("withNewFields", () => {
  it("gives a cached profile written before reviews existed an empty list", async () => {
    const { withNewFields } = await import("./settings");
    const old: Record<string, unknown> = { ...profile() };
    delete old.reviews;
    expect(withNewFields(old as never).reviews).toEqual([]);
  });

  it("leaves a profile that has reviews exactly as it is", async () => {
    const { withNewFields } = await import("./settings");
    const p = profile({ reviews: [review()] });
    expect(withNewFields(p)).toEqual(p);
  });
});

describe("the cached site data", () => {
  it("records when it was read from Firestore, and gives that time to the dashboard", async () => {
    const before = Date.now();
    const { getProfileReadAt } = await import("./settings");
    const readAt = await getProfileReadAt();
    expect(readAt).not.toBeNull();
    const t = new Date(readAt!).getTime();
    expect(t).toBeGreaterThanOrEqual(before - 1000);
    expect(t).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("still hands out the profile itself, with the newer fields filled in", async () => {
    const { getProfile } = await import("./settings");
    const p = await getProfile();
    expect(p.name).toBeTruthy();
    expect(p.reviews).toEqual([]);
  });
});
