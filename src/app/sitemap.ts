import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { getPosts } from "@/lib/posts";
import { siteUrl } from "@/lib/site";

// Re-generated at most once an hour. Lists the home page, the blog and every published post.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified = new Date();
  try {
    const updatedAt = (await adminDb().doc("settings/profile").get()).data()?.updatedAt;
    if (updatedAt?.toDate) lastModified = updatedAt.toDate();
  } catch {
    // Firestore unreachable: fall back to "now" rather than failing the build.
  }
  const posts = await getPosts();
  const entries: MetadataRoute.Sitemap = [{ url: `${siteUrl}/`, lastModified, changeFrequency: "monthly", priority: 1 }];
  if (posts.length > 0) {
    entries.push({ url: `${siteUrl}/blog`, lastModified: new Date(posts[0].updatedAt || posts[0].publishedAt), changeFrequency: "weekly", priority: 0.7 });
    for (const p of posts) entries.push({ url: `${siteUrl}/blog/${p.slug}`, lastModified: new Date(p.updatedAt || p.publishedAt), changeFrequency: "yearly", priority: 0.6 });
  }
  return entries;
}
