"use client";

import { useId, useState } from "react";

// Tag-style list editor: type and press Enter or comma to add, × or Backspace to remove.
// Optional: `suggest` lists matching choices while typing (arrow keys + Enter, or click), and
// `resolve` rewrites what was typed to its canonical spelling when it is added.
export default function ChipsInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  max = 40,
  suggest,
  resolve,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
  max?: number;
  suggest?: (query: string, taken: string[]) => string[];
  resolve?: (name: string) => string;
}) {
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(-1); // highlighted suggestion
  const [open, setOpen] = useState(false);
  const listId = useId();

  const suggestions = suggest && open ? suggest(draft, value) : [];
  const showList = suggestions.length > 0;

  function commit(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean).map((p) => resolve?.(p) ?? p);
    setDraft("");
    setActive(-1);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next.slice(0, max));
  }

  return (
    <div className="relative">
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
          {...(suggest && {
            role: "combobox",
            "aria-expanded": showList,
            "aria-controls": listId,
            "aria-autocomplete": "list" as const,
            "aria-activedescendant": showList && active >= 0 ? `${listId}-${active}` : undefined,
          })}
          value={draft}
          placeholder={value.length ? "Add another…" : placeholder}
          onChange={(e) => {
            setOpen(true);
            setActive(-1);
            if (e.target.value.includes(",")) commit(e.target.value);
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (showList && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              const step = e.key === "ArrowDown" ? 1 : -1;
              setActive((a) => (a + step + suggestions.length) % suggestions.length);
            } else if (e.key === "Escape" && showList) {
              e.preventDefault();
              e.stopPropagation(); // closes the list, not a surrounding dialog
              setOpen(false);
            } else if (e.key === "Enter") {
              e.preventDefault(); // Enter adds a chip, it must not submit the form
              commit(showList && active >= 0 ? suggestions[active] : draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => {
            setOpen(false);
            commit(draft);
          }}
          onFocus={() => setOpen(true)}
          className="min-w-[8ch] flex-1 bg-transparent py-1 outline-none placeholder:text-muted/60"
        />
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${ariaLabel} suggestions`}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-background py-1 text-sm shadow-lg shadow-black/10"
        >
          {suggestions.map((name, i) => (
            <li
              key={name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) + preventDefault keeps focus in the input, so blur doesn't add the half-typed text first.
              onMouseDown={(e) => {
                e.preventDefault();
                commit(name);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-2 ${i === active ? "bg-accent/10 text-accent" : ""}`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
