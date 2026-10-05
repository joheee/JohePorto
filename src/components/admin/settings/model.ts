import type { KeyboardEvent } from "react";
import { formatPeriod } from "@/lib/format";
import type { Profile, Skill, SocialLink } from "@/types/content";

// ---------- form-side shapes (selects hold strings; converted to numbers on save) ----------

export type Row = {
  uid: string; // client-only: stable key, never saved
  open: boolean; // client-only: card expanded
  role: string;
  company: string;
  summary: string;
  location: string;
  stack: string[];
  current: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  createdAt: string; // not editable: carried through so existing entries keep it
};

export type EduRow = {
  uid: string;
  open: boolean;
  school: string;
  degree: string;
  location: string;
  summary: string;
  current: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
};

export type ReviewRow = {
  uid: string;
  open: boolean;
  name: string;
  role: string;
  text: string;
  link: string;
};

export type Group = { uid: string; name: string; items: Skill[] };

export type Form = {
  name: string;
  roles: string[];
  pitch: string;
  bio: string; // paragraphs separated by a blank line
  skillGroups: Group[];
  location: string;
  status: string;
  focus: string;
  email: string;
  socials: SocialLink[];
  experience: Row[];
  education: EduRow[];
  reviews: ReviewRow[];
};

// The cards of this form. A scoped form (`cards`) shows only some of them and saves only their fields.
export type CardId = "hero" | "about" | "skills" | "contact" | "experience" | "education" | "reviews";

export const CARD_FIELDS: Record<CardId, string[]> = {
  hero: ["name", "roles", "pitch"],
  about: ["bio", "location", "status", "focus"],
  skills: ["skillGroups"],
  contact: ["email", "socials"],
  experience: ["experience"],
  education: ["education"],
  reviews: ["reviews"],
};

export type Setter = <K extends keyof Form>(key: K, value: Form[K]) => void;
export type CardProps = { form: Form; set: Setter };

// Month/year pieces shared by experience and education rows.
export type RowDates = { current: boolean; startMonth: string; startYear: string; endMonth: string; endYear: string };

export const datesPayload = (x: RowDates) => ({
  current: x.current,
  startMonth: x.startMonth === "" ? null : Number(x.startMonth),
  startYear: x.startYear === "" ? null : Number(x.startYear),
  endMonth: x.current || x.endMonth === "" ? null : Number(x.endMonth),
  endYear: x.current || x.endYear === "" ? null : Number(x.endYear),
});

export const periodLabel = (x: RowDates) =>
  x.startMonth !== "" && x.startYear !== "" && (x.current || (x.endMonth !== "" && x.endYear !== ""))
    ? formatPeriod({
        current: x.current,
        startMonth: Number(x.startMonth),
        startYear: Number(x.startYear),
        endMonth: x.current ? null : Number(x.endMonth),
        endYear: x.current ? null : Number(x.endYear),
      })
    : "Dates not set";

export function toForm(p: Profile): Form {
  return {
    name: p.name,
    roles: p.roles,
    pitch: p.pitch,
    bio: p.bio.join("\n\n"),
    skillGroups: p.skillGroups.map((g, i) => ({ uid: `g${i}`, name: g.name, items: g.items })),
    location: p.location,
    status: p.status,
    focus: p.focus,
    email: p.email,
    socials: p.socials,
    experience: p.experience.map((x, i) => ({
      uid: `e${i}`,
      open: false,
      role: x.role,
      company: x.company,
      summary: x.summary,
      location: x.location,
      stack: x.stack,
      current: x.current,
      startMonth: String(x.startMonth),
      startYear: String(x.startYear),
      endMonth: x.endMonth === null ? "" : String(x.endMonth),
      endYear: x.endYear === null ? "" : String(x.endYear),
      createdAt: x.createdAt,
    })),
    reviews: p.reviews.map((x, i) => ({ uid: `r${i}`, open: false, name: x.name, role: x.role, text: x.text, link: x.link })),
    education: p.education.map((x, i) => ({
      uid: `d${i}`,
      open: false,
      school: x.school,
      degree: x.degree,
      location: x.location,
      summary: x.summary,
      current: x.current,
      startMonth: String(x.startMonth),
      startYear: String(x.startYear),
      endMonth: x.endMonth === null ? "" : String(x.endMonth),
      endYear: x.endYear === null ? "" : String(x.endYear),
    })),
  };
}

// What the server action receives. Also used to detect unsaved changes.
export function toPayload(f: Form) {
  return {
    name: f.name,
    roles: f.roles,
    pitch: f.pitch,
    bio: f.bio.split(/\n\s*\n/),
    skillGroups: f.skillGroups.map((g) => ({ name: g.name, items: g.items })),
    location: f.location,
    status: f.status,
    focus: f.focus,
    email: f.email,
    socials: f.socials,
    experience: f.experience.map((x) => ({
      role: x.role,
      company: x.company,
      summary: x.summary,
      location: x.location,
      stack: x.stack,
      ...datesPayload(x),
      createdAt: x.createdAt,
    })),
    education: f.education.map((x) => ({
      school: x.school,
      degree: x.degree,
      location: x.location,
      summary: x.summary,
      ...datesPayload(x),
    })),
    reviews: f.reviews.map((x) => ({ name: x.name, role: x.role, text: x.text, link: x.link })),
  };
}

// The payload of the whole form, or only of the cards a scoped form shows.
export function scopedPayload(f: Form, cards?: CardId[]): Record<string, unknown> {
  const all: Record<string, unknown> = toPayload(f);
  if (!cards) return all;
  const keep = new Set(cards.flatMap((c) => CARD_FIELDS[c]));
  return Object.fromEntries(Object.entries(all).filter(([k]) => keep.has(k)));
}

// Role and company are single-line values that wrap instead of scrolling sideways. They use an
// auto-height textarea, so Enter must not add a line break and pasted line breaks become spaces.
export const flatten = (v: string) => v.replace(/\s*[\r\n]+\s*/g, " ");
export const oneLine = {
  rows: 1,
  maxLength: 100,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  },
};

export const update = <T,>(list: T[], i: number, patch: Partial<T>) =>
  list.map((x, idx) => (idx === i ? { ...x, ...patch } : x));


// A client-only key for a new row or group (never saved). Module-wide, so keys never repeat.
let uidCounter = 0;
export const newUid = () => `n${++uidCounter}`;

export const blankRow = (): Row => ({ uid: newUid(), open: true, role: "", company: "", summary: "", location: "", stack: [], current: false, startMonth: "", startYear: "", endMonth: "", endYear: "", createdAt: "" });
export const blankEduRow = (): EduRow => ({ uid: newUid(), open: true, school: "", degree: "", location: "", summary: "", current: false, startMonth: "", startYear: "", endMonth: "", endYear: "" });
export const blankReviewRow = (): ReviewRow => ({ uid: newUid(), open: true, name: "", role: "", text: "", link: "" });
