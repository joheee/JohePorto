"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

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
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="name" required maxLength={100} placeholder="Name" className={field} />
      <input
        name="email"
        type="email"
        required
        maxLength={200}
        placeholder="Email"
        className={field}
      />
      <textarea
        name="text"
        required
        maxLength={5000}
        rows={5}
        placeholder="Message"
        className={field}
      />
      {/* Honeypot: hidden from people, bots tend to fill it. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      <p role="status" className="text-sm text-muted">
        {status === "sent" && "Thanks, your message was sent."}
        {status === "error" && "Something went wrong. Please try again or email me directly."}
      </p>
    </form>
  );
}
