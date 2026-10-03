"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import FormattedText from "@/components/FormattedText";
import type { Project } from "@/types/content";
import Section from "./Section";

function ArrowUpRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function Chips({ items, className = "" }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((s) => (
        <li key={s} className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 font-mono text-xs text-muted">
          {s}
        </li>
      ))}
    </ul>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  return (
    <Section id="projects" number="02" title="Projects">
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9s-2.1-.8-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" />
            </svg>
          </span>
          <p className="font-medium">Projects are on the way</p>
          <p className="mt-1 text-sm text-muted">Nothing to show yet. Check back soon.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.li
              key={p.slug}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <button
                type="button"
                onClick={() => setSelected(p)}
                onMouseMove={(e) => {
                  // Feed the cursor position to the spotlight layer (no re-render).
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                }}
                className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:border-accent"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)",
                  }}
                />
                {/* accent line that draws across the top on hover */}
                <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />

                <div className="relative mb-5 flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <h3 className="relative text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="relative mt-2 flex-1 text-sm leading-6 text-muted">{p.summary}</p>
                <Chips items={p.stack} className="relative mt-5" />
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        data-lenis-prevent
        onClose={() => setSelected(null)}
        onClick={(e) => {
          // Clicking the backdrop (the dialog element itself) closes it.
          if (e.target === dialogRef.current) setSelected(null);
        }}
        className="m-auto max-h-[85vh] w-[min(92vw,40rem)] overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {selected && (
          <motion.div
            key={selected.slug}
            className="p-6 sm:p-8"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-bold tracking-tight">{selected.title}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {selected.summary && <p className="mt-2 text-muted">{selected.summary}</p>}
            {selected.description && <FormattedText text={selected.description} className="mt-6 leading-7" />}
            <Chips items={selected.stack} className="mt-6" />
            {selected.links.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-3">
                {selected.links.map((l, i) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition ${
                        i === 0 ? "bg-accent text-accent-foreground hover:opacity-90" : "border border-border hover:border-accent hover:text-accent"
                      }`}
                    >
                      {l.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </dialog>
    </Section>
  );
}
