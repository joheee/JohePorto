"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveProfile } from "@/app/admin/(protected)/actions";
import { formatPeriod } from "@/lib/format";
import type { Profile, SocialLink } from "@/types/content";
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
  current: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  createdAt: string; // not editable: carried through so existing entries keep it
};

type Form = {
  name: string;
  roles: string[];
  pitch: string;
  bio: string; // paragraphs separated by a blank line
  skills: string[];
  location: string;
  status: string;
  focus: string;
  email: string;
  socials: SocialLink[];
  experience: Row[];
};

const SECTIONS: { id: string; label: string; icon: CardIcon }[] = [
  { id: "hero", label: "Hero", icon: "hero" },
  { id: "about", label: "About", icon: "about" },
  { id: "contact", label: "Contact & links", icon: "contact" },
  { id: "experience", label: "Experience", icon: "experience" },
];

function toForm(p: Profile): Form {
  return {
    name: p.name,
    roles: p.roles,
    pitch: p.pitch,
    bio: p.bio.join("\n\n"),
    skills: p.skills,
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
      current: x.current,
      startMonth: String(x.startMonth),
      startYear: String(x.startYear),
      endMonth: x.endMonth === null ? "" : String(x.endMonth),
      endYear: x.endYear === null ? "" : String(x.endYear),
      createdAt: x.createdAt,
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
    skills: f.skills,
    location: f.location,
    status: f.status,
    focus: f.focus,
    email: f.email,
    socials: f.socials,
    experience: f.experience.map((x) => ({
      role: x.role,
      company: x.company,
      summary: x.summary,
      current: x.current,
      startMonth: x.startMonth === "" ? null : Number(x.startMonth),
      startYear: x.startYear === "" ? null : Number(x.startYear),
      endMonth: x.current || x.endMonth === "" ? null : Number(x.endMonth),
      endYear: x.current || x.endYear === "" ? null : Number(x.endYear),
      createdAt: x.createdAt,
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
const CLOSE = "M6 6l12 12M18 6L6 18";

// ---------- the form ----------

export default function SettingsForm({ initial }: { initial: Profile }) {
  const [form, setForm] = useState<Form>(() => toForm(initial));
  const [saved, setSaved] = useState<Form>(form); // last saved state: what "Discard" returns to
  const [toRemove, setToRemove] = useState<string | null>(null); // uid of the experience entry being removed
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const counter = useRef(0);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setRow = (uid: string, patch: Partial<Row>) =>
    setForm((f) => ({ ...f, experience: f.experience.map((r) => (r.uid === uid ? { ...r, ...patch } : r)) }));

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
        { uid, open: true, role: "", company: "", summary: "", current: false, startMonth: "", startYear: "", endMonth: "", endYear: "", createdAt: "" },
      ],
    }));
  }

  const removing = form.experience.find((r) => r.uid === toRemove);

  return (
    <form
      onSubmit={onSubmit}
      // A required field inside a collapsed card can't be focused by the browser: open that card.
      onInvalidCapture={(e) => {
        const uid = (e.target as HTMLElement).closest("[data-entry]")?.getAttribute("data-entry");
        if (uid) setRow(uid, { open: true });
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

        <FormCard id="about" icon="about" title="About" description="Your story, skills and what you're up to.">
          <Field label="Bio" hint="Separate paragraphs with a blank line.">
            <AutoTextarea className={inputClass} rows={6} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
          <Field label="Skills" group hint="Press Enter or comma to add.">
            <ChipsInput ariaLabel="Skills" value={form.skills} onChange={(v) => set("skills", v)} placeholder="e.g. Kubernetes" max={40} />
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
              const dated = x.startMonth !== "" && x.startYear !== "" && (x.current || (x.endMonth !== "" && x.endYear !== ""));
              const period = dated
                ? formatPeriod({
                    current: x.current,
                    startMonth: Number(x.startMonth),
                    startYear: Number(x.startYear),
                    endMonth: x.current ? null : Number(x.endMonth),
                    endYear: x.current ? null : Number(x.endYear),
                  })
                : "Dates not set";
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
        description={removing ? `${[removing.role, removing.company].filter(Boolean).join(" · ") || "This entry"} will be removed when you save.` : undefined}
        confirmLabel="Remove"
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          const uid = toRemove;
          setToRemove(null);
          if (uid) setForm((f) => ({ ...f, experience: f.experience.filter((r) => r.uid !== uid) }));
        }}
      />
    </form>
  );
}
