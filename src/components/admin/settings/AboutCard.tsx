import AutoTextarea from "@/components/AutoTextarea";
import { Field, inputClass } from "@/components/ui/fields";
import FormCard from "../FormCard";
import type { CardProps } from "./model";

export default function AboutCard({ form, set }: CardProps) {
  return (
    <FormCard id="about" icon="about" title="About" description="Your story and what you're up to.">
      <Field label="Bio" hint="Separate paragraphs with a blank line.">
        <AutoTextarea className={inputClass} rows={6} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location">
          <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" />
        </Field>
        <Field label="Status">
          <input className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)} placeholder="e.g. Open to new opportunities" />
        </Field>
      </div>
      <Field label="Now" counter={{ value: form.focus.length, max: 300 }} hint="What you're currently working on or learning.">
        <AutoTextarea className={inputClass} rows={2} value={form.focus} onChange={(e) => set("focus", e.target.value)} />
      </Field>
    </FormCard>
  );
}
