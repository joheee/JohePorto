import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Post, PostSummary } from "@/types/content";
import { readingMinutes, sortPostsNewestFirst } from "./blog";
import { adminDb } from "./firebase-admin";
import { parsePost } from "./validation";

// Blog posts, from `posts/{slug}` (Admin SDK). The public site reads only published ones.
// Like the profile and the projects, the public reads are cached across requests (tag `site`, cleared by
// updateTag("site") when a post is saved or deleted, and hourly otherwise). Two sizes of read, because the
// data cache refuses entries over 2 MB: the list holds no post bodies, and each post body is cached on its own.

const iso = (v: unknown): string => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate(): Date }).toDate().toISOString() : "");

// A stored document as a Post, or null when it isn't a valid one (the id is not a slug, a field is missing).
function toPost(id: string, data: FirebaseFirestore.DocumentData): Post | null {
  try {
    return parsePost({ ...data, slug: id, publishedAt: iso(data.publishedAt), updatedAt: iso(data.updatedAt) });
  } catch (e) {
    console.warn(`Skipping invalid post "${id}": ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

export function summarize({ content, ...post }: Post): PostSummary {
  return { ...post, readingMinutes: readingMinutes(content) };
}

async function readPublishedList(): Promise<PostSummary[]> {
  const snap = await adminDb().collection("posts").where("status", "==", "published").get();
  const posts = snap.docs.map((d) => toPost(d.id, d.data())).filter((p): p is Post => p !== null && p.publishedAt !== "");
  return sortPostsNewestFirst(posts.map(summarize));
}

const cachedList = unstable_cache(readPublishedList, ["posts", "v2", process.env.VERCEL_GIT_COMMIT_SHA ?? "local"], { tags: ["site"], revalidate: 3600 });

// Published posts, newest first, without their text. A failed read shows no posts rather than breaking the page.
export const getPosts = cache(async (): Promise<PostSummary[]> => {
  try {
    return await cachedList();
  } catch (e) {
    console.error("getPosts failed:", e);
    return [];
  }
});

async function readPost(slug: string): Promise<Post | null> {
  const snap = await adminDb().collection("posts").doc(slug).get();
  if (!snap.exists) return null;
  const post = toPost(snap.id, snap.data()!);
  return post && post.status === "published" && post.publishedAt ? post : null;
}

const cachedPost = unstable_cache(readPost, ["post", "v1", process.env.VERCEL_GIT_COMMIT_SHA ?? "local"], { tags: ["site"], revalidate: 3600 });

// One published post with its text, or null. Drafts are never returned here.
export const getPost = cache(async (slug: string): Promise<Post | null> => {
  try {
    return await cachedPost(slug); // the slug is part of the cache key
  } catch (e) {
    console.error("getPost failed:", e);
    return null;
  }
});

// Admin only (never cached): every post with its text, drafts included. Newest first by publish date; a draft
// has none yet, so it goes by its last save (a draft you are working on is at the top).
export async function getAllPosts(): Promise<Post[]> {
  const snap = await adminDb().collection("posts").get();
  const posts = snap.docs.map((d) => toPost(d.id, d.data())).filter((p): p is Post => p !== null);
  return posts.sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt));
}
