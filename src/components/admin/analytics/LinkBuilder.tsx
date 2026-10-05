"use client";

import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import { inputClass } from "@/components/ui/fields";
import { buildTrackedLink, LINK_PRESETS } from "@/lib/analytics/link";

// Makes a link to your site with utm tags, to put on LinkedIn, Upwork, an email signature or a CV. Visits that
// arrive through it are listed under "Campaigns" with the name you chose here.
export default function LinkBuilder({ siteUrl }: { siteUrl: string }) {
  const [source, setSource] = useState("linkedin");
  const [medium, setMedium] = useState("social");
  const [campaign, setCampaign] = useState("");
  const link = buildTrackedLink(siteUrl, { source, medium, campaign });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Where will you put the link?">
        {LINK_PRESETS.map((p) => {
          const active = source === p.source && medium === p.medium;
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSource(p.source);
                setMedium(p.medium);
              }}
              className={`rounded-lg border px-3.5 py-1.5 text-sm transition-colors ${active ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent hover:text-foreground"}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Source</span>
          <input className={inputClass} value={source} onChange={(e) => setSource(e.target.value)} maxLength={40} placeholder="linkedin" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Medium</span>
          <input className={inputClass} value={medium} onChange={(e) => setMedium(e.target.value)} maxLength={40} placeholder="social" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Campaign</span>
          <input className={inputClass} value={campaign} onChange={(e) => setCampaign(e.target.value)} maxLength={40} placeholder="optional" />
        </label>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 py-2 pl-4 pr-2">
        <code aria-label="Tracked link" className="min-w-0 flex-1 break-all font-mono text-xs leading-5">
          {link}
        </code>
        <CopyButton text={link} label="Copy the tracked link" copiedLabel="Link copied" />
      </div>
      <p className="text-xs leading-5 text-muted">Letters, digits, dots, hyphens and underscores only; anything else is changed to a hyphen, the same way the counter reads it.</p>
    </div>
  );
}
