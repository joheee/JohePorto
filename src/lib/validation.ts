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

function items<T>(v: unknown, label: string, max: number, map: (x: unknown) => T): T[] {
  if (!Array.isArray(v)) return fail(`${label} must be a list`);
  if (v.length > max) fail(`${label} has too many items (max ${max})`);
  return v.map(map);
}

// Non-empty trimmed strings only.
function strings(v: unknown, label: string, maxItems: number, maxLen: number): string[] {
  return items(v, label, maxItems, (x) => text(x, label, maxLen)).filter(Boolean);
}

function url(v: unknown, label: string, allowRelative = false): string {
  const s = text(v, label, 500);
  if (!s) return "";
  const ok = /^https?:\/\/\S+$/i.test(s) || (allowRelative && /^\/(?!\/)\S*$/.test(s));
  if (!ok) fail(`${label} must start with http:// or https://${allowRelative ? " (or /)" : ""}`);
  return s;
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
    cvUrl: url(o.cvUrl, "CV link", true),
    location: text(o.location, "Location", 100),
    status: text(o.status, "Status", 100),
    focus: text(o.focus, "Current focus", 300),
    bio: strings(o.bio, "Bio", 8, 1500),
    skills: strings(o.skills, "Skills", 40, 40),
    socials: items(o.socials, "Social links", 10, (x) => link(x, "Social link")),
    experience: items(o.experience, "Experience", 20, (x): ExperienceItem => {
      const e = (x ?? {}) as Record<string, unknown>;
      return {
        role: text(e.role, "Experience role", 100, true),
        company: text(e.company, "Experience company", 100, true),
        period: text(e.period, "Experience period", 60),
        summary: text(e.summary, "Experience summary", 600),
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
