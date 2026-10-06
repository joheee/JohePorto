import { beforeEach, describe, expect, it, vi } from "vitest";

// savePost and deletePost with a fake Firestore: what gets written, when the publish date is set, what is invalidated.
const set = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const del = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const existing = vi.hoisted(() => ({ value: undefined as undefined | Record<string, unknown> }));
const updateTag = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const getAdmin = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ updateTag, revalidatePath }));
vi.mock("@/lib/auth", () => ({ getAdmin }));
vi.mock("@/lib/settings", () => ({ loadProfile: vi.fn(), getProfile: vi.fn() }));
vi.mock("@/lib/firebase-admin", () => ({
  adminDb: () => ({
    collection: () => ({ doc: () => ({ get: async () => ({ exists: existing.value !== undefined, data: () => existing.value }), set, delete: del }) }),
  }),
}));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TIME" },
  Timestamp: { fromDate: (d: Date) => ({ date: d }) },
}));

import { deletePost, savePost } from "./actions";

const input = { slug: "my-post", title: "My post", excerpt: "About it.", content: "Body text", tags: ["Terraform"], status: "published" };
const written = () => set.mock.calls.at(-1)![0] as Record<string, unknown>;

beforeEach(() => {
  set.mockClear();
  del.mockClear();
  updateTag.mockClear();
  revalidatePath.mockClear();
  existing.value = undefined;
  getAdmin.mockResolvedValue({ uid: "owner" });
});

describe("savePost", () => {
  it("creates a post, sets the publish date on the first publish, and clears the cache", async () => {
    expect(await savePost(input, true)).toEqual({ ok: true });
    expect(written()).toMatchObject({ title: "My post", excerpt: "About it.", content: "Body text", tags: ["terraform"], status: "published", updatedAt: "SERVER_TIME" });
    expect(written().publishedAt).toEqual({ date: expect.any(Date) });
    expect(written()).not.toHaveProperty("slug"); // the slug is the document ID
    expect(updateTag).toHaveBeenCalledWith("site");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("keeps a draft without a publish date", async () => {
    await savePost({ ...input, status: "draft" }, true);
    expect(written()).toMatchObject({ status: "draft", publishedAt: null });
  });

  it("keeps the original publish date when an edit is saved, even after going back to draft", async () => {
    const date = { date: new Date("2026-09-21") };
    existing.value = { publishedAt: date };
    await savePost({ ...input, status: "draft" }, false);
    expect(written().publishedAt).toBe(date);
    await savePost(input, false);
    expect(written().publishedAt).toBe(date);
  });

  it("gives a draft that is published later its date then", async () => {
    existing.value = { publishedAt: null, status: "draft" };
    await savePost(input, false);
    expect(written().publishedAt).toEqual({ date: expect.any(Date) });
  });

  it("refuses a new post whose slug exists, and an edit of a post that does not", async () => {
    existing.value = { title: "x" };
    expect(await savePost(input, true)).toEqual({ ok: false, error: expect.stringMatching(/already exists/) });
    existing.value = undefined;
    expect(await savePost(input, false)).toEqual({ ok: false, error: expect.stringMatching(/not found/i) });
    expect(set).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("refuses invalid input and a signed-out caller, writing nothing", async () => {
    expect(await savePost({ ...input, title: "" }, true)).toEqual({ ok: false, error: expect.stringMatching(/Title is required/) });
    expect(await savePost({ ...input, slug: "new" }, true)).toEqual({ ok: false, error: expect.stringMatching(/can't be used/) });
    getAdmin.mockResolvedValue(null);
    expect(await savePost(input, true)).toEqual({ ok: false, error: expect.stringMatching(/not authorized/i) });
    expect(set).not.toHaveBeenCalled();
  });
});

describe("deletePost", () => {
  it("deletes by slug and clears the cache", async () => {
    expect(await deletePost("my-post")).toEqual({ ok: true });
    expect(del).toHaveBeenCalledTimes(1);
    expect(updateTag).toHaveBeenCalledWith("site");
  });

  it("refuses a bad slug and a signed-out caller", async () => {
    expect((await deletePost("../settings")).ok).toBe(false);
    expect((await deletePost("")).ok).toBe(false);
    getAdmin.mockResolvedValue(null);
    expect((await deletePost("my-post")).ok).toBe(false);
    expect(del).not.toHaveBeenCalled();
  });
});
