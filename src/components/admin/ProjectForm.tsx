"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProject } from "@/app/admin/(protected)/actions";
import type { Project, SocialLink } from "@/types/content";
import { Field, SaveStatus, buttonClass, ghostButtonClass, inputClass } from "./fields";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export default function ProjectForm({ initial }: { initial?: Project }) {
  const router = useRouter();
  const isNew = !initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [stackText, setStackText] = useState(initial?.stack.join(", ") ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [links, setLinks] = useState<SocialLink[]>(initial?.links ?? []);

  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await saveProject(
        {
          title,
          slug,
          summary,
          description,
          stack: stackText.split(/[,\n]/),
          links,
          order: order === "" ? NaN : Number(order),
        },
        isNew,
      );
      if (res.ok) {
        router.push("/admin/projects");
        router.refresh();
      } else {
        setResult({ ok: false, message: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Title">
        <input
          className={inputClass}
          value={title}
          required
          onChange={(e) => {
            setTitle(e.target.value);
            if (isNew && !slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field
        label="Slug"
        hint={isNew ? "Lowercase letters, numbers, hyphens. Can't be changed later." : "The slug can't be changed."}
      >
        <input
          className={inputClass}
          value={slug}
          required
          readOnly={!isNew}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
      </Field>
      <Field label="Summary" hint="Shown on the card.">
        <textarea className={inputClass} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field label="Description" hint="Shown in the detail modal.">
        <textarea className={inputClass} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Stack" hint="Comma separated.">
          <input className={inputClass} value={stackText} onChange={(e) => setStackText(e.target.value)} />
        </Field>
        <Field label="Order" hint="Lower comes first.">
          <input className={inputClass} type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Links</p>
        {links.map((l, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row">
            <input
              className={`${inputClass} sm:w-40`}
              placeholder="Name"
              value={l.label}
              onChange={(e) => setLinks(links.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
            />
            <input
              className={inputClass}
              placeholder="https://…"
              value={l.href}
              onChange={(e) => setLinks(links.map((x, idx) => (idx === i ? { ...x, href: e.target.value } : x)))}
            />
            <button type="button" className={ghostButtonClass} onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className={ghostButtonClass} onClick={() => setLinks([...links, { label: "", href: "" }])}>
          + Add link
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : isNew ? "Create project" : "Save changes"}
        </button>
        <SaveStatus status={result} />
      </div>
    </form>
  );
}
