"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/markdown";

// The "tree" next to a post: its headings, with the one being read highlighted. Wide screens only (the post
// is a single narrow column elsewhere). The heading being read is the last one that has reached the top third
// of the window.
export default function PostOutline({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(null);
  const key = headings.map((h) => h.id).join(",");

  useEffect(() => {
    if (!key) return;
    const ids = key.split(",");
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.33) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key]);

  if (headings.length === 0) return null;
  return (
    <nav aria-label="On this page" className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto lg:block">
      <p className="mb-3 font-mono text-xs text-muted">
        <span aria-hidden>$ </span>tree --headings
      </p>
      <ol className="space-y-1 font-mono text-[13px] leading-5">
        {headings.map((h, i) => {
          const last = i === headings.length - 1;
          const current = active === h.id;
          return (
            <li key={h.id} className={h.depth === 3 ? "pl-5" : undefined}>
              <a
                href={`#${h.id}`}
                aria-current={current ? "location" : undefined}
                className={`flex gap-2 transition-colors hover:text-foreground ${current ? "text-accent" : "text-muted"}`}
              >
                <span aria-hidden className="shrink-0 select-none">
                  {last ? "└──" : "├──"}
                </span>
                <span className="min-w-0">{h.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
