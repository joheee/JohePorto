"use client";

import { useState } from "react";
import AutoTextarea from "@/components/AutoTextarea";

type Status = "idle" | "sending" | "sent" | "error";

const MESSAGE_MAX = 5000;

const field =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [count, setCount] = useState(0); // message length (the form is uncontrolled, so we track it on input)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-start justify-center rounded-2xl border border-border bg-card/60 p-8 sm:p-10">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12 5 5 9-10" />
          </svg>
        </span>
        <p className="text-xl font-semibold tracking-tight">Message sent</p>
        <p className="mt-2 text-muted">Thanks, your message was sent. I&apos;ll get back to you soon.</p>
        <button
          type="button"
          onClick={() => {
            setCount(0); // the form remounts empty, so the counter must restart too
            setStatus("idle");
          }}
          className="mt-6 rounded-full border border-border px-5 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" className={field} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" className={field} />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium">Message</span>
          <span
            className={`font-mono text-xs transition-colors ${
              count >= MESSAGE_MAX ? "text-red-500" : count >= MESSAGE_MAX * 0.9 ? "text-amber-500" : "text-muted"
            }`}
          >
            {count}/{MESSAGE_MAX}
          </span>
        </span>
        <AutoTextarea
          name="text"
          required
          maxLength={MESSAGE_MAX}
          rows={5}
          maxHeight={480}
          placeholder="How can I help?"
          className={field}
          onInput={(e) => setCount(e.currentTarget.value.length)}
        />
      </label>
      {/* Honeypot: hidden from people, bots tend to fill it. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send message"}
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <p role="alert" className="text-sm text-red-500">
          {status === "error" && "Something went wrong. Please try again or email me directly."}
        </p>
      </div>
    </form>
  );
}
