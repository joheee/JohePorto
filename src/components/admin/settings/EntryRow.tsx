import Icon, { CHEVRON, PLUS, TRASH } from "./Icon";

// One experience or education entry: a header you click to expand (title, period, a "Current" badge), a
// remove button, and the entry's fields in the collapsible body.
export default function EntryRow({
  uid,
  index,
  open,
  title,
  period,
  current,
  removeLabel,
  onToggle,
  onRemove,
  children,
}: {
  uid: string;
  index: number;
  open: boolean;
  title: string; // "" shows "New entry"
  period: string;
  current: boolean;
  removeLabel: string; // accessible name of the remove button
  onToggle: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <li data-entry={uid} className="rounded-xl border border-border bg-background">
      <div className="flex items-center gap-2 p-2 pr-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`entry-${uid}`}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-card"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs text-accent">{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{title || "New entry"}</span>
            <span className="block truncate font-mono text-xs text-muted">{period}</span>
          </span>
          {current && <span className="hidden shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-500 sm:inline">Current</span>}
          <Icon d={CHEVRON} className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <Icon d={TRASH} />
        </button>
      </div>

      {/* Smooth expand/collapse: animates the row height between 0fr and 1fr. */}
      <div id={`entry-${uid}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div inert={!open} className="space-y-4 border-t border-border p-4 sm:p-5">
            {children}
          </div>
        </div>
      </div>
    </li>
  );
}

// The dashed "Add experience" / "Add education" button under a list of entries.
export function AddEntryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <Icon d={PLUS} /> {label}
    </button>
  );
}
