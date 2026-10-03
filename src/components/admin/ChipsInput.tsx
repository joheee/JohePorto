"use client";

import { useState } from "react";

// Tag-style list editor: type and press Enter or comma to add, × or Backspace to remove.
export default function ChipsInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  max = 40,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setDraft("");
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next.slice(0, max));
  }

  return (
    <div className="flex min-h-[2.75rem] w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-accent/10 py-1 pl-3 pr-1.5 text-accent">
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(value.filter((x) => x !== v))}
            className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-accent/20"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      ))}
      <input
        aria-label={ariaLabel}
        value={draft}
        placeholder={value.length ? "Add another…" : placeholder}
        onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Enter adds a chip, it must not submit the form
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        className="min-w-[8ch] flex-1 bg-transparent py-1 outline-none placeholder:text-muted/60"
      />
    </div>
  );
}
