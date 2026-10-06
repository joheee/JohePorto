import { describe, expect, it } from "vitest";
import { parsePost, ValidationError } from "./validation";

const valid = { slug: "my-post", title: "A post", excerpt: "About it.", content: "Body", tags: ["Cloud Run", "aws"], status: "draft" };
const fails = (o: Record<string, unknown>, msg: RegExp) => expect(() => parsePost({ ...valid, ...o })).toThrow(msg);

describe("parsePost", () => {
  it("accepts a valid post and normalises the tags", () => {
    expect(parsePost({ ...valid, tags: ["Cloud Run", "aws", "AWS", " "] })).toMatchObject({ slug: "my-post", tags: ["cloud-run", "aws"], status: "draft", publishedAt: "", updatedAt: "" });
  });
  it("defaults the status to draft and refuses any other word", () => {
    expect(parsePost({ ...valid, status: undefined }).status).toBe("draft");
    expect(parsePost({ ...valid, status: "published" }).status).toBe("published");
    fails({ status: "archived" }, /draft or published/);
  });
  it("needs a slug that is a slug, and not the editor's own address", () => {
    fails({ slug: "" }, /Slug is required/);
    fails({ slug: "My Post" }, /lowercase/);
    fails({ slug: "new" }, /can't be used/);
  });
  it("needs a title, an excerpt and a text, within their limits", () => {
    fails({ title: " " }, /Title is required/);
    fails({ title: "x".repeat(121) }, /Title is too long/);
    fails({ excerpt: "" }, /Excerpt is required/);
    fails({ excerpt: "x".repeat(201) }, /Excerpt is too long/);
    fails({ content: "" }, /Content is required/);
    fails({ content: "x".repeat(60001) }, /Content is too long/);
    expect(parsePost({ ...valid, title: "One\nline" }).title).toBe("One line");
  });
  it("limits the tags to 8 of 30 characters", () => {
    fails({ tags: Array.from({ length: 9 }, (_, i) => `t${i}`) }, /too many/);
    fails({ tags: ["x".repeat(31)] }, /too long/);
  });
  it("keeps valid dates and refuses invalid ones", () => {
    expect(parsePost({ ...valid, publishedAt: "2026-09-21T08:00:00Z" }).publishedAt).toBe("2026-09-21T08:00:00.000Z");
    fails({ publishedAt: "yesterday" }, /valid date/);
  });
  it("throws a ValidationError", () => {
    expect(() => parsePost({})).toThrow(ValidationError);
  });
});
