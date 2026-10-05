"use client";

import { useState } from "react";
import { writeClipboard } from "@/lib/clipboard";
import { track } from "@/lib/track";

// A small icon button: copies `text`, then shows a check for two seconds. There is no visible word, so `label` is
// its accessible name and tooltip ("Copy email address") and `copiedLabel` is announced once it has copied.
export default function CopyButton({ text, label, copiedLabel, track: event }: { text: string; label: string; copiedLabel: string; track?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!(await writeClipboard(text))) return; // nothing to confirm when the browser refused
    if (event) track(event); // counted by the analytics, if the site has them
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? copiedLabel : label}
        title={copied ? copiedLabel : label}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
          copied ? "border-emerald-600/50 text-emerald-700 dark:text-emerald-400" : "border-border text-muted hover:border-accent hover:text-accent"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {copied ? <path d="m5 12 5 5 9-10" /> : (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>)}
        </svg>
      </button>
      {/* A changed label on the focused button is not always announced: say it in a live region too. */}
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
