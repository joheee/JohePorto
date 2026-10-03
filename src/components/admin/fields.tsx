export const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";

export const buttonClass =
  "rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export const ghostButtonClass =
  "rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-card";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <legend className="px-2 font-mono text-xs uppercase tracking-widest text-muted">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function SaveStatus({ status }: { status: { ok: boolean; message: string } | null }) {
  return (
    <p
      role="status"
      className={`text-sm ${status?.ok ? "text-emerald-500" : "text-red-500"}`}
    >
      {status?.message}
    </p>
  );
}
