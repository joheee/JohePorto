import { describe, expect, it } from "vitest";
import { postSummary } from "@/test/fixtures";
import { filterPosts, formatPostDate, isoDay, readingMinutes, shortHash, sortPostsNewestFirst, tagCounts } from "./blog";

describe("readingMinutes", () => {
  it("is at least one minute, and rounds up at 200 words a minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("word ".repeat(200))).toBe(1);
    expect(readingMinutes("word ".repeat(201))).toBe(2);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
  });
});

describe("shortHash", () => {
  it("is 7 hex characters, stable, and different for different slugs", () => {
    expect(shortHash("a-post")).toMatch(/^[0-9a-f]{7}$/);
    expect(shortHash("a-post")).toBe(shortHash("a-post"));
    expect(shortHash("a-post")).not.toBe(shortHash("another-post"));
  });
});

describe("dates", () => {
  it("formats an ISO date in UTC, or nothing", () => {
    expect(formatPostDate("2026-10-06T23:30:00.000Z")).toBe("Oct 6, 2026");
    expect(formatPostDate("")).toBe("");
    expect(formatPostDate("nonsense")).toBe("");
  });
  it("gives the day for a <time> tag", () => {
    expect(isoDay("2026-10-06T23:30:00.000Z")).toBe("2026-10-06");
    expect(isoDay("")).toBe("");
  });
});

describe("filterPosts and tagCounts", () => {
  const posts = [
    postSummary({ slug: "a", title: "Terraform base", excerpt: "Modules for AWS", tags: ["terraform", "aws"] }),
    postSummary({ slug: "b", title: "Backups", excerpt: "pgBackRest in practice", tags: ["postgres"] }),
    postSummary({ slug: "c", title: "Kubernetes upgrades", excerpt: "Rolling nodes", tags: ["aws", "kubernetes"] }),
  ];
  it("matches the title, excerpt and tags in any case", () => {
    expect(filterPosts(posts, "TERRAFORM", null).map((p) => p.slug)).toEqual(["a"]);
    expect(filterPosts(posts, "pgbackrest", null).map((p) => p.slug)).toEqual(["b"]);
    expect(filterPosts(posts, "kubernetes", null).map((p) => p.slug)).toEqual(["c"]);
    expect(filterPosts(posts, "  ", null)).toHaveLength(3);
  });
  it("filters by one tag, and combines it with the search", () => {
    expect(filterPosts(posts, "", "aws").map((p) => p.slug)).toEqual(["a", "c"]);
    expect(filterPosts(posts, "nodes", "aws").map((p) => p.slug)).toEqual(["c"]);
    expect(filterPosts(posts, "backups", "aws")).toEqual([]);
  });
  it("counts tags, most used first and then alphabetical", () => {
    expect(tagCounts(posts)).toEqual([
      { tag: "aws", count: 2 },
      { tag: "kubernetes", count: 1 },
      { tag: "postgres", count: 1 },
      { tag: "terraform", count: 1 },
    ]);
  });
});

describe("sortPostsNewestFirst", () => {
  it("puts the newest first and breaks ties by title", () => {
    const list = [
      { title: "B", publishedAt: "2026-05-01T00:00:00.000Z" },
      { title: "A", publishedAt: "2026-05-01T00:00:00.000Z" },
      { title: "New", publishedAt: "2026-09-01T00:00:00.000Z" },
    ];
    expect(sortPostsNewestFirst(list).map((p) => p.title)).toEqual(["New", "A", "B"]);
  });
});
