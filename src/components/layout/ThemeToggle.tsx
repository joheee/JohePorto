"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { THEMES, applyTheme, findTheme } from "@/lib/themes";

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  // The inline script picks the theme before paint; the server snapshot is null so the HTML never disagrees.
  const current = useSyncExternalStore(subscribe, () => findTheme(document.documentElement.dataset.theme).id, () => null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        box.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function choose(id: string) {
    applyTheme(id);
    setOpen(false);
    try {
      localStorage.setItem("theme", id);
    } catch {}
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Color theme"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="13.5" cy="6.5" r="1" />
          <circle cx="17.5" cy="10.5" r="1" />
          <circle cx="8.5" cy="7.5" r="1" />
          <circle cx="6.5" cy="12.5" r="1" />
          <path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a5 5 0 0 0 5-5c0-4.4-4.5-8.4-10-8.4z" />
        </svg>
      </button>
      {open && (
        <ul
          aria-label="Color themes"
          className="absolute right-0 top-full z-50 mt-2 max-h-[70dvh] w-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          {THEMES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={current === t.id}
                onClick={() => choose(t.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background"
              >
                {/* Scoped data-theme: the swatch paints with that theme's own colours. */}
                <span
                  aria-hidden
                  data-theme={t.id}
                  className="flex h-5 w-8 shrink-0 items-center justify-center rounded border border-border bg-background"
                >
                  <span className="h-2 w-2 rounded-full bg-accent" />
                </span>
                <span className="flex-1">{t.label}</span>
                {current === t.id && (
                  <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
