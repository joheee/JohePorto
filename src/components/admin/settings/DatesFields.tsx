import DateSelects from "../DateSelects";
import type { RowDates } from "./model";

// "I am currently here" plus the start and end dates (the end date is "Present" while current). Shared by
// experience and education entries.
export default function DatesFields({ row, currentLabel, onChange }: { row: RowDates; currentLabel: string; onChange: (patch: Partial<RowDates>) => void }) {
  return (
    <>
      <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-card">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--accent)]"
          checked={row.current}
          onChange={(e) => onChange(e.target.checked ? { current: true, endMonth: "", endYear: "" } : { current: false })}
        />
        {currentLabel}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateSelects label="Start date" month={row.startMonth} year={row.startYear} onMonth={(v) => onChange({ startMonth: v })} onYear={(v) => onChange({ startYear: v })} />
        {row.current ? (
          <div className="space-y-1.5">
            <p className="mb-1.5 text-sm font-medium">End date</p>
            <p className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted">Present</p>
          </div>
        ) : (
          <DateSelects label="End date" month={row.endMonth} year={row.endYear} onMonth={(v) => onChange({ endMonth: v })} onYear={(v) => onChange({ endYear: v })} />
        )}
      </div>
    </>
  );
}
