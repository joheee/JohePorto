import type { EducationItem, ExperienceItem, Post, Profile, Project, ReviewItem, SkillGroup, SocialLink } from "@/types/content";
import { skillKey } from "./skills";

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

// Start/end month and year shared by experience and education. No end date while `current`.
function period(e: Record<string, unknown>, label: string) {
  if (typeof e.current !== "boolean") fail(`${label}: current must be true or false`);

  const startMonth = int(e.startMonth, `${label} start month`, 1, 12);
  const startYear = int(e.startYear, `${label} start year`, 1950, 2100);

  let endMonth: number | null = null;
  let endYear: number | null = null;
  if (!e.current) {
    endMonth = int(e.endMonth, `${label} end month`, 1, 12);
    endYear = int(e.endYear, `${label} end year`, 1950, 2100);
    if (endYear * 12 + endMonth < startYear * 12 + startMonth) {
      fail(`${label} end date can't be before the start date`);
    }
  }
  return { current: e.current as boolean, startMonth, startYear, endMonth, endYear };
}

function legacySkills(v: unknown): string[] {
  const seen = new Set<string>();
  return strings(v ?? [], "Skills", 40, 40).filter((s) => !seen.has(skillKey(s)) && !!seen.add(skillKey(s)));
}

// A skill is a name, or { name, aliases }. Aliases that normalise to the skill's own name are dropped,
// and no spelling may belong to two skills, so every name maps to exactly one catalog entry.
function skillGroups(v: unknown): SkillGroup[] {
  const owners = new Map<string, string>(); // key -> the skill that owns it
  const groups = items(v, "Skill groups", 12, (x): SkillGroup => {
    const g = (x ?? {}) as Record<string, unknown>;
    return {
      name: line(g.name, "Skill group name", 40, true),
      items: items(g.items ?? [], "Skills", 40, (y) => {
        const o = typeof y === "string" ? { name: y, aliases: [] } : ((y ?? {}) as Record<string, unknown>);
        const name = line(o.name, "Skill name", 40, true);
        const own = new Set([skillKey(name)]);
        const aliases = strings(o.aliases ?? [], "Skill aliases", 8, 40).filter((a) => {
          const k = skillKey(a);
          if (!k || own.has(k)) return false;
          own.add(k);
          return true;
        });
        for (const k of own) {
          const owner = owners.get(k);
          if (owner !== undefined) fail(owner === name ? `"${name}" is listed twice` : `"${name}" overlaps with "${owner}": each skill can only be listed once`);
          owners.set(k, name);
        }
        return { name, aliases };
      }),
    };
  });
  return groups.filter((g) => g.items.length > 0);
}

