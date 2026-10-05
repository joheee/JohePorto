"use client";

import { motion } from "motion/react";

// One stage of the skills pipeline: a check node on the left rail, the stage name and tool count, and the
// skills (children). The node pops in, its check is drawn, and the content rises, all from one trigger when
// the stage scrolls into view. The rail segment below it carries a light that keeps running down (CSS).
export default function PipelineStage({
  index,
  last,
  name,
  count,
  children,
}: {
  index: number;
  last: boolean;
  name: string;
  count: string; // "6 tools"
  children: React.ReactNode;
}) {
  return (
    <motion.li className={`relative pl-12 ${last ? "" : "pb-9"}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {!last && (
        <span aria-hidden className="absolute bottom-0 left-[13px] top-7 w-px overflow-hidden bg-border">
          <span className="pipe-flow" style={{ "--i": index } as React.CSSProperties} />
        </span>
      )}
      <motion.span
        aria-hidden
        className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/50 bg-card text-emerald-500"
        variants={{ hidden: { scale: 0.6, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { duration: 0.3, delay: 0.05 } } }}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="m5 12 4.5 4.5L19 7" variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 0.4, delay: 0.25 } } }} />
        </svg>
      </motion.span>
      <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.1, ease: "easeOut" } } }}>
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="font-mono text-sm font-medium">{name}</h4>
          <span className="shrink-0 font-mono text-xs text-muted">{count}</span>
        </div>
        <div className="mt-3">{children}</div>
      </motion.div>
    </motion.li>
  );
}
