import AutoTextarea from "@/components/AutoTextarea";
import { Field, inputClass } from "@/components/ui/fields";
import { buildSkillIndex, skillKey, suggestSkills } from "@/lib/skills";
import type { SkillGroup } from "@/types/content";
import ChipsInput from "../ChipsInput";
import FormCard from "../FormCard";
import DatesFields from "./DatesFields";
import EntryRow, { AddEntryButton } from "./EntryRow";
import { flatten, oneLine, periodLabel, type Row } from "./model";

export default function ExperienceCard({
  rows,
  skillGroups,
  setRow,
  onAdd,
  onRemove,
}: {
  rows: Row[];
  skillGroups: SkillGroup[]; // the tech stack suggests these, and rewrites typed names to their spelling
  setRow: (uid: string, patch: Partial<Row>) => void;
  onAdd: () => void;
  onRemove: (uid: string) => void;
}) {
  const skillIndex = buildSkillIndex(skillGroups);

  return (
    <FormCard id="experience" icon="experience" title="Experience" description="Shown on the site newest first, whatever the order here.">
      {rows.length === 0 && <p className="text-sm text-muted">No entries yet.</p>}

      <ul className="space-y-3">
        {rows.map((x, i) => (
          <EntryRow
            key={x.uid}
            uid={x.uid}
            index={i}
            open={x.open}
            title={[x.role, x.company].filter(Boolean).join(" · ")}
            period={periodLabel(x)}
            current={x.current}
            removeLabel={`Remove entry ${i + 1}`}
            onToggle={() => setRow(x.uid, { open: !x.open })}
            onRemove={() => onRemove(x.uid)}
          >
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

            <DatesFields row={x} currentLabel="I am currently working here" onChange={(patch) => setRow(x.uid, patch)} />

            <Field label="Tech stack" group hint="Shown as chips under the entry. Press Enter or comma to add.">
              <ChipsInput
                ariaLabel="Tech stack"
                value={x.stack}
                onChange={(v) => setRow(x.uid, { stack: v })}
                placeholder="e.g. Terraform"
                max={20}
                suggest={(q, taken) => suggestSkills(skillGroups, q, taken)}
                resolve={(n) => skillIndex.get(skillKey(n)) ?? n}
              />
            </Field>

            <Field label="Summary" hint="One point per line. Start a line with • or - to make it a bullet.">
              <AutoTextarea className={inputClass} rows={3} value={x.summary} onChange={(e) => setRow(x.uid, { summary: e.target.value })} />
            </Field>
          </EntryRow>
        ))}
      </ul>

      <AddEntryButton label="Add experience" onClick={onAdd} />
    </FormCard>
  );
}
