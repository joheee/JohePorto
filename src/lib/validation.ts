import type { ExperienceItem, Profile, Project, SocialLink } from "@/types/content";

export class ValidationError extends Error {}

const fail = (msg: string): never => {
  throw new ValidationError(msg);
};

function text(v: unknown, label: string, max: number, required = false): string {
  if (typeof v !== "string") return fail(`${label} must be text`);
  const s = v.trim();
  if (required && !s) fail(`${label} is required`);
  if (s.length > max) fail(`${label} is too long (max ${max} characters)`);
  return s;
}

// A single line of text: line breaks collapse into one space.
function line(v: unknown, label: string, max: number, required = false): string {
  return text(typeof v === "string" ? v.replace(/\s*[\r\n]+\s*/g, " ") : v, label, max, required);
}

function items<T>(v: unknown, label: string, max: number, map: (x: unknown) => T): T[] {
  if (!Array.isArray(v)) return fail(`${label} must be a list`);
  if (v.length > max) fail(`${label} has too many items (max ${max})`);
  return v.map(map);
}

// Non-empty trimmed strings only.
function strings(v: unknown, label: string, maxItems: number, maxLen: number): string[] {
  return items(v, label, maxItems, (x) => text(x, label, maxLen)).filter(Boolean);
}

function url(v: unknown, label: string): string {
  const s = text(v, label, 500);
  if (!s) return "";
  if (!/^https?:\/\/\S+$/i.test(s)) fail(`${label} must start with http:// or https://`);
  return s;
}

function int(v: unknown, label: string, min: number, max: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (v === undefined || v === null || v === "" || Number.isNaN(n)) return fail(`${label} is required`);
  if (!Number.isInteger(n) || n < min || n > max) return fail(`${label} is not valid`);
  return n;
}

// "" (not set yet) or an ISO date/datetime such as 2022-02-01 or 2022-02-01T10:30:00.000Z.
// Returned normalised to a full ISO datetime in UTC.
function isoDateTime(v: unknown, label: string): string {
  if (v === undefined || v === null || v === "") return "";
  const s = text(v, label, 40);
  const d = new Date(s);
  if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(s) || Number.isNaN(d.getTime())) {
    fail(`${label} must be a valid date and time`);
  }
  return d.toISOString();
}

function link(x: unknown, label: string): SocialLink {
  const o = (x ?? {}) as Record<string, unknown>;
  return { label: text(o.label, `${label} name`, 40, true), href: url(o.href, `${label} URL`) || fail(`${label} URL is required`) };
}

export function parseProfile(input: unknown): Profile {
  const o = (input ?? {}) as Record<string, unknown>;

  const email = text(o.email, "Email", 200, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Email is not valid");

  const roles = strings(o.roles, "Roles", 8, 60);
  if (roles.length === 0) fail("Add at least one role");

  return {
    name: text(o.name, "Name", 80, true),
    roles,
    pitch: text(o.pitch, "Pitch", 300),
    email,
    location: text(o.location, "Location", 100),
    status: text(o.status, "Status", 100),
    focus: text(o.focus, "Current focus", 300),
    bio: strings(o.bio, "Bio", 8, 1500),
    skills: strings(o.skills, "Skills", 40, 40),
    socials: items(o.socials, "Social links", 10, (x) => link(x, "Social link")),
    experience: items(o.experience, "Experience", 20, (x): ExperienceItem => {
      const e = (x ?? {}) as Record<string, unknown>;
      if (typeof e.current !== "boolean") fail("Experience: current must be true or false");

      const startMonth = int(e.startMonth, "Experience start month", 1, 12);
      const startYear = int(e.startYear, "Experience start year", 1950, 2100);

      // While "currently working here", there is no end date.
      let endMonth: number | null = null;
      let endYear: number | null = null;
      if (!e.current) {
        endMonth = int(e.endMonth, "Experience end month", 1, 12);
        endYear = int(e.endYear, "Experience end year", 1950, 2100);
        if (endYear * 12 + endMonth < startYear * 12 + startMonth) {
          fail("Experience end date can't be before the start date");
        }
      }

      return {
        role: line(e.role, "Experience role", 100, true),
        company: line(e.company, "Experience company", 100, true),
        summary: text(e.summary, "Experience summary", 2000),
        current: e.current as boolean,
        startMonth,
        startYear,
        endMonth,
        endYear,
        createdAt: isoDateTime(e.createdAt, "Experience created at"),
      };
    }),
  };
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseProject(input: unknown): Project {
  const o = (input ?? {}) as Record<string, unknown>;

  const slug = text(o.slug, "Slug", 60, true);
  if (!SLUG_RE.test(slug)) fail("Slug may only contain lowercase letters, numbers and hyphens");

  const order = Number(o.order);
  if (!Number.isFinite(order) || order < 0 || order > 10000) fail("Order must be a number between 0 and 10000");

  return {
    slug,
    title: text(o.title, "Title", 100, true),
    summary: text(o.summary, "Summary", 200),
    description: text(o.description, "Description", 3000),
    stack: strings(o.stack, "Stack", 20, 40),
    links: items(o.links, "Links", 10, (x) => link(x, "Project link")),
    order,
  };
}
