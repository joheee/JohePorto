"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// Cycles through `words`, sliding each one in and out.
export default function RotatingText({
  words,
  className,
}: {
  words: string[];
  className?: string;
}) {
  const [n, setN] = useState(0);
  // The list can shrink while `n` points past its end (a role was deleted): wrap instead of showing nothing.
  const word = words.length > 0 ? words[n % words.length] : "";

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => setN((c) => c + 1), 2600);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className={`relative inline-flex h-[1.8em] items-center overflow-hidden align-bottom leading-[1.8] ${className ?? ""}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
