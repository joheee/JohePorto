import { Field, ghostButtonClass, inputClass } from "@/components/ui/fields";
import FormCard from "../FormCard";
import Icon, { CLOSE, PLUS } from "./Icon";
import { update, type CardProps } from "./model";

export default function ContactCard({ form, set }: CardProps) {
  return (
    <FormCard id="contact" icon="contact" title="Contact & links" description="How people reach you.">
      <Field label="Email">
        <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="you@example.com" />
      </Field>

      <div className="space-y-3">
        <p className="text-sm font-medium">Social links</p>
        {form.socials.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={`${inputClass} sm:w-40 sm:shrink-0`}
              aria-label="Link name"
              placeholder="Name"
              value={s.label}
              onChange={(e) => set("socials", update(form.socials, i, { label: e.target.value }))}
            />
            <input
              className={inputClass}
              aria-label="Link URL"
              placeholder="https://…"
              value={s.href}
              onChange={(e) => set("socials", update(form.socials, i, { href: e.target.value }))}
            />
            <button
              type="button"
              aria-label="Remove link"
              className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-border text-muted transition-colors hover:border-red-500/50 hover:text-red-500 sm:self-auto"
              onClick={() => set("socials", form.socials.filter((_, idx) => idx !== i))}
            >
              <Icon d={CLOSE} />
            </button>
          </div>
        ))}
        <button type="button" className={ghostButtonClass} onClick={() => set("socials", [...form.socials, { label: "", href: "" }])}>
          <Icon d={PLUS} /> Add link
        </button>
      </div>
    </FormCard>
  );
}
