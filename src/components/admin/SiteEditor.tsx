"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { deleteProfileItem } from "@/app/admin/(protected)/actions";
import type { SkillUsage } from "@/lib/skills";
import type { Profile, Project } from "@/types/content";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { buttonClass, ghostButtonClass } from "@/components/ui/fields";
import Icon from "@/components/ui/Icons";
import ProjectForm from "./ProjectForm";
import SettingsForm, { type CardId } from "./SettingsForm";

// The public sections, as they appear on /admin/site, each with an Edit button. Every one opens the same
// settings form, limited to the cards that belong to that section, and saves only those fields.
export type EditSection = "hero" | "about" | "contact" | "experience" | "education" | "reviews";

const SECTIONS: Record<EditSection, { title: string; cards: CardId[] }> = {
  hero: { title: "Hero", cards: ["hero", "contact"] }, // the hero also shows your social links
  about: { title: "About and skills", cards: ["about", "skills"] },
  contact: { title: "Contact", cards: ["contact"] },
  experience: { title: "Experience", cards: ["experience"] },
  education: { title: "Education", cards: ["education"] },
  reviews: { title: "Reviews", cards: ["reviews"] },
};

// What the modal is editing: a group of profile cards, or one project (none = a new project).
type Target = { section: EditSection; uid?: string } | { project: Project | null };
type Open = (target: Target) => void;
const EditorContext = createContext<Open | null>(null);

function useOpen(): Open {
  const open = useContext(EditorContext);
  if (!open) throw new Error("Edit buttons must be inside <SiteEditor>");
  return open;
}

export function SiteEditor({ profile, projectStacks, children }: { profile: Profile; projectStacks: SkillUsage[]; children: React.ReactNode }) {
  const [target, setTarget] = useState<(Target & { n: number }) | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty = useRef(false);
  const count = useRef(0);

  const open = useCallback<Open>((t) => setTarget({ ...t, n: ++count.current }), []);
  const markDirty = useCallback((d: boolean) => {
    dirty.current = d;
  }, []);
  const close = useCallback(() => {
    dirty.current = false;
    setConfirmClose(false);
    setTarget(null);
  }, []);
  // Cancel, the X and Escape ask first when there are unsaved edits.
  const requestClose = useCallback(() => (dirty.current ? setConfirmClose(true) : close()), [close]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (target && !el.open) el.showModal();
    if (!target && el.open) el.close();
  }, [target]);

  const section = target && "section" in target ? SECTIONS[target.section] : null;
  const project = target && "project" in target ? target.project : null;
  const title = section ? `Edit ${section.title}` : target ? (project ? "Edit project" : "New project") : "Edit";

  return (
    <EditorContext.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-label={title}
        // Lenis (smooth scroll) would otherwise swallow the wheel and the dialog could not scroll.
        data-lenis-prevent
        onCancel={(e) => {
          e.preventDefault();
          requestClose();
        }}
        className="m-auto max-h-[90dvh] w-[min(96vw,52rem)] overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50"
      >
        {target && (
          <div className="p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={requestClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-card hover:text-foreground"
              >
                <Icon name="close" />
              </button>
            </div>
            {section ? (
              <SettingsForm
                key={target.n}
                initial={profile}
                projectStacks={projectStacks}
                cards={section.cards}
                focusUid={"uid" in target ? target.uid : undefined}
                onSaved={close}
                onCancel={requestClose}
                onDirtyChange={markDirty}
              />
            ) : (
              <ProjectForm
                key={target.n}
                initial={project ?? undefined}
                skillGroups={profile.skillGroups}
                onSaved={close}
                onCancel={requestClose}
                onDirtyChange={markDirty}
              />
            )}
          </div>
        )}
      </dialog>
      <ConfirmDialog
        open={confirmClose}
        title="Discard your changes?"
        description="You have edits that are not saved."
        confirmLabel="Discard"
        onConfirm={close}
        onCancel={() => setConfirmClose(false)}
      />
    </EditorContext.Provider>
  );
}

const chip = `${ghostButtonClass} bg-background/80 backdrop-blur`;

// Section-level button, e.g. next to a section title.
export function EditButton({ section, className = "" }: { section: EditSection; className?: string }) {
  const open = useOpen();
  return (
    <button type="button" onClick={() => open({ section })} className={`${chip} ${className}`}>
      <Icon name="edit" className="h-3.5 w-3.5" /> Edit
    </button>
  );
}

// What each kind of entry is called in the confirmation, which editor section it belongs to, and the prefix of
// its row in that section's form ("e0", "d1", "r2": see `toForm`).
const ITEM_KINDS = {
  experience: { noun: "job", section: "experience", prefix: "e", from: "your site and resume" },
  education: { noun: "education entry", section: "education", prefix: "d", from: "your site and resume" },
  review: { noun: "review", section: "reviews", prefix: "r", from: "your site" },
} as const;

// Edit and Delete for one experience, education or review entry. `index` is its position in the stored list;
// `label` identifies it to the server ("role|company", "degree|school", "name|role") so a stale page can't remove the wrong one.
export function ItemActions({ kind, index, label, name }: { kind: "experience" | "education" | "review"; index: number; label: string; name: string }) {
  const meta = ITEM_KINDS[kind];
  const router = useRouter();
  const open = useOpen();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    setConfirm(false);
    setError("");
    startTransition(async () => {
      const res = await deleteProfileItem(kind, index, label);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => open({ section: meta.section, uid: `${meta.prefix}${index}` })} className={chip}>
        <Icon name="edit" className="h-3.5 w-3.5" /> Edit
      </button>
      <button type="button" disabled={pending} onClick={() => setConfirm(true)} className={`${chip} text-red-500`}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-500">
          {error}
        </span>
      )}
      <ConfirmDialog
        open={confirm}
        title={`Delete this ${meta.noun}?`}
        description={`"${name}" will be removed from ${meta.from}. This can't be undone.`}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

// "New project" next to the Projects title, and Edit on a project card: both open the project form in the modal.
export function ProjectButton({ project, className = "" }: { project?: Project; className?: string }) {
  const open = useOpen();
  return project ? (
    <button type="button" onClick={() => open({ project })} className={`${ghostButtonClass} ${className}`}>
      <Icon name="edit" className="h-3.5 w-3.5" /> Edit
    </button>
  ) : (
    <button type="button" onClick={() => open({ project: null })} className={`${buttonClass} ${className}`}>
      <Icon name="plus" /> New project
    </button>
  );
}
