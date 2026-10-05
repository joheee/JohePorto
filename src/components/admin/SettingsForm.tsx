"use client";

import { useState } from "react";
import { saveProfile, saveProfileSection } from "@/app/admin/(protected)/actions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Profile } from "@/types/content";
import type { SkillUsage } from "@/lib/skills";
import { SectionIcon, type CardIcon } from "./FormCard";
import SaveBar from "./SaveBar";
import AboutCard from "./settings/AboutCard";
import ContactCard from "./settings/ContactCard";
import EducationCard from "./settings/EducationCard";
import ExperienceCard from "./settings/ExperienceCard";
import HeroCard from "./settings/HeroCard";
import SkillsCard from "./settings/SkillsCard";
import { blankEduRow, blankRow, scopedPayload, toForm, toPayload, type CardId, type EduRow, type Form, type Group, type Row } from "./settings/model";
import { useEditForm } from "./useEditForm";

export type { CardId };

const SECTIONS: { id: CardId; label: string; icon: CardIcon }[] = [
  { id: "hero", label: "Hero", icon: "hero" },
  { id: "about", label: "About", icon: "about" },
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "contact", label: "Contact & links", icon: "contact" },
  { id: "experience", label: "Experience", icon: "experience" },
  { id: "education", label: "Education", icon: "education" },
];

// The profile editor. The whole settings page used to be this form; now the site editor opens it with only
// some cards (`cards`), and then it shows and saves only those. Each card is its own component in ./settings.
export default function SettingsForm({
  initial,
  projectStacks,
  cards,
  focusUid,
  onSaved,
  onCancel,
  onDirtyChange,
}: {
  initial: Profile;
  projectStacks: SkillUsage[];
  cards?: CardId[]; // only these cards are shown and saved (the site editor); omitted: every card
  focusUid?: string; // an experience or education entry to start expanded ("e0", "d1")
  onSaved?: () => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const show = (id: CardId) => !cards || cards.includes(id);
  const { form, setForm, set, dirty, pending, result, submit, discard } = useEditForm<Form>({
    initial: () => {
      const f = toForm(initial);
      if (!focusUid) return f;
      const open = <T extends { uid: string; open: boolean }>(rows: T[]) => rows.map((r) => ({ ...r, open: r.uid === focusUid }));
      return { ...f, experience: open(f.experience), education: open(f.education) };
    },
    changes: (f) => scopedPayload(f, cards),
    save: (f) => (cards ? saveProfileSection(scopedPayload(f, cards)) : saveProfile(toPayload(f))),
    onSaved,
    onDirtyChange,
    successMessage: "Saved. The site is updating.",
  });
  const [toRemove, setToRemove] = useState<string | null>(null); // uid of the experience or education entry being removed

  const setRow = (uid: string, patch: Partial<Row>) =>
    setForm((f) => ({ ...f, experience: f.experience.map((r) => (r.uid === uid ? { ...r, ...patch } : r)) }));
  const setEdu = (uid: string, patch: Partial<EduRow>) =>
    setForm((f) => ({ ...f, education: f.education.map((r) => (r.uid === uid ? { ...r, ...patch } : r)) }));
  const setGroups = (update: (groups: Group[]) => Group[]) => setForm((f) => ({ ...f, skillGroups: update(f.skillGroups) }));

  const removing = form.experience.find((r) => r.uid === toRemove);
  const removingEdu = form.education.find((r) => r.uid === toRemove);

  return (
    <form
      onSubmit={submit}
      // A required field inside a collapsed card can't be focused by the browser: open that card.
      onInvalidCapture={(e) => {
        const uid = (e.target as HTMLElement).closest("[data-entry]")?.getAttribute("data-entry");
        if (uid) {
          setRow(uid, { open: true });
          setEdu(uid, { open: true });
        }
      }}
      className={cards ? "" : "lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10"}
    >
      {/* Section navigation (desktop) */}
      <nav aria-label="Sections" className="hidden lg:block" hidden={!!cards}>
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
        {show("hero") && <HeroCard form={form} set={set} />}
        {show("about") && <AboutCard form={form} set={set} />}
        {show("skills") && <SkillsCard groups={form.skillGroups} setGroups={setGroups} experience={form.experience} projectStacks={projectStacks} />}
        {show("contact") && <ContactCard form={form} set={set} />}
        {show("experience") && (
          <ExperienceCard
            rows={form.experience}
            skillGroups={form.skillGroups}
            setRow={setRow}
            onAdd={() => set("experience", [...form.experience, blankRow()])}
            onRemove={setToRemove}
          />
        )}
        {show("education") && (
          <EducationCard rows={form.education} setRow={setEdu} onAdd={() => set("education", [...form.education, blankEduRow()])} onRemove={setToRemove} />
        )}

        <SaveBar dirty={dirty} pending={pending} result={result} submitLabel="Save changes" onDiscard={discard} onCancel={onCancel} />
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
