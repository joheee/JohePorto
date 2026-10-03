"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "@/app/admin/(protected)/actions";
import type { ExperienceItem, Profile, SocialLink } from "@/types/content";
import {
  Field,
  FormSection,
  SaveStatus,
  buttonClass,
  ghostButtonClass,
  inputClass,
} from "./fields";

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
  const [experience, setExperience] = useState<ExperienceItem[]>(initial.experience);

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
        experience,
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
          <textarea className={inputClass} rows={3} value={rolesText} onChange={(e) => setRolesText(e.target.value)} />
        </Field>
        <Field label="Pitch" hint="One line under your name.">
          <textarea className={inputClass} rows={2} value={pitch} onChange={(e) => setPitch(e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="About">
        <Field label="Bio" hint="Separate paragraphs with a blank line.">
          <textarea className={inputClass} rows={6} value={bioText} onChange={(e) => setBioText(e.target.value)} />
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
          <textarea className={inputClass} rows={2} value={focus} onChange={(e) => setFocus(e.target.value)} />
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
            <div className="grid gap-2 sm:grid-cols-3">
              <input className={inputClass} placeholder="Role" value={x.role} onChange={(e) => setExperience(update(experience, i, { role: e.target.value }))} />
              <input className={inputClass} placeholder="Company" value={x.company} onChange={(e) => setExperience(update(experience, i, { company: e.target.value }))} />
              <input className={inputClass} placeholder="Period, e.g. 2024 – Present" value={x.period} onChange={(e) => setExperience(update(experience, i, { period: e.target.value }))} />
            </div>
            <textarea className={inputClass} rows={2} placeholder="Summary" value={x.summary} onChange={(e) => setExperience(update(experience, i, { summary: e.target.value }))} />
            <button type="button" className={ghostButtonClass} onClick={() => setExperience(experience.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={ghostButtonClass}
          onClick={() => setExperience([...experience, { role: "", company: "", period: "", summary: "" }])}
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
