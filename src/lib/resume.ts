import type { EducationItem, ExperienceItem, Profile, Project } from "@/types/content";
import { parseBlocks, sortExperienceNewestFirst } from "./format";

export type ResumeLink = { text: string; href: string };

export type ResumeEntry = {
  title: string; // role / degree / project name
  org: string; // "Company, Location" / "School, Location" ("" for projects)
  detail: string; // technologies used ("" when none)
  period: string;
  bullets: string[];
};

export type ResumeData = {
  name: string;
  contact: ResumeLink[];
  experience: ResumeEntry[];
  education: ResumeEntry[];
  projects: ResumeEntry[];
  skills: { name: string; items: string[] }[];
};

// Resume-style month abbreviations ("Jan. 2026", "Sept. 2025").
const MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
const monthYear = (month: number, year: number) => `${MONTHS[month - 1]} ${year}`;

type Dated = Pick<ExperienceItem, "current" | "startMonth" | "startYear" | "endMonth" | "endYear">;

function period(e: Dated): string {
  const start = monthYear(e.startMonth, e.startYear);
  if (e.current || e.endMonth === null || e.endYear === null) return `${start} - Present`;
  return `${start} - ${monthYear(e.endMonth, e.endYear)}`;
}

// Every non-empty line is a bullet, whether or not it starts with a bullet character.
export function toBullets(text: string): string[] {
  return parseBlocks(text).flatMap((b) => (b.type === "ul" ? b.items : [b.text]));
}

const join = (...parts: string[]) => parts.filter(Boolean).join(", ");

// "https://www.linkedin.com/in/x/?a=1" -> "linkedin.com/in/x"
export function displayUrl(href: string): string {
  try {
    const u = new URL(href);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return href;
  }
}

const isHost = (href: string, host: string) => {
  try {
    const h = new URL(href).hostname.replace(/^www\./, "");
    return h === host || h.endsWith(`.${host}`);
  } catch {
    return false;
  }
};

export function buildResume(profile: Profile, projects: Project[]): ResumeData {
  const contact: ResumeLink[] = [{ text: profile.email, href: `mailto:${profile.email}` }];
  for (const host of ["linkedin.com", "github.com"]) {
    const s = profile.socials.find((x) => isHost(x.href, host));
    if (s) contact.push({ text: displayUrl(s.href), href: s.href.replace(/^http:/, "https:") });
  }

  const education = (e: EducationItem): ResumeEntry => ({
    title: e.degree,
    org: join(e.school, e.location),
    detail: "",
    period: period(e),
    bullets: toBullets(e.summary),
  });

  return {
    name: profile.name,
    contact,
    experience: sortExperienceNewestFirst(profile.experience).map((e) => ({
      title: e.role,
      org: join(e.company, e.location),
      detail: e.stack.join(", "),
      period: period(e),
      bullets: toBullets(e.summary),
    })),
    education: sortExperienceNewestFirst(profile.education).map(education),
    // Newest first, like a resume (like the site).
    projects: [...projects]
      .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month) || a.title.localeCompare(b.title))
      .map((p) => ({
        title: p.title,
        org: "",
        detail: p.stack.join(", "),
        period: monthYear(p.month, p.year),
        bullets: toBullets(p.description || p.summary),
      })),
    skills: profile.skillGroups.map((g) => ({ name: g.name, items: g.items.map((s) => s.name) })),
  };
}

// "Johevin Blesstowi" -> "Johevin-Blesstowi-Resume.pdf"
export function resumeFilename(name: string): string {
  const base = name.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "Resume"}-Resume.pdf`;
}

