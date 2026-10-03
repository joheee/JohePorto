"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "@/app/admin/(protected)/actions";
import type { Profile, SocialLink } from "@/types/content";
import {
  Field,
  FormSection,
  SaveStatus,
  buttonClass,
  ghostButtonClass,
  inputClass,
} from "./fields";
import AutoTextarea from "./AutoTextarea";

// Form-side shape: selects hold strings, converted to numbers on submit.
type ExperienceRow = {
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function DateSelects({
  label,
  month,
  year,
  required,
  onMonth,
  onYear,
}: {
  label: string;
  month: string;
  year: string;
  required?: boolean;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
}) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear + 5 - 1969 }, (_, i) => thisYear + 5 - i); // newest first
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <select className={inputClass} aria-label={`${label} month`} required={required} value={month} onChange={(e) => onMonth(e.target.value)}>
          <option value="">Month</option>
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
        <select className={inputClass} aria-label={`${label} year`} required={required} value={year} onChange={(e) => onYear(e.target.value)}>
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

export default function SettingsForm({ initial }: { initial: Profile }) {
  const [name, setName] = useState(initial.name);
  const [rolesText, setRolesText] = useState(initial.roles.join("\n"));
  const [pitch, setPitch] = useState(initial.pitch);
  const [bioText, setBioText] = useState(initial.bio.join("\n\n"));
  const [skillsText, setSkillsText] = useState(initial.skills.join(", "));
  const [location, setLocation] = useState(initial.location);
  const [statusText, setStatusText] = useState(initial.status);
  const [focus, setFocus] = useState(initial.focus);
  const [email, setEmail] = useState(initial.email);
  const [cvUrl, setCvUrl] = useState(initial.cvUrl);
  const [socials, setSocials] = useState<SocialLink[]>(initial.socials);
  const [experience, setExperience] = useState<ExperienceRow[]>(
    initial.experience.map((x) => ({
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
  );

  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await saveProfile({
        name,
        roles: rolesText.split("\n"),
        pitch,
        bio: bioText.split(/\n\s*\n/),
        skills: skillsText.split(/[,\n]/),
        location,
        status: statusText,
        focus,
        email,
        cvUrl,
        socials,
        experience: experience.map((x) => ({
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
      });
      setResult(
        res.ok
          ? { ok: true, message: "Saved. The site is updating." }
          : { ok: false, message: res.error },
      );
    });
  }

  const update = <T,>(list: T[], i: number, patch: Partial<T>) =>
    list.map((x, idx) => (idx === i ? { ...x, ...patch } : x));

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <FormSection title="Hero">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Roles" hint="One per line. They rotate in the hero.">
          <AutoTextarea className={inputClass} rows={3} value={rolesText} onChange={(e) => setRolesText(e.target.value)} />
        </Field>
        <Field label="Pitch" hint="One line under your name.">
          <AutoTextarea className={inputClass} rows={2} value={pitch} onChange={(e) => setPitch(e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="About">
        <Field label="Bio" hint="Separate paragraphs with a blank line.">
          <AutoTextarea className={inputClass} rows={6} value={bioText} onChange={(e) => setBioText(e.target.value)} />
        </Field>
        <Field label="Skills" hint="Comma separated.">
          <input className={inputClass} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Status">
            <input className={inputClass} value={statusText} onChange={(e) => setStatusText(e.target.value)} />
          </Field>
        </div>
        <Field label="Currently (the “Now” tile)">
          <AutoTextarea className={inputClass} rows={2} value={focus} onChange={(e) => setFocus(e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Contact and links">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="CV link" hint="Optional. https://… or /cv.pdf. Empty hides the button.">
            <input className={inputClass} value={cvUrl} onChange={(e) => setCvUrl(e.target.value)} />
          </Field>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Social links</p>
          {socials.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <input
                className={`${inputClass} sm:w-40`}
                placeholder="Name"
                value={s.label}
                onChange={(e) => setSocials(update(socials, i, { label: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="https://…"
                value={s.href}
                onChange={(e) => setSocials(update(socials, i, { href: e.target.value }))}
              />
              <button type="button" className={ghostButtonClass} onClick={() => setSocials(socials.filter((_, idx) => idx !== i))}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className={ghostButtonClass} onClick={() => setSocials([...socials, { label: "", href: "" }])}>
            + Add link
          </button>
        </div>
      </FormSection>

      <FormSection title="Experience">
        {experience.map((x, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-background p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Role" required value={x.role} onChange={(e) => setExperience(update(experience, i, { role: e.target.value }))} />
              <input className={inputClass} placeholder="Company" required value={x.company} onChange={(e) => setExperience(update(experience, i, { company: e.target.value }))} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--accent)]"
                checked={x.current}
                onChange={(e) =>
                  setExperience(update(experience, i, e.target.checked ? { current: true, endMonth: "", endYear: "" } : { current: false }))
                }
              />
              I am currently working here
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <DateSelects
                label="Start date"
                month={x.startMonth}
                year={x.startYear}
                required
                onMonth={(v) => setExperience(update(experience, i, { startMonth: v }))}
                onYear={(v) => setExperience(update(experience, i, { startYear: v }))}
              />
              {x.current ? (
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">End date</span>
                  <p className="rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted">Present</p>
                </div>
              ) : (
                <DateSelects
                  label="End date"
                  month={x.endMonth}
                  year={x.endYear}
                  required
                  onMonth={(v) => setExperience(update(experience, i, { endMonth: v }))}
                  onYear={(v) => setExperience(update(experience, i, { endYear: v }))}
                />
              )}
            </div>
            <AutoTextarea className={inputClass} rows={2} placeholder="Summary: one point per line, start a line with • or -" value={x.summary} onChange={(e) => setExperience(update(experience, i, { summary: e.target.value }))} />
            <button type="button" className={ghostButtonClass} onClick={() => setExperience(experience.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={ghostButtonClass}
          onClick={() => setExperience([
              ...experience,
              { role: "", company: "", summary: "", current: false, startMonth: "", startYear: "", endMonth: "", endYear: "", createdAt: "" },
            ])}
        >
          + Add experience
        </button>
      </FormSection>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <SaveStatus status={result} />
      </div>
    </form>
  );
}
