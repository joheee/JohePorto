import { cleanToken } from "./parse";

// A link to the site that says where the click came from (utm tags), so the Analytics page can tell which of
// your profile links brings visitors. The tags are cleaned the same way the server cleans them.
export type LinkTags = { source: string; medium?: string; campaign?: string };

export function buildTrackedLink(base: string, tags: LinkTags): string {
  let url: URL;
  try {
    url = new URL("/", base);
  } catch {
    return base;
  }
  const source = cleanToken(tags.source);
  const medium = cleanToken(tags.medium);
  const campaign = cleanToken(tags.campaign);
  if (source) url.searchParams.set("utm_source", source);
  if (source && medium) url.searchParams.set("utm_medium", medium);
  if (source && campaign) url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

// Starting points for the places you are likely to put the link.
export const LINK_PRESETS: { label: string; source: string; medium: string }[] = [
  { label: "LinkedIn", source: "linkedin", medium: "social" },
  { label: "Upwork", source: "upwork", medium: "social" },
  { label: "GitHub", source: "github", medium: "social" },
  { label: "Email signature", source: "email", medium: "email" },
  { label: "CV or PDF", source: "cv", medium: "document" },
];
