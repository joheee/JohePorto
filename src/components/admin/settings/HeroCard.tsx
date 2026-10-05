import AutoTextarea from "@/components/AutoTextarea";
import { Field, inputClass } from "@/components/ui/fields";
import ChipsInput from "../ChipsInput";
import FormCard from "../FormCard";
import type { CardProps } from "./model";

export default function HeroCard({ form, set }: CardProps) {
  return (
    <FormCard id="hero" icon="hero" title="Hero" description="The first thing visitors see.">
      <Field label="Name">
        <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Your name" />
      </Field>
      <Field label="Roles" group hint="Press Enter or comma to add. They rotate under your name.">
        <ChipsInput ariaLabel="Roles" value={form.roles} onChange={(v) => set("roles", v)} placeholder="e.g. DevOps Engineer" max={8} />
      </Field>
      <Field label="Pitch" counter={{ value: form.pitch.length, max: 300 }} hint="One or two lines under your name. Shorter reads better.">
        <AutoTextarea className={inputClass} rows={2} value={form.pitch} onChange={(e) => set("pitch", e.target.value)} />
      </Field>
    </FormCard>
  );
}
