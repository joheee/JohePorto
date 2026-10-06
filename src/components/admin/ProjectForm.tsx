"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { saveProject } from "@/app/admin/(protected)/actions";
import AutoTextarea from "@/components/AutoTextarea";
import { buildSkillIndex, skillKey, suggestSkills } from "@/lib/skills";
import type { Project, SkillGroup, SocialLink } from "@/types/content";
import ChipsInput from "./ChipsInput";
import DateSelects from "./DateSelects";
import { Field, ghostButtonClass, inputClass } from "@/components/ui/fields";
import FormCard from "./FormCard";
import SaveBar from "./SaveBar";
import { useEditForm } from "./useEditForm";
import Icon from "@/components/ui/Icons";

type Form = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  stack: string[];
  month: string; // "" until chosen
  year: string;
  links: SocialLink[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const blankLink: SocialLink = { label: "", href: "" };
const empty: Form = { title: "", slug: "", summary: "", description: "", stack: [], month: "", year: "", links: [blankLink] };

const toForm = (p: Project): Form => ({
  title: p.title,
  slug: p.slug,
  summary: p.summary,
  description: p.description,
  stack: p.stack,
  month: String(p.month),
  year: String(p.year),
  links: p.links.length > 0 ? p.links : [blankLink], // a project needs at least one link
});

// What the server action receives. Also used to detect unsaved changes.
const toPayload = (f: Form) => ({
  title: f.title,
  slug: f.slug,
  summary: f.summary,
  description: f.description,
  stack: f.stack,
  links: f.links,
  month: f.month === "" ? null : Number(f.month),
  year: f.year === "" ? null : Number(f.year),
});

export default function ProjectForm({
  initial,
  skillGroups,
  onSaved,
  onCancel,
  onDirtyChange,
}: {
  initial?: Project;
  skillGroups: SkillGroup[];
  onSaved?: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isNew = !initial;
  const [slugTouched, setSlugTouched] = useState(false);

  const { form, setForm, set, dirty, pending, result, submit, discard } = useEditForm<Form>({
    initial: () => (initial ? toForm(initial) : empty),
    changes: toPayload,
    save: (f) => saveProject(toPayload(f), isNew),
    onSaved: () => {
      onSaved?.();
      router.refresh();
    },
    onDirtyChange,
  });

  const setLink = (i: number, patch: Partial<SocialLink>) =>
    set("links", form.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const skillIndex = useMemo(() => buildSkillIndex(skillGroups), [skillGroups]);

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormCard id="basics" icon="project" title="Basics" description="How the project is named and summarised on its card.">
        <Field label="Title">
          <input
            className={inputClass}
            value={form.title}
            required
            maxLength={100}
            placeholder="e.g. Multi-cloud Kubernetes platform"
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: isNew && !slugTouched ? slugify(title) : f.slug }));
            }}
          />
        </Field>

        <Field
          label="Slug"
          hint={isNew ? "Lowercase letters, numbers and hyphens. It can't be changed later." : "The slug is fixed once a project is created."}
        >
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-muted">
              /
            </span>
            <input
              className={`${inputClass} pl-8 ${isNew ? "" : "cursor-not-allowed bg-card text-muted"}`}
              value={form.slug}
              required
              readOnly={!isNew}
              aria-readonly={!isNew}
              maxLength={60}
              placeholder="my-project"
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
            {!isNew && (
              <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">
                <Icon name="lock" />
              </span>
            )}
          </div>
        </Field>

        <Field label="Summary" counter={{ value: form.summary.length, max: 200 }} hint="One or two lines shown on the project card.">
          <AutoTextarea className={inputClass} rows={2} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </Field>
      </FormCard>

      <FormCard id="details" icon="details" title="Details" description="What you built, what it used, and when.">
        <Field
          label="Description"
          counter={{ value: form.description.length, max: 3000 }}
          hint="Shown in the project's pop-up. Start a line with • or - to make it a bullet."
        >
          <AutoTextarea className={inputClass} rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>

        <Field label="Stack" group hint="Press Enter or comma to add each technology. Your skills are suggested as you type.">
          <ChipsInput
            ariaLabel="Stack"
            value={form.stack}
            onChange={(v) => set("stack", v)}
            placeholder="e.g. Kubernetes"
            max={20}
            suggest={(q, taken) => suggestSkills(skillGroups, q, taken)}
            resolve={(n) => skillIndex.get(skillKey(n)) ?? n}
          />
        </Field>

        <div className="max-w-md space-y-1.5">
          <DateSelects label="Created" month={form.month} year={form.year} onMonth={(v) => set("month", v)} onYear={(v) => set("year", v)} />
          <p className="text-xs leading-5 text-muted">When you made it. Projects appear on your site newest first by this date.</p>
        </div>
      </FormCard>

      <FormCard id="links" icon="link" title="Links" description="Where people can see it: source code, a live demo, a write-up. At least one link is required.">
        {form.links.map((l, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input className={`${inputClass} sm:w-40 sm:shrink-0`} aria-label="Link name" placeholder="e.g. GitHub" required maxLength={40} value={l.label} onChange={(e) => setLink(i, { label: e.target.value })} />
            <input className={inputClass} aria-label="Link URL" placeholder="https://…" required value={l.href} onChange={(e) => setLink(i, { href: e.target.value })} />
            <button
              type="button"
              aria-label="Remove link"
              disabled={form.links.length === 1}
              title={form.links.length === 1 ? "A project needs at least one link" : undefined}
              className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-border text-muted transition-colors hover:border-red-500/50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted sm:self-auto"
              onClick={() => set("links", form.links.filter((_, idx) => idx !== i))}
            >
              <Icon name="close" />
            </button>
          </div>
        ))}
        <button type="button" className={`${ghostButtonClass} w-fit`} onClick={() => set("links", [...form.links, { label: "", href: "" }])}>
          <Icon name="plus" /> Add link
        </button>
      </FormCard>

      <SaveBar
        dirty={dirty}
        pending={pending}
        result={result}
        submitLabel={isNew ? "Create project" : "Save changes"}
        emptyLabel={isNew ? "Nothing entered yet" : undefined}
        onDiscard={() => {
          discard();
          setSlugTouched(false);
        }}
        onCancel={onCancel}
      />
    </form>
  );
}
