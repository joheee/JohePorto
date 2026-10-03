"use client";

import { motion } from "motion/react";

// One timeline entry. Its own piece of the vertical line, its dot and its content all animate
// from the same trigger, so the line only grows as the entry appears (never ahead of it).
export default function TimelineItem({
  children,
  last = false,
}: {
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <motion.li
      className={`relative ${last ? "" : "pb-8"}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {/* This entry's segment of the line: top to the start of the next entry. */}
      <motion.span
        aria-hidden
        className="absolute -left-6 top-0 h-full w-px origin-top bg-border"
        variants={{
          hidden: { scaleY: 0 },
          show: { scaleY: 1, transition: { duration: 0.6, ease: "easeInOut" } },
        }}
      />
      <motion.span
        aria-hidden
        className="absolute -left-[27.5px] top-2 h-2 w-2 rounded-full bg-accent"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          show: { scale: 1, opacity: 1, transition: { duration: 0.3, delay: 0.1 } },
        }}
      />
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15, ease: "easeOut" } },
        }}
      >
        {children}
      </motion.div>
    </motion.li>
  );
}
