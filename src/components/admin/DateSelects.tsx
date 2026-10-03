import { inputClass } from "./fields";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Month and year dropdowns (values are strings: "" until chosen, then "1"-"12" and "2024").
export default function DateSelects({
  label,
  month,
  year,
  onMonth,
  onYear,
}: {
  label: string;
  month: string;
  year: string;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
}) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear + 5 - 1969 }, (_, i) => thisYear + 5 - i); // newest first
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <select className={inputClass} aria-label={`${label} month`} required value={month} onChange={(e) => onMonth(e.target.value)}>
          <option value="">Month</option>
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
        <select className={inputClass} aria-label={`${label} year`} required value={year} onChange={(e) => onYear(e.target.value)}>
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
