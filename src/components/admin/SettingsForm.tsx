"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveProfile } from "@/app/admin/(protected)/actions";
import { formatPeriod } from "@/lib/format";
import { buildSkillIndex, findUnassigned, findVariants, skillKey, suggestSkills, type SkillUsage } from "@/lib/skills";
import type { Profile, Skill, SocialLink } from "@/types/content";
import AutoTextarea from "@/components/AutoTextarea";
import ChipsInput from "./ChipsInput";
import ConfirmDialog from "./ConfirmDialog";
import DateSelects from "./DateSelects";
import { Field, SaveStatus, buttonClass, ghostButtonClass, inputClass } from "./fields";
import FormCard, { SectionIcon, type CardIcon } from "./FormCard";

// ---------- form-side shapes (selects hold strings; converted to numbers on save) ----------

type Row = {
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

type EduRow = {
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

type Group = { uid: string; name: string; items: Skill[] };

type Form = {
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
};

const SECTIONS: { id: string; label: string; icon: CardIcon }[] = [
  { id: "hero", label: "Hero", icon: "hero" },
  { id: "about", label: "About", icon: "about" },
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "contact", label: "Contact & links", icon: "contact" },
  { id: "experience", label: "Experience", icon: "experience" },
  { id: "education", label: "Education", icon: "education" },
];

// Month/year pieces shared by experience and education rows.
type RowDates = { current: boolean; startMonth: string; startYear: string; endMonth: string; endYear: string };

const datesPayload = (x: RowDates) => ({
  current: x.current,
  startMonth: x.startMonth === "" ? null : Number(x.startMonth),
  startYear: x.startYear === "" ? null : Number(x.startYear),
  endMonth: x.current || x.endMonth === "" ? null : Number(x.endMonth),
  endYear: x.current || x.endYear === "" ? null : Number(x.endYear),
});

const periodLabel = (x: RowDates) =>
  x.startMonth !== "" && x.startYear !== "" && (x.current || (x.endMonth !== "" && x.endYear !== ""))
    ? formatPeriod({
        current: x.current,
        startMonth: Number(x.startMonth),
        startYear: Number(x.startYear),
        endMonth: x.current ? null : Number(x.endMonth),
        endYear: x.current ? null : Number(x.endYear),
      })
    : "Dates not set";

function toForm(p: Profile): Form {
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
function toPayload(f: Form) {
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
  };
}

// Role and company are single-line values that wrap instead of scrolling sideways. They use an
// auto-height textarea, so Enter must not add a line break and pasted line breaks become spaces.
const flatten = (v: string) => v.replace(/\s*[\r\n]+\s*/g, " ");
const oneLine = {
  rows: 1,
  maxLength: 100,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  },
};

const update = <T,>(list: T[], i: number, patch: Partial<T>) =>
  list.map((x, idx) => (idx === i ? { ...x, ...patch } : x));

// ---------- small pieces ----------

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const PLUS = "M12 5v14M5 12h14";
const TRASH = "M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v6M14 11v6";
const CHEVRON = "m6 9 6 6 6-6";
const CHEVRON_UP = "m18 15-6-6-6 6";
const CLOSE = "M6 6l12 12M18 6L6 18";

// ---------- the form ----------

