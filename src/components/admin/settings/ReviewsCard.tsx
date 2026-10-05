import AutoTextarea from "@/components/AutoTextarea";
import { Field, inputClass } from "@/components/ui/fields";
import FormCard from "../FormCard";
import EntryRow, { AddEntryButton } from "./EntryRow";
import { flatten, oneLine, type ReviewRow } from "./model";

const TEXT_MAX = 1500;

export default function ReviewsCard({
  rows,
  setRow,
  onAdd,
  onRemove,
}: {
  rows: ReviewRow[];
  setRow: (uid: string, patch: Partial<ReviewRow>) => void;
  onAdd: () => void;
  onRemove: (uid: string) => void;
}) {
  return (
    <FormCard
      id="reviews"
      icon="reviews"
      title="Reviews"
      description="What people say about working with you, shown as pull-request reviews. The section only appears on your site when there is at least one."
    >
      {rows.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}

      <ul className="space-y-3">
        {rows.map((x, i) => (
          <EntryRow
            key={x.uid}
            uid={x.uid}
            index={i}
            open={x.open}
            title={x.name}
            period={x.role || "No role"}
            current={false}
            removeLabel={`Remove review ${i + 1}`}
            onToggle={() => setRow(x.uid, { open: !x.open })}
            onRemove={() => onRemove(x.uid)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <AutoTextarea {...oneLine} maxLength={80} className={inputClass} required placeholder="e.g. Jane Doe" value={x.name} onChange={(e) => setRow(x.uid, { name: flatten(e.target.value) })} />
              </Field>
              <Field label="Role" hint="Optional, e.g. CTO at Acme or Client on Upwork.">
                <AutoTextarea {...oneLine} className={inputClass} placeholder="e.g. CTO at Acme" value={x.role} onChange={(e) => setRow(x.uid, { role: flatten(e.target.value) })} />
              </Field>
            </div>

            <Field label="Review" counter={{ value: x.text.length, max: TEXT_MAX }} hint="Their words, as they wrote them.">
              <AutoTextarea className={inputClass} rows={4} required maxLength={TEXT_MAX} placeholder="What they said about working with you" value={x.text} onChange={(e) => setRow(x.uid, { text: e.target.value })} />
            </Field>

            <Field label="Link" hint="Optional: where it can be read or checked (a LinkedIn recommendation, an Upwork review). Must start with https://">
              <input className={inputClass} type="url" placeholder="https://…" value={x.link} onChange={(e) => setRow(x.uid, { link: e.target.value })} />
            </Field>
          </EntryRow>
        ))}
      </ul>

      <AddEntryButton label="Add review" onClick={onAdd} />
    </FormCard>
  );
}
