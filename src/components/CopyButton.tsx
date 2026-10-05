"use client";

import { useState } from "react";
import { writeClipboard } from "@/lib/clipboard";

// A small "Copy" pill: copies `text`, then reads "Copied" for two seconds. `label` is what a screen reader
// hears before copying ("Copy email address").
export default function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!(await writeClipboard(text))) return; // nothing to confirm when the browser refused
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copied ? <path d="m5 12 5 5 9-10" /> : (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>)}
      </svg>
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
