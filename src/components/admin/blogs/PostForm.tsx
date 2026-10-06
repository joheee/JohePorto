"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { savePost } from "@/app/admin/(protected)/actions";
import AutoTextarea from "@/components/AutoTextarea";
import MarkdownBody from "@/components/blog/MarkdownBody";
import ChipsInput from "@/components/admin/ChipsInput";
import FormCard from "@/components/admin/FormCard";
import SaveBar from "@/components/admin/SaveBar";
import { useEditForm } from "@/components/admin/useEditForm";
import { Field, inputClass } from "@/components/ui/fields";
import Icon from "@/components/ui/Icons";
import { lex } from "@/lib/markdown";
import type { Post, PostStatus } from "@/types/content";

type Form = { title: string; slug: string; excerpt: string; content: string; tags: string[]; status: PostStatus };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const empty: Form = { title: "", slug: "", excerpt: "", content: "", tags: [], status: "draft" };

const toForm = (p: Post): Form => ({ title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content, tags: p.tags, status: p.status });

// What the server action receives. Also used to detect unsaved changes.
const toPayload = (f: Form) => ({ ...f });

const STATUSES: { value: PostStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Only you can see it" },
  { value: "published", label: "Published", hint: "Visible on your site" },
];

export default function PostForm({
  initial,
  onSaved,
  onCancel,
  onDirtyChange,
}: {
  initial?: Post; // none = a new post
  onSaved?: () => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isNew = !initial;
  const [slugTouched, setSlugTouched] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const { form, setForm, set, dirty, pending, result, submit, discard } = useEditForm<Form>({
    initial: () => (initial ? toForm(initial) : empty),
    changes: toPayload,
    save: (f) => savePost(toPayload(f), isNew),
    onSaved: () => {
      onSaved?.();
      router.refresh();
    },
    onDirtyChange,
  });

  // The preview parses on demand only (not while writing). Code is shown without colours here: the site colours it.
  const tokens = useMemo(() => (tab === "preview" ? lex(form.content) : []), [tab, form.content]);

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormCard id="basics" icon="project" title="Basics" description="How the post is named, found and listed.">
        <Field label="Title" counter={{ value: form.title.length, max: 120 }}>
          <input
            className={inputClass}
            value={form.title}
            required
            maxLength={120}
            placeholder="e.g. PostgreSQL physical backups with pgBackRest"
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: isNew && !slugTouched ? slugify(title) : f.slug }));
            }}
          />
        </Field>

        <Field label="Slug" hint={isNew ? "The address of the post. Lowercase letters, numbers and hyphens. It can't be changed later." : "The slug is fixed once a post is created."}>
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-muted">
              /blog/
            </span>
            <input
              className={`${inputClass} pl-[4.25rem] ${isNew ? "" : "cursor-not-allowed bg-card text-muted"}`}
              value={form.slug}
              required
              readOnly={!isNew}
              aria-readonly={!isNew}
              maxLength={60}
              placeholder="my-post"
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

        <Field label="Excerpt" counter={{ value: form.excerpt.length, max: 200 }} hint="One or two lines for the post list, the home page and search results.">
          <AutoTextarea className={inputClass} rows={2} required maxLength={200} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
        </Field>

        <Field label="Tags" group hint="Press Enter or comma to add each tag. They are saved in lower case.">
          <ChipsInput ariaLabel="Tags" value={form.tags} onChange={(v) => set("tags", v)} placeholder="e.g. terraform" max={8} />
        </Field>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Status</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {STATUSES.map((s) => (
              <label
                key={s.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors focus-within:ring-4 focus-within:ring-accent/15 ${
                  form.status === s.value ? "border-accent bg-accent/10" : "border-border hover:bg-card"
                }`}
              >
                <input type="radio" name="status" value={s.value} checked={form.status === s.value} onChange={() => set("status", s.value)} className="mt-1 accent-[var(--accent)]" />
                <span>
                  <span className="block font-medium">{s.label}</span>
                  <span className="block text-xs text-muted">{s.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs leading-5 text-muted">The publish date is set the first time you publish.</p>
        </fieldset>
      </FormCard>

      <FormCard id="content" icon="details" title="Content" description="Write in Markdown. Preview shows how it reads; code is coloured on the site.">
        <div role="tablist" aria-label="Editor mode" className="flex gap-1 rounded-xl border border-border bg-background p-1 sm:w-fit">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-4 py-1.5 text-sm capitalize transition-colors sm:flex-none ${tab === t ? "bg-accent/10 font-medium text-accent" : "text-muted hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "write" ? (
          <div role="tabpanel" id="panel-write" aria-labelledby="tab-write">
            <Field label="Post text" counter={{ value: form.content.length, max: 60000 }} hint="## and ### make the headings of the outline. ```hcl title=main.tf starts a code block. > [!NOTE], [!TIP], [!IMPORTANT], [!WARNING] or [!CAUTION] starts a callout. Images are not supported.">
              <AutoTextarea
                className={`${inputClass} font-mono text-[13px] leading-6`}
                rows={16}
                value={form.content}
                required
                spellCheck
                placeholder={"## Why this matters\n\nStart writing…"}
                onChange={(e) => set("content", e.target.value)}
              />
            </Field>
          </div>
        ) : (
          <div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview" className="rounded-xl border border-border bg-background p-5 sm:p-8">
            {form.content.trim() ? <MarkdownBody tokens={tokens} /> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
          </div>
        )}
      </FormCard>

      <SaveBar
        dirty={dirty}
        pending={pending}
        result={result}
        submitLabel={isNew ? "Create post" : "Save changes"}
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
