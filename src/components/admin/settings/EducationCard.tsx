import AutoTextarea from "@/components/AutoTextarea";
import { Field, inputClass } from "@/components/ui/fields";
import FormCard from "../FormCard";
import DatesFields from "./DatesFields";
import EntryRow, { AddEntryButton } from "./EntryRow";
import { flatten, oneLine, periodLabel, type EduRow } from "./model";

export default function EducationCard({
  rows,
  setRow,
  onAdd,
  onRemove,
}: {
  rows: EduRow[];
  setRow: (uid: string, patch: Partial<EduRow>) => void;
  onAdd: () => void;
  onRemove: (uid: string) => void;
}) {
  return (
    <FormCard id="education" icon="education" title="Education" description="Shown under Experience, newest first, whatever the order here.">
      {rows.length === 0 && <p className="text-sm text-muted">No entries yet.</p>}

      <ul className="space-y-3">
        {rows.map((x, i) => (
          <EntryRow
            key={x.uid}
            uid={x.uid}
            index={i}
            open={x.open}
            title={[x.degree, x.school].filter(Boolean).join(" · ")}
            period={periodLabel(x)}
            current={x.current}
            removeLabel={`Remove education ${i + 1}`}
            onToggle={() => setRow(x.uid, { open: !x.open })}
            onRemove={() => onRemove(x.uid)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="School">
                <AutoTextarea {...oneLine} className={inputClass} required placeholder="e.g. BINUS University" value={x.school} onChange={(e) => setRow(x.uid, { school: flatten(e.target.value) })} />
              </Field>
              <Field label="Degree">
                <AutoTextarea {...oneLine} className={inputClass} required placeholder="e.g. Bachelor of Computer Engineering" value={x.degree} onChange={(e) => setRow(x.uid, { degree: flatten(e.target.value) })} />
              </Field>
            </div>
            <Field label="Location">
              <AutoTextarea {...oneLine} className={inputClass} placeholder="e.g. West Jakarta, Jakarta" value={x.location} onChange={(e) => setRow(x.uid, { location: flatten(e.target.value) })} />
            </Field>

            <DatesFields row={x} currentLabel="I am currently studying here" onChange={(patch) => setRow(x.uid, patch)} />

            <Field label="Details" hint="One point per line. Start a line with • or - to make it a bullet, e.g. GPA: 3.72 or your final project.">
              <AutoTextarea className={inputClass} rows={3} value={x.summary} onChange={(e) => setRow(x.uid, { summary: e.target.value })} />
            </Field>
          </EntryRow>
        ))}
      </ul>

      <AddEntryButton label="Add education" onClick={onAdd} />
    </FormCard>
  );
}
