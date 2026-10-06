// The navbar as a shell prompt that follows you down the page: johevin-blesstowi@portfolio:~/experience.
// The brand is user@host (see BrandLink), the path after it is the section in view (see NavPath). Pure, so it can be
// tested without a browser.

// The "user" of the prompt, from your whole name: lower case, spaces turned into hyphens
// ("Johevin Blesstowi" -> "johevin-blesstowi"). A blank name falls back to "visitor".
export function shellUser(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-") || "visitor";
}

// The top of the page is the home directory; every other section is a folder in it.
export function sectionPath(section: string | null): string {
  return section && section !== "hero" ? `~/${section}` : "~";
}

// Inside the admin the path is the page you are on (~/admin, ~/admin/messages). /admin/site follows its
// sections like the home page instead, and the login page keeps the public look, so both return null here.
export function adminPath(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/admin/site" || clean === "/admin/login") return null;
  return clean === "/admin" || clean.startsWith("/admin/") ? `~${clean}` : null;
}

export const PROMPT_HOST = "portfolio";

// The blog pages continue the prompt too: :~/blog, and :~/blog/<slug> inside a post.
export function blogPath(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, "");
  return clean === "/blog" || clean.startsWith("/blog/") ? `~${clean}` : null;
}
