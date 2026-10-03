import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Crawlers may read the public site; the admin area and API are off limits.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
