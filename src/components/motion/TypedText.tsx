"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 2200;
const DELETE_MS = 35;
const TYPE_MS = 70;
const PAUSE_MS = 250;

type Phase = "hold" | "delete" | "type";

// A terminal's output line: the current word stays, is deleted a letter at a time, and the next one is typed,
// with a block cursor at the end. It is a fixed-height line (the caller sets `h-* leading-*`), so it never moves
// what is below it, and it lines up with the prompt above. The first word is complete in the server HTML (no JavaScript, no layout shift) and stays
// still for people who ask for reduced motion or have a single word. Screen readers get all the words once.
export default function TypedText({ words, className, cursorClassName = "bg-accent" }: { words: string[]; className?: string; cursorClassName?: string }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("hold");
  // The list can shrink while `i` points past its end (a role was deleted): wrap instead of showing nothing.
  const word = words.length > 0 ? words[i % words.length] : "";
  const [n, setN] = useState(word.length);
  const animate = words.length > 1;
  // Clamp: the word may be shorter than the letters shown when the list changes under us; a single word
  // (the list shrank mid-animation) is always shown whole.
  const shown = animate ? Math.min(n, word.length) : word.length;

  useEffect(() => {
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id: ReturnType<typeof setTimeout>;
    if (phase === "hold") {
      id = setTimeout(() => setPhase("delete"), HOLD_MS);
    } else if (phase === "delete") {
      if (shown > 0) id = setTimeout(() => setN(shown - 1), DELETE_MS);
      else
        id = setTimeout(() => {
          setI((c) => c + 1);
          setPhase("type");
        }, PAUSE_MS);
    } else if (shown < word.length) {
      id = setTimeout(() => setN(shown + 1), TYPE_MS);
    } else {
      id = setTimeout(() => setPhase("hold"), 0);
    }
    return () => clearTimeout(id);
  }, [animate, phase, shown, word.length]);

  return (
    <span className={`flex items-center ${className ?? ""}`}>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden>{word.slice(0, shown)}</span>
      <span aria-hidden className={`term-cursor ml-0.5 inline-block h-[1.1em] w-[0.55em] ${cursorClassName}`} />
    </span>
  );
}