export function parseProfile(input: unknown): Profile {
  const o = (input ?? {}) as Record<string, unknown>;

  const email = text(o.email, "Email", 200, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Email is not valid");

  const roles = strings(o.roles, "Roles", 8, 60);
  if (roles.length === 0) fail("Add at least one role");

  // Profiles saved before skill groups existed only have a flat `skills` list: it becomes one group.
  const groups = skillGroups(o.skillGroups !== undefined ? o.skillGroups : [{ name: "Skills", items: legacySkills(o.skills) }]);

  return {
    name: text(o.name, "Name", 80, true),
    roles,
    pitch: text(o.pitch, "Pitch", 300),
    email,
    location: text(o.location, "Location", 100),
    status: text(o.status, "Status", 100),
    focus: text(o.focus, "Current focus", 300),
    bio: strings(o.bio, "Bio", 8, 1500),
    skillGroups: groups,
    skills: groups.flatMap((g) => g.items.map((s) => s.name)),
    socials: items(o.socials, "Social links", 10, (x) => link(x, "Social link")),
    experience: items(o.experience, "Experience", 20, (x): ExperienceItem => {
      const e = (x ?? {}) as Record<string, unknown>;
      return {
        role: line(e.role, "Experience role", 100, true),
        company: line(e.company, "Experience company", 100, true),
        summary: text(e.summary, "Experience summary", 2000),
        // Entries saved before this field existed have none.
        location: line(e.location ?? "", "Experience location", 100),
        stack: strings(e.stack ?? [], "Experience tech stack", 20, 40),
        ...period(e, "Experience"),
        createdAt: isoDateTime(e.createdAt, "Experience created at"),
      };
    }),
    // Profiles saved before education existed have no `education` field.
    education: items(o.education ?? [], "Education", 10, (x): EducationItem => {
      const e = (x ?? {}) as Record<string, unknown>;
      return {
        school: line(e.school, "Education school", 100, true),
        degree: line(e.degree, "Education degree", 100, true),
        location: line(e.location ?? "", "Education location", 100),
        summary: text(e.summary ?? "", "Education details", 1000),
        ...period(e, "Education"),
      };
    }),
    // Profiles saved before reviews existed have no `reviews` field.
    reviews: items(o.reviews ?? [], "Reviews", 12, (x): ReviewItem => {
      const r = (x ?? {}) as Record<string, unknown>;
      return {
        name: line(r.name, "Reviewer name", 80, true),
        role: line(r.role ?? "", "Reviewer role", 100),
        text: text(r.text, "Review", 1500, true),
        link: url(r.link ?? "", "Review link"),
      };
    }),
  };
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseProject(input: unknown): Project {
  const o = (input ?? {}) as Record<string, unknown>;

  const slug = text(o.slug, "Slug", 60, true);
  if (!SLUG_RE.test(slug)) fail("Slug may only contain lowercase letters, numbers and hyphens");

  const month = int(o.month, "Project month", 1, 12);
  const year = int(o.year, "Project year", 1950, 2100);

  return {
    slug,
    title: text(o.title, "Title", 100, true),
    summary: text(o.summary, "Summary", 200),
    description: text(o.description, "Description", 3000),
    stack: strings(o.stack, "Stack", 20, 40),
    links: items(o.links, "Links", 10, (x) => link(x, "Project link")),
    month,
    year,
  };
}

// Every project needs at least one link. Checked when saving only, so older projects without a
// link still load (and can be edited) instead of disappearing.
export function assertHasLink(project: Project): void {
  if (project.links.length === 0) fail("Add at least one link");
}

// "new" is the address of the editor's new-post page, so it can never be a post.
const RESERVED_POST_SLUGS = ["new"];

// Tags are lower case, with spaces turned into hyphens ("Cloud Run" -> "cloud-run"), without duplicates.
function tags(v: unknown): string[] {
  const seen = new Set<string>();
  return strings(v ?? [], "Tags", 8, 30)
    .map((t) => t.toLowerCase().replace(/\s+/g, "-"))
    .filter((t) => !seen.has(t) && !!seen.add(t));
}

// The editable fields of a post. Its dates are not sent by the editor: the server sets them (see savePost),
// so the two date fields come back empty here.
export function parsePost(input: unknown): Post {
  const o = (input ?? {}) as Record<string, unknown>;

  const slug = text(o.slug, "Slug", 60, true);
  if (!SLUG_RE.test(slug)) fail("Slug may only contain lowercase letters, numbers and hyphens");
  if (RESERVED_POST_SLUGS.includes(slug)) fail(`"${slug}" can't be used as a slug`);

  const status = o.status ?? "draft";
  if (status !== "draft" && status !== "published") fail("Status must be draft or published");

  return {
    slug,
    title: line(o.title, "Title", 120, true),
    excerpt: line(o.excerpt, "Excerpt", 200, true),
    content: text(o.content, "Content", 60000, true),
    tags: tags(o.tags),
    status: status as Post["status"],
    publishedAt: isoDateTime(o.publishedAt, "Published at"),
    updatedAt: isoDateTime(o.updatedAt, "Updated at"),
  };
}
