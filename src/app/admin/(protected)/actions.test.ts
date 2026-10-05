import { beforeEach, describe, expect, it, vi } from "vitest";
import { job, profile, review, school } from "@/test/fixtures";

// The server actions with a fake Firestore: what gets written, and what is invalidated.
const set = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const updateTag = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const loadProfile = vi.hoisted(() => vi.fn());
const getAdmin = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ updateTag, revalidatePath }));
vi.mock("@/lib/auth", () => ({ getAdmin }));
vi.mock("@/lib/settings", () => ({ loadProfile, getProfile: loadProfile }));
vi.mock("@/lib/firebase-admin", () => ({
  adminDb: () => ({
    doc: () => ({ set }),
    collection: () => ({ get: async () => ({ docs: [] }), doc: () => ({ get: async () => ({ exists: true }), set, delete: vi.fn() }) }),
    batch: () => ({ update: vi.fn(), commit: async () => undefined }),
  }),
}));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TIME" },
  Timestamp: { fromDate: (d: Date) => ({ date: d }) },
}));

import { deleteProfileItem, refreshSiteCache, saveProfileSection } from "./actions";

const reviews = () => [review({ name: "Jane Doe", role: "CTO at Acme" }), review({ name: "John Roe", role: "Client" })];
const written = () => set.mock.calls.at(-1)![0] as Record<string, unknown>;

beforeEach(() => {
  set.mockClear();
  updateTag.mockClear();
  revalidatePath.mockClear();
  getAdmin.mockResolvedValue({ uid: "owner", email: "o@x.com" });
  loadProfile.mockResolvedValue(profile({ reviews: reviews(), experience: [job()], education: [school()] }));
});

describe("deleteProfileItem", () => {
  it("removes the review, saves the rest, and clears the cache so the page updates", async () => {
    const res = await deleteProfileItem("review", 0, "Jane Doe|CTO at Acme");
    expect(res).toEqual({ ok: true });
    expect((written().reviews as { name: string }[]).map((r) => r.name)).toEqual(["John Roe"]);
    expect(updateTag).toHaveBeenCalledWith("site");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("keeps everything else in the profile", async () => {
    await deleteProfileItem("review", 1, "John Roe|Client");
    const saved = written();
    expect((saved.reviews as unknown[]).length).toBe(1);
    expect((saved.experience as unknown[]).length).toBe(1);
    expect((saved.education as unknown[]).length).toBe(1);
    expect(saved.name).toBe("Jo Doe");
  });

  it("removes the last review, leaving an empty list (not the old one)", async () => {
    loadProfile.mockResolvedValue(profile({ reviews: [review({ name: "Jane Doe", role: "CTO at Acme" })] }));
    await deleteProfileItem("review", 0, "Jane Doe|CTO at Acme");
    expect(written().reviews).toEqual([]);
  });

  it("refuses when the entry at that place is a different one (a stale page)", async () => {
    const res = await deleteProfileItem("review", 0, "John Roe|Client");
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/entry changed/i) });
    expect(set).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("refuses an unknown kind, a bad index, and a signed-out caller", async () => {
    expect((await deleteProfileItem("project", 0, "x")).ok).toBe(false);
    expect((await deleteProfileItem("review", -1, "x")).ok).toBe(false);
    expect((await deleteProfileItem("review", 5, "x")).ok).toBe(false);
    getAdmin.mockResolvedValue(null);
    expect(await deleteProfileItem("review", 0, "Jane Doe|CTO at Acme")).toEqual({ ok: false, error: expect.stringMatching(/not authorized/i) });
    expect(set).not.toHaveBeenCalled();
  });

  it("still deletes jobs and education entries", async () => {
    await deleteProfileItem("experience", 0, "DevOps Engineer|Acme");
    expect(written().experience).toEqual([]);
    await deleteProfileItem("education", 0, "BSc Computer Science|BINUS");
    expect(written().education).toEqual([]);
  });
});

describe("saveProfileSection with reviews", () => {
  it("replaces the reviews and keeps the other sections", async () => {
    const res = await saveProfileSection({ reviews: [{ name: "Ada", role: "", text: "Great.", link: "" }] });
    expect(res).toEqual({ ok: true });
    expect(written().reviews).toEqual([{ name: "Ada", role: "", text: "Great.", link: "" }]);
    expect((written().experience as unknown[]).length).toBe(1);
  });

  it("rejects an invalid review and writes nothing", async () => {
    const res = await saveProfileSection({ reviews: [{ name: "", role: "", text: "x", link: "" }] });
    expect(res.ok).toBe(false);
    expect(set).not.toHaveBeenCalled();
  });
});

describe("refreshSiteCache", () => {
  it("clears the cached site data and rebuilds the pages, without writing anything", async () => {
    expect(await refreshSiteCache()).toEqual({ ok: true });
    expect(updateTag).toHaveBeenCalledWith("site");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(set).not.toHaveBeenCalled();
  });

  it("does nothing for a caller who is not the signed-in owner", async () => {
    getAdmin.mockResolvedValue(null);
    expect(await refreshSiteCache()).toEqual({ ok: false, error: expect.stringMatching(/not authorized/i) });
    expect(updateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
