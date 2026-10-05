// How the numbers are written on the Analytics page. Pure.
import type { SectionId } from "./model";

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Top of the page",
  about: "About",
  projects: "Projects",
  experience: "Experience",
  reviews: "Reviews",
  contact: "Contact",
};

export const percent = (share: number): string => {
  const p = share * 100;
  return p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`;
};

export const number = (n: number): string => n.toLocaleString("en-US");

// "id" -> "Indonesia" (an unknown country is "xx").
export function countryName(code: string): string {
  if (code === "xx" || !/^[a-z]{2}$/i.test(code)) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

const NAMES: Record<string, string> = { direct: "Direct or unknown", other: "Other", phone: "Phone", tablet: "Tablet", desktop: "Desktop", chrome: "Chrome", safari: "Safari", firefox: "Firefox", edge: "Edge", opera: "Opera", samsung: "Samsung Internet", dark: "Dark theme", light: "Light theme", xx: "Unknown" };
export const labelFor = (key: string): string => NAMES[key] ?? key;

// "Mar 3" for a day key.
export function shortDay(key: string): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// +18% / -4% / a dash when there is nothing to compare with.
export const changeText = (change: number | null): string => (change === null ? "–" : change > 0 ? `+${change}%` : change < 0 ? `${change}%` : "0%");
