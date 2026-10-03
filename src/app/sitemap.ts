import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { siteUrl } from "@/lib/site";

// Re-generated at most once an hour. Add /blog and each post here when the blog exists.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified = new Date();
  try {
    const updatedAt = (await adminDb().doc("settings/profile").get()).data()?.updatedAt;
    if (updatedAt?.toDate) lastModified = updatedAt.toDate();
  } catch {
    // Firestore unreachable: fall back to "now" rather than failing the build.
  }
  return [{ url: `${siteUrl}/`, lastModified, changeFrequency: "monthly", priority: 1 }];
}
