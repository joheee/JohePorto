// Small helpers for the Reviews section. Pure, so they can be tested without a browser.

// The letters in a round avatar: the first letter of the first two words ("Jane Doe" -> "JD").
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

// Where a review link points, for its label: "https://www.linkedin.com/in/x" -> "linkedin.com". Falls back to
// "source" for anything that is not a valid URL.
export function linkHost(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "") || "source";
  } catch {
    return "source";
  }
}
