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
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className={`relative inline-flex h-[1.5em] overflow-hidden align-bottom ${className ?? ""}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[i]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
