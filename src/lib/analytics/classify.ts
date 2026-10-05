// Which countable action a click on a link is, or null. Pure, so it is tested without a browser.
const SOCIAL: Record<string, string> = { "github.com": "social.github", "linkedin.com": "social.linkedin", "upwork.com": "social.upwork" };

export function classifyLink(opts: { href: string; ownHost: string; projectSlug?: string | null; inReviews?: boolean }): string | null {
  let url: URL;
  try {
    url = new URL(opts.href, `https://${opts.ownHost}`);
  } catch {
    return null;
  }
  const host = url.host.toLowerCase().replace(/^www\./, "");
  const own = opts.ownHost.toLowerCase().replace(/^www\./, "");

  if (host === own) return url.pathname === "/resume.pdf" ? "resume" : null; // other links inside the site are not events
  if (opts.inReviews) return null; // "view on linkedin.com" under a review is not a click on your profile
  if (opts.projectSlug) return `project.${opts.projectSlug}`;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return SOCIAL[host] ?? "social.other";
}
