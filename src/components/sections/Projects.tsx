"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/content";
import Section from "./Section";

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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
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
              <h3 className="relative font-semibold">{p.title}</h3>
              <p className="relative mt-2 flex-1 text-sm leading-6 text-muted">{p.summary}</p>
              <p className="relative mt-4 font-mono text-xs text-muted">{p.stack.join(" · ")}</p>
            </button>
          </motion.li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          // Clicking the backdrop (the dialog element itself) closes it.
          if (e.target === dialogRef.current) setSelected(null);
        }}
        className="m-auto w-[min(90vw,32rem)] rounded-xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50"
      >
        {selected && (
          <motion.div
            key={selected.slug}
            className="p-6"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold">{selected.title}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="text-muted transition-colors hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 leading-7">{selected.description}</p>
            <p className="mt-4 font-mono text-xs text-muted">
              {selected.stack.join(" · ")}
            </p>
            {selected.links.length > 0 && (
              <ul className="mt-6 flex gap-3">
                {selected.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-card"
                    >
                      {l.label}
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
