export const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15";

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-card disabled:opacity-50";

export function Field({
  label,
  hint,
  counter,
  group = false,
  children,
}: {
  label: string;
  hint?: string;
  counter?: { value: number; max: number };
  group?: boolean; // true: wrapper is a div (for controls that hold several buttons, e.g. chips)
  children: React.ReactNode;
}) {
  const Wrapper = group ? "div" : "label";
  return (
    <Wrapper className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {counter && (
          <span
            className={`font-mono text-xs ${counter.value > counter.max ? "text-red-500" : "text-muted"}`}
            aria-live="off"
          >
            {counter.value}/{counter.max}
          </span>
        )}
      </span>
      {children}
      {hint && <span className="block text-xs leading-5 text-muted">{hint}</span>}
    </Wrapper>
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
