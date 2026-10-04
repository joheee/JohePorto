import type { SkillGroup } from "@/types/content";

// Skills are matched on a normalised key, so "React JS", "ReactJS" and "react.js" are one skill.
// "+" and "#" are kept so C, C++ and C# stay different. Real synonyms (Go / Golang) use aliases.
export const skillKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");

// key (name or alias) -> the skill's catalog spelling.
export function buildSkillIndex(groups: SkillGroup[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const group of groups) {
    for (const skill of group.items) {
      for (const label of [skill.name, ...skill.aliases]) {
        const key = skillKey(label);
        if (key && !index.has(key)) index.set(key, skill.name);
      }
    }
  }
  return index;
}

// Rewrites each entry to its catalog spelling and drops repeats. Names not in the catalog stay as typed.
export function canonicalizeStack(stack: string[], index: Map<string, string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of stack) {
    const canonical = index.get(skillKey(name)) ?? name;
    const key = skillKey(canonical);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(canonical);
    }
  }
  return out;
}

// One technology used somewhere, and where ("Kolosal AI", "Project: Foo").
export type SkillUsage = { name: string; where: string };

export type UnassignedSkill = { name: string; where: string[] };
export type SkillVariant = { from: string; to: string; where: string[] };

// Used in a job or project but in no group (neither as a name nor as an alias).
export function findUnassigned(usage: SkillUsage[], index: Map<string, string>): UnassignedSkill[] {
  const found = new Map<string, UnassignedSkill>();
  for (const u of usage) {
    const key = skillKey(u.name);
    if (!key || index.has(key)) continue;
    const entry = found.get(key) ?? { name: u.name, where: [] };
    if (!entry.where.includes(u.where)) entry.where.push(u.where);
    found.set(key, entry);
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Used with a spelling that differs from the catalog's ("ReactJS" where the catalog says "React JS").
export function findVariants(usage: SkillUsage[], index: Map<string, string>): SkillVariant[] {
  const found = new Map<string, SkillVariant>();
  for (const u of usage) {
    const to = index.get(skillKey(u.name));
    if (!to || to === u.name) continue;
    const id = `${u.name}\u0000${to}`;
    const entry = found.get(id) ?? { from: u.name, to, where: [] };
    if (!entry.where.includes(u.where)) entry.where.push(u.where);
    found.set(id, entry);
  }
  return [...found.values()].sort((a, b) => a.from.localeCompare(b.from));
}

// Catalog skills matching what is being typed (by name or alias), best matches first, skipping `taken`.
export function suggestSkills(groups: SkillGroup[], query: string, taken: string[], limit = 6): string[] {
  const q = skillKey(query);
  if (!q) return [];
  const takenKeys = new Set(taken.map(skillKey));
  const starts: string[] = [];
  const contains: string[] = [];
  for (const group of groups) {
    for (const skill of group.items) {
      if (takenKeys.has(skillKey(skill.name))) continue;
      const keys = [skill.name, ...skill.aliases].map(skillKey);
      if (keys.some((k) => k.startsWith(q))) starts.push(skill.name);
      else if (keys.some((k) => k.includes(q))) contains.push(skill.name);
    }
  }
  return [...starts, ...contains].slice(0, limit);
}
