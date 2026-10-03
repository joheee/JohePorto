// The public address of the site, used for canonical links, the sitemap and social previews.
// Set NEXT_PUBLIC_SITE_URL when you get a custom domain. On Vercel it otherwise falls back to the
// production domain Vercel exposes, and locally to http://localhost:3000.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();