export default function SettingsForm({ initial, projectStacks }: { initial: Profile; projectStacks: SkillUsage[] }) {
  const [form, setForm] = useState<Form>(() => toForm(initial));
  const [saved, setSaved] = useState<Form>(form); // last saved state: what "Discard" returns to
  const [toRemove, setToRemove] = useState<string | null>(null); // uid of the experience or education entry being removed
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const counter = useRef(0);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setRow = (uid: string, patch: Partial<Row>) =>
    setForm((f) => ({ ...f, experience: f.experience.map((r) => (r.uid === uid ? { ...r, ...patch } : r)) }));
  const setGroup = (uid: string, patch: Partial<Group>) =>
    setForm((f) => ({ ...f, skillGroups: f.skillGroups.map((g) => (g.uid === uid ? { ...g, ...patch } : g)) }));
  // The chips hold names only: keep the aliases of names that stay, give new names none.
  const setGroupNames = (g: Group, names: string[]) =>
    setGroup(g.uid, { items: names.map((n) => g.items.find((s) => s.name.toLowerCase() === n.toLowerCase()) ?? { name: n, aliases: [] }) });
  const addToGroup = (uid: string, ...names: string[]) =>
    setForm((f) => ({ ...f, skillGroups: f.skillGroups.map((g) => (g.uid === uid ? { ...g, items: [...g.items, ...names.map((name) => ({ name, aliases: [] }))] } : g)) }));
  // Moves a group one place. The order here is the order on the site and on the resume.
  const [moved, setMoved] = useState(""); // spoken to screen readers
  function moveGroup(uid: string, by: -1 | 1) {
    const from = form.skillGroups.findIndex((g) => g.uid === uid);
    const to = from + by;
    if (from < 0 || to < 0 || to >= form.skillGroups.length) return;
    const next = [...form.skillGroups];
    [next[from], next[to]] = [next[to], next[from]];
    set("skillGroups", next);
    setMoved(`${next[to].name || "Group"} moved to position ${to + 1} of ${next.length}`);
    // The button may now be disabled (first/last place): keep focus on one that still works.
    requestAnimationFrame(() => {
      const pick = (dir: string) => document.querySelector<HTMLButtonElement>(`[data-move="${uid}:${dir}"]:not(:disabled)`);
      (pick(by === 1 ? "down" : "up") ?? pick(by === 1 ? "up" : "down"))?.focus();
    });
  }
  const setEdu = (uid: string, patch: Partial<EduRow>) =>
    setForm((f) => ({ ...f, education: f.education.map((r) => (r.uid === uid ? { ...r, ...patch } : r)) }));

  // Everything used in a job (as edited right now) or a project, checked against the skill groups.
  const skillIndex = useMemo(() => buildSkillIndex(form.skillGroups), [form.skillGroups]);
  const usage = useMemo<SkillUsage[]>(
    () => [...form.experience.flatMap((x) => x.stack.map((name) => ({ name, where: x.company || "A job" }))), ...projectStacks],
    [form.experience, projectStacks],
  );
  const unassigned = useMemo(() => findUnassigned(usage, skillIndex), [usage, skillIndex]);
  const variants = useMemo(() => findVariants(usage, skillIndex), [usage, skillIndex]);

  const dirty = JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(saved));

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const snapshot = form;
    startTransition(async () => {
      const res = await saveProfile(toPayload(snapshot));
      if (res.ok) setSaved(snapshot);
      setResult(res.ok ? { ok: true, message: "Saved. The site is updating." } : { ok: false, message: res.error });
    });
  }

  function addEntry() {
    const uid = `n${++counter.current}`;
    setForm((f) => ({
      ...f,
      experience: [
        ...f.experience,
        { uid, open: true, role: "", company: "", summary: "", location: "", stack: [], current: false, startMonth: "", startYear: "", endMonth: "", endYear: "", createdAt: "" },
      ],
    }));
  }

  function addEducation() {
    const uid = `n${++counter.current}`;
    setForm((f) => ({
      ...f,
      education: [...f.education, { uid, open: true, school: "", degree: "", location: "", summary: "", current: false, startMonth: "", startYear: "", endMonth: "", endYear: "" }],
    }));
  }

  const removing = form.experience.find((r) => r.uid === toRemove);
  const removingEdu = form.education.find((r) => r.uid === toRemove);

  return (
    <form
      onSubmit={onSubmit}
      // A required field inside a collapsed card can't be focused by the browser: open that card.
      onInvalidCapture={(e) => {
        const uid = (e.target as HTMLElement).closest("[data-entry]")?.getAttribute("data-entry");
        if (uid) {
          setRow(uid, { open: true });
          setEdu(uid, { open: true });
        }
      }}
      className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10"
    >
      {/* Section navigation (desktop) */}
      <nav aria-label="Sections" className="hidden lg:block">
        <ul className="sticky top-8 space-y-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
              >
                <SectionIcon name={s.icon} className="h-4 w-4" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">
        <FormCard id="hero" icon="hero" title="Hero" description="The first thing visitors see.">
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Your name" />
          </Field>
          <Field label="Roles" group hint="Press Enter or comma to add. They rotate under your name.">
            <ChipsInput ariaLabel="Roles" value={form.roles} onChange={(v) => set("roles", v)} placeholder="e.g. DevOps Engineer" max={8} />
          </Field>
          <Field label="Pitch" counter={{ value: form.pitch.length, max: 300 }} hint="One or two lines under your name. Shorter reads better.">
            <AutoTextarea className={inputClass} rows={2} value={form.pitch} onChange={(e) => set("pitch", e.target.value)} />
          </Field>
        </FormCard>

        <FormCard id="about" icon="about" title="About" description="Your story and what you're up to.">
          <Field label="Bio" hint="Separate paragraphs with a blank line.">
            <AutoTextarea className={inputClass} rows={6} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Location">
              <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" />
            </Field>
            <Field label="Status">
              <input className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)} placeholder="e.g. Open to new opportunities" />
            </Field>
          </div>
          <Field label="Now" counter={{ value: form.focus.length, max: 300 }} hint="What you're currently working on or learning.">
            <AutoTextarea className={inputClass} rows={2} value={form.focus} onChange={(e) => set("focus", e.target.value)} />
          </Field>
        </FormCard>

        <FormCard id="skills" icon="skills" title="Skills" description="Grouped like on your resume, in the order shown here. Jobs and projects pick from these, so spellings stay consistent.">
          {form.skillGroups.length === 0 && <p className="text-sm text-muted">No groups yet. Add one, for example &quot;DevOps Tools&quot;.</p>}

          <div className="space-y-3">
            <p role="status" className="sr-only">
              {moved}
            </p>
            {form.skillGroups.map((g, i) => (
              <div key={g.uid} className="space-y-3 rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 gap-1">
                    {([-1, 1] as const).map((by) => {
                      const disabled = by === -1 ? i === 0 : i === form.skillGroups.length - 1;
                      return (
                        <button
                          key={by}
                          type="button"
                          data-move={`${g.uid}:${by === -1 ? "up" : "down"}`}
                          aria-label={`Move ${g.name || `group ${i + 1}`} ${by === -1 ? "up" : "down"}`}
                          disabled={disabled}
                          onClick={() => moveGroup(g.uid, by)}
                          className="flex h-10 w-9 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
                        >
                          <Icon d={by === -1 ? CHEVRON_UP : CHEVRON} />
                        </button>
                      );
                    })}
                  </div>
                  <input
                    className={inputClass}
                    aria-label={`Group ${i + 1} name`}
                    placeholder="Group name, e.g. DevOps Tools"
                    maxLength={40}
                    value={g.name}
                    onChange={(e) => setGroup(g.uid, { name: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={`Remove group ${g.name || i + 1}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
                    onClick={() => set("skillGroups", form.skillGroups.filter((x) => x.uid !== g.uid))}
                  >
                    <Icon d={CLOSE} />
                  </button>
                </div>
                <ChipsInput
                  ariaLabel={`${g.name || "Group"} skills`}
                  value={g.items.map((s) => s.name)}
                  onChange={(names) => setGroupNames(g, names)}
                  placeholder="e.g. Kubernetes"
                  max={40}
                />
                {g.items.length > 0 && (
                  <details className="text-sm">
                    <summary className="w-fit cursor-pointer text-muted transition-colors hover:text-foreground">
                      Other spellings{g.items.some((s) => s.aliases.length > 0) && ` (${g.items.reduce((n, s) => n + s.aliases.length, 0)})`}
                    </summary>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Only for real synonyms, like Go and Golang. Spellings such as React JS and ReactJS already match each other.
                    </p>
                    <div className="mt-3 space-y-3">
                      {g.items.map((s) => (
                        <div key={s.name} className="grid items-start gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
                          <span className="pt-2.5">{s.name}</span>
                          <ChipsInput
                            ariaLabel={`${s.name} other spellings`}
                            value={s.aliases}
                            onChange={(aliases) => setGroup(g.uid, { items: g.items.map((x) => (x.name === s.name ? { ...x, aliases } : x)) })}
                            placeholder="e.g. Golang"
                            max={8}
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
            <button type="button" className={ghostButtonClass} onClick={() => set("skillGroups", [...form.skillGroups, { uid: `n${++counter.current}`, name: "", items: [] }])}>
              <Icon d={PLUS} /> Add group
            </button>
          </div>

          <div aria-live="polite" className="space-y-4 rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-medium">Used in jobs and projects</p>
            {unassigned.length === 0 && variants.length === 0 && (
              <p className="text-sm text-muted">Everything you use in your jobs and projects is in a group.</p>
            )}

            {unassigned.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted">Not in a group yet. Add them so they can appear on your resume.</p>
                  {unassigned.length > 1 && form.skillGroups.length > 0 && (
                    <select
                      aria-label={`Add all ${unassigned.length} to a group`}
                      value=""
                      onChange={(e) => e.target.value && addToGroup(e.target.value, ...unassigned.map((u) => u.name))}
                      className={`${inputClass} sm:w-48`}
                    >
                      <option value="">Add all {unassigned.length} to…</option>
                      {form.skillGroups.map((g, i) => (
                        <option key={g.uid} value={g.uid}>
                          {g.name || `Group ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <ul className="space-y-2">
                  {unassigned.map((u) => (
                    <li key={u.name} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">{u.name}</span>
                        <span className="ml-2 text-xs text-muted">{u.where.join(", ")}</span>
                      </span>
                      <select
                        aria-label={`Add ${u.name} to a group`}
                        disabled={form.skillGroups.length === 0}
                        value=""
                        onChange={(e) => e.target.value && addToGroup(e.target.value, u.name)}
                        className={`${inputClass} sm:w-48`}
                      >
                        <option value="">{form.skillGroups.length === 0 ? "Add a group first" : "Add to group…"}</option>
                        {form.skillGroups.map((g, i) => (
                          <option key={g.uid} value={g.uid}>
                            {g.name || `Group ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs leading-5 text-muted">Spelled differently from your groups. Saving rewrites them in your jobs and projects.</p>
                <ul className="space-y-1.5 text-sm">
                  {variants.map((v) => (
                    <li key={`${v.from}>${v.to}`}>
                      <span className="font-mono text-xs text-muted line-through">{v.from}</span> <span aria-label="becomes">→</span>{" "}
                      <span className="font-medium">{v.to}</span>
                      <span className="ml-2 text-xs text-muted">{v.where.join(", ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </FormCard>

        <FormCard id="contact" icon="contact" title="Contact & links" description="How people reach you.">
          <Field label="Email">
            <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="you@example.com" />
          </Field>

          <div className="space-y-3">
            <p className="text-sm font-medium">Social links</p>
            {form.socials.map((s, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className={`${inputClass} sm:w-40 sm:shrink-0`}
                  aria-label="Link name"
                  placeholder="Name"
                  value={s.label}
                  onChange={(e) => set("socials", update(form.socials, i, { label: e.target.value }))}
                />
                <input
                  className={inputClass}
                  aria-label="Link URL"
                  placeholder="https://…"
                  value={s.href}
                  onChange={(e) => set("socials", update(form.socials, i, { href: e.target.value }))}
                />
                <button
                  type="button"
                  aria-label="Remove link"
                  className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-border text-muted transition-colors hover:border-red-500/50 hover:text-red-500 sm:self-auto"
                  onClick={() => set("socials", form.socials.filter((_, idx) => idx !== i))}
                >
                  <Icon d={CLOSE} />
                </button>
              </div>
            ))}
            <button type="button" className={ghostButtonClass} onClick={() => set("socials", [...form.socials, { label: "", href: "" }])}>
              <Icon d={PLUS} /> Add link
            </button>
          </div>
        </FormCard>

        <FormCard id="experience" icon="experience" title="Experience" description="Shown on the site newest first, whatever the order here.">
          {form.experience.length === 0 && <p className="text-sm text-muted">No entries yet.</p>}

          <ul className="space-y-3">
            {form.experience.map((x, i) => {
              const period = periodLabel(x);
              return (
                <li key={x.uid} data-entry={x.uid} className="rounded-xl border border-border bg-background">
                  <div className="flex items-center gap-2 p-2 pr-3">
                    <button
                      type="button"
                      aria-expanded={x.open}
                      aria-controls={`entry-${x.uid}`}
                      onClick={() => setRow(x.uid, { open: !x.open })}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-card"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs text-accent">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {x.role || x.company ? [x.role, x.company].filter(Boolean).join(" · ") : "New entry"}
                        </span>
                        <span className="block truncate font-mono text-xs text-muted">{period}</span>
                      </span>
                      {x.current && (
                        <span className="hidden shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-500 sm:inline">Current</span>
                      )}
                      <Icon d={CHEVRON} className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${x.open ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove entry ${i + 1}`}
                      onClick={() => setToRemove(x.uid)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Icon d={TRASH} />
                    </button>
                  </div>

                  {/* Smooth expand/collapse: animates the row height between 0fr and 1fr. */}
                  <div id={`entry-${x.uid}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${x.open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div inert={!x.open} className="space-y-4 border-t border-border p-4 sm:p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Role">
                            <AutoTextarea {...oneLine} className={inputClass} required placeholder="e.g. DevOps Engineer" value={x.role} onChange={(e) => setRow(x.uid, { role: flatten(e.target.value) })} />
                          </Field>
                          <Field label="Company">
                            <AutoTextarea {...oneLine} className={inputClass} required placeholder="e.g. Acme Inc." value={x.company} onChange={(e) => setRow(x.uid, { company: flatten(e.target.value) })} />
                          </Field>
                        </div>

                        <Field label="Location" hint="Shown next to the company, e.g. Remote or East Jakarta. Optional.">
                          <AutoTextarea {...oneLine} className={inputClass} placeholder="e.g. Remote" value={x.location} onChange={(e) => setRow(x.uid, { location: flatten(e.target.value) })} />
                        </Field>

                        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-card">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--accent)]"
                            checked={x.current}
                            onChange={(e) => setRow(x.uid, e.target.checked ? { current: true, endMonth: "", endYear: "" } : { current: false })}
                          />
                          I am currently working here
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <DateSelects label="Start date" month={x.startMonth} year={x.startYear} onMonth={(v) => setRow(x.uid, { startMonth: v })} onYear={(v) => setRow(x.uid, { startYear: v })} />
                          {x.current ? (
                            <div className="space-y-1.5">
                              <p className="mb-1.5 text-sm font-medium">End date</p>
                              <p className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted">Present</p>
                            </div>
                          ) : (
                            <DateSelects label="End date" month={x.endMonth} year={x.endYear} onMonth={(v) => setRow(x.uid, { endMonth: v })} onYear={(v) => setRow(x.uid, { endYear: v })} />
                          )}
                        </div>

                        <Field label="Tech stack" group hint="Shown as chips under the entry. Press Enter or comma to add.">
                          <ChipsInput
                            ariaLabel="Tech stack"
                            value={x.stack}
                            onChange={(v) => setRow(x.uid, { stack: v })}
                            placeholder="e.g. Terraform"
                            max={20}
                            suggest={(q, taken) => suggestSkills(form.skillGroups, q, taken)}
                            resolve={(n) => skillIndex.get(skillKey(n)) ?? n}
                          />
                        </Field>

                        <Field label="Summary" hint="One point per line. Start a line with • or - to make it a bullet.">
                          <AutoTextarea className={inputClass} rows={3} value={x.summary} onChange={(e) => setRow(x.uid, { summary: e.target.value })} />
                        </Field>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={addEntry}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Icon d={PLUS} /> Add experience
          </button>
        </FormCard>

        <FormCard id="education" icon="education" title="Education" description="Shown under Experience, newest first, whatever the order here.">
          {form.education.length === 0 && <p className="text-sm text-muted">No entries yet.</p>}

          <ul className="space-y-3">
            {form.education.map((x, i) => (
              <li key={x.uid} data-entry={x.uid} className="rounded-xl border border-border bg-background">
                <div className="flex items-center gap-2 p-2 pr-3">
                  <button
                    type="button"
                    aria-expanded={x.open}
                    aria-controls={`entry-${x.uid}`}
                    onClick={() => setEdu(x.uid, { open: !x.open })}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-card"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs text-accent">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {x.school || x.degree ? [x.degree, x.school].filter(Boolean).join(" · ") : "New entry"}
                      </span>
                      <span className="block truncate font-mono text-xs text-muted">{periodLabel(x)}</span>
                    </span>
                    {x.current && (
                      <span className="hidden shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-500 sm:inline">Current</span>
                    )}
                    <Icon d={CHEVRON} className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${x.open ? "rotate-180" : ""}`} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove education ${i + 1}`}
                    onClick={() => setToRemove(x.uid)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Icon d={TRASH} />
                  </button>
                </div>

                <div id={`entry-${x.uid}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${x.open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div inert={!x.open} className="space-y-4 border-t border-border p-4 sm:p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="School">
                          <AutoTextarea {...oneLine} className={inputClass} required placeholder="e.g. BINUS University" value={x.school} onChange={(e) => setEdu(x.uid, { school: flatten(e.target.value) })} />
                        </Field>
                        <Field label="Degree">
                          <AutoTextarea {...oneLine} className={inputClass} required placeholder="e.g. Bachelor of Computer Engineering" value={x.degree} onChange={(e) => setEdu(x.uid, { degree: flatten(e.target.value) })} />
                        </Field>
                      </div>
                      <Field label="Location">
                        <AutoTextarea {...oneLine} className={inputClass} placeholder="e.g. West Jakarta, Jakarta" value={x.location} onChange={(e) => setEdu(x.uid, { location: flatten(e.target.value) })} />
                      </Field>

                      <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-card">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--accent)]"
                          checked={x.current}
                          onChange={(e) => setEdu(x.uid, e.target.checked ? { current: true, endMonth: "", endYear: "" } : { current: false })}
                        />
                        I am currently studying here
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <DateSelects label="Start date" month={x.startMonth} year={x.startYear} onMonth={(v) => setEdu(x.uid, { startMonth: v })} onYear={(v) => setEdu(x.uid, { startYear: v })} />
                        {x.current ? (
                          <div className="space-y-1.5">
                            <p className="mb-1.5 text-sm font-medium">End date</p>
                            <p className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted">Present</p>
                          </div>
                        ) : (
                          <DateSelects label="End date" month={x.endMonth} year={x.endYear} onMonth={(v) => setEdu(x.uid, { endMonth: v })} onYear={(v) => setEdu(x.uid, { endYear: v })} />
                        )}
                      </div>

                      <Field label="Details" hint="One point per line. Start a line with • or - to make it a bullet, e.g. GPA: 3.72 or your final project.">
                        <AutoTextarea className={inputClass} rows={3} value={x.summary} onChange={(e) => setEdu(x.uid, { summary: e.target.value })} />
                      </Field>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={addEducation}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Icon d={PLUS} /> Add education
          </button>
        </FormCard>

        {/* Floating save bar */}
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/90 px-5 py-3 shadow-lg shadow-black/10 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-muted">
              <span aria-hidden className={`h-2 w-2 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className="sr-only sm:not-sr-only">{dirty ? "Unsaved changes" : "All changes saved"}</span>
            </span>
            <SaveStatus status={result} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!dirty || pending}
              className={ghostButtonClass}
              onClick={() => {
                setForm(saved);
                setResult(null);
              }}
            >
              Discard
            </button>
            <button type="submit" disabled={pending} className={buttonClass}>
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={toRemove !== null}
        title="Remove this entry?"
        description={
          removing
            ? `${[removing.role, removing.company].filter(Boolean).join(" · ") || "This entry"} will be removed when you save.`
            : removingEdu
              ? `${[removingEdu.degree, removingEdu.school].filter(Boolean).join(" · ") || "This entry"} will be removed when you save.`
              : undefined
        }
        confirmLabel="Remove"
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          const uid = toRemove;
          setToRemove(null);
          if (uid) setForm((f) => ({ ...f, experience: f.experience.filter((r) => r.uid !== uid), education: f.education.filter((r) => r.uid !== uid) }));
        }}
      />
    </form>
  );
}
