"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/track";
import AutoTextarea from "@/components/AutoTextarea";
import CopyButton from "@/components/CopyButton";
import { LIMITS, curlCommand, formatBytes, lintContact, previewValue, requestBody, statusText, type ContactValues } from "@/lib/contactRequest";

// The contact form drawn as an API client (think Postman): a POST to /api/contact with the fields as the JSON
// body, a live preview of that body, a curl line for it, and a response panel that shows the real status,
// time, size and body after Send. What is sent is exactly what the preview shows (plus a hidden honeypot).
// When the server accepts the message the whole form is replaced by the response; "Send another" brings it back.
type Status = "idle" | "sending" | "sent";
type Response = { kind: "http"; status: number; ms: number; bytes: number; body: string } | { kind: "network" };

const row = "grid border-t border-border sm:grid-cols-[7rem_minmax(0,1fr)]";
const key = "flex items-start gap-2 px-4 pt-3 font-mono text-sm text-accent sm:pb-3";
const input = "w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted/60 sm:px-3";
const sectionLabel = "px-4 pt-4 font-mono text-xs uppercase tracking-widest text-muted";

// A JSON key and value, coloured like an editor.
const Json = ({ k, v, last }: { k: string; v: string; last?: boolean }) => (
  <div className="pl-4">
    <span className="text-accent">&quot;{k}&quot;</span>
    <span className="text-muted">: </span>
    <span className="break-words">{v}</span>
    {!last && <span className="text-muted">,</span>}
  </div>
);

function prettyBody(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default function ContactForm({ origin }: { origin: string }) {
  const [values, setValues] = useState<ContactValues>({ name: "", email: "", text: "" });
  const [attempted, setAttempted] = useState(false); // lint messages show after the first Send, then stay live
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<Response | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  const errors = attempted ? lintContact(values) : {};
  const set = (k: keyof ContactValues) => (e: { currentTarget: { value: string } }) => {
    const value = e.currentTarget.value; // read now: currentTarget is null once the event has finished
    if (!started.current) {
      started.current = true;
      track("contact.started"); // counted once per visit, for the analytics funnel
    }
    setValues((v) => ({ ...v, [k]: value }));
  };
  const locked = status === "sending" || status === "sent";
  const host = origin.replace(/^https?:\/\//, "");

  async function send() {
    if (locked) return;
    setAttempted(true);
    const found = lintContact(values);
    const first = (["name", "email", "text"] as const).find((k) => found[k]);
    if (first) {
      (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setStatus("sending");
    setResponse(null);
    const started = performance.now();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestBody(values), website: honeypot.current?.value ?? "" }),
      });
      const raw = await res.text();
      setResponse({ kind: "http", status: res.status, ms: Math.round(performance.now() - started), bytes: new TextEncoder().encode(raw).length, body: prettyBody(raw) });
      if (res.ok) track("contact.sent");
      setStatus(res.ok ? "sent" : "idle"); // a refused request leaves the form open to fix and resend
    } catch {
      setResponse({ kind: "network" });
      setStatus("idle");
    }
  }

  function reset() {
    setValues({ name: "", email: "", text: "" });
    setAttempted(false);
    setResponse(null);
    setStatus("idle");
    requestAnimationFrame(() => document.getElementById("c-name")?.focus()); // the form is back: start typing
  }

  const fail = (k: keyof ContactValues) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `err-${k}` : undefined });
  const lint = (k: keyof ContactValues) =>
    errors[k] && (
      <p id={`err-${k}`} className="px-4 pb-3 font-mono text-xs text-red-600 dark:text-red-400 sm:col-start-2 sm:px-3">
        ✗ {k}: {errors[k]}
      </p>
    );

  const curl = curlCommand(origin, values);

  // Accepted: the response takes the place of the form.
  if (status === "sent" && response?.kind === "http") {
    return (
      // The form was taller than this: keep the response in sight (scrollIntoView is missing in some test DOMs).
      <div ref={(el) => el?.scrollIntoView?.({ block: "nearest" })} className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 p-3">
          <span className="rounded-md bg-emerald-500/10 px-2.5 py-1.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">POST</span>
          <code className="min-w-0 flex-1 truncate rounded-md bg-background/60 px-3 py-1.5 font-mono text-xs text-muted sm:text-sm">{host}/api/contact</code>
        </div>
        <div role="status" className="border-t border-border px-4 pb-6 pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">Response</p>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {response.status} {statusText(response.status)}
            </span>
            <span className="font-mono text-xs text-muted">
              {response.ms} ms · {formatBytes(response.bytes)}
            </span>
          </div>
          <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-6">{response.body}</pre>
          <p className="mt-5 text-lg font-semibold tracking-tight">✓ Message delivered</p>
          <p className="mt-1 text-muted">Thanks, I&apos;ll get back to you soon.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-lg border border-border px-5 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void send();
        }
      }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* The request line: method, address, Send. */}
      <div className="flex items-center gap-2 p-3">
        <span className="rounded-md bg-emerald-500/10 px-2.5 py-1.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">POST</span>
        <code className="min-w-0 flex-1 truncate rounded-md bg-background/60 px-3 py-1.5 font-mono text-xs text-muted sm:text-sm">
          {host}/api/contact
        </code>
        <button
          type="submit"
          disabled={locked}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </div>

      {/* The body: one row per JSON key. */}
      <p className={sectionLabel}>Body · application/json</p>
      <div className="mt-3">
        <div className={row}>
          <label htmlFor="c-name" className={key}>
            name
          </label>
          <input id="c-name" name="name" value={values.name} onChange={set("name")} readOnly={locked} maxLength={LIMITS.name} autoComplete="name" placeholder="Your name" aria-label="Your name" className={input} {...fail("name")} />
          {lint("name")}
        </div>
        <div className={row}>
          <label htmlFor="c-email" className={key}>
            email
          </label>
          <input id="c-email" name="email" type="email" value={values.email} onChange={set("email")} readOnly={locked} maxLength={LIMITS.email} autoComplete="email" placeholder="you@example.com" aria-label="Your email" className={input} {...fail("email")} />
          {lint("email")}
        </div>
        <div className={row}>
          <label htmlFor="c-text" className={key}>
            text
          </label>
          <div className="min-w-0">
            <AutoTextarea
              id="c-text"
              name="text"
              value={values.text}
              onChange={set("text")}
              readOnly={locked}
              rows={4}
              maxHeight={360}
              maxLength={LIMITS.text}
              placeholder="How can I help?"
              aria-label="Message text"
              className={`${input} block`}
              {...fail("text")}
            />
            <p className={`px-4 pb-2 text-right font-mono text-xs sm:px-3 ${values.text.length >= LIMITS.text ? "text-red-600 dark:text-red-400" : "text-muted"}`}>
              {values.text.length}/{LIMITS.text}
            </p>
          </div>
          {lint("text")}
        </div>
      </div>
      {/* Honeypot: hidden from people, bots tend to fill it. */}
      <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {/* What will be sent. */}
      <div className="border-t border-border">
        <p className={sectionLabel}>Preview</p>
        <pre aria-label="Request body preview" className="overflow-x-auto px-4 py-3 font-mono text-xs leading-6 whitespace-pre-wrap">
          <span className="text-muted">{"{"}</span>
          <Json k="name" v={previewValue(values.name.trim())} />
          <Json k="email" v={previewValue(values.email.trim())} />
          <Json k="text" v={previewValue(values.text.trim())} last />
          <span className="text-muted">{"}"}</span>
        </pre>
        <div className="flex items-center gap-3 border-t border-border bg-background/40 py-2 pl-4 pr-3">
          <code className="line-clamp-2 min-w-0 flex-1 break-all font-mono text-xs leading-5 text-muted">
            <span className="text-emerald-700 dark:text-emerald-400">$</span> {curl}
          </code>
          <CopyButton text={curl} label="Copy the curl command" copiedLabel="Command copied" track="copy.curl" />
        </div>
      </div>

      {/* What came back, when it was not accepted (an accepted message replaces the whole form, see above). */}
      <div className="border-t border-border">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Response</p>
          {response?.kind === "http" && (
            <>
              <span className="rounded-md bg-red-500/10 px-2 py-0.5 font-mono text-xs font-bold text-red-600 dark:text-red-400">
                {response.status} {statusText(response.status)}
              </span>
              <span className="font-mono text-xs text-muted">
                {response.ms} ms · {formatBytes(response.bytes)}
              </span>
            </>
          )}
        </div>
        <div role="status" aria-live="polite" className="px-4 pb-4 pt-3 font-mono text-xs leading-6">
          {status === "sending" && <p className="text-muted">… waiting for the server</p>}
          {status !== "sending" && !response && <p className="text-muted">{"// press Send, or Ctrl/⌘ + Enter"}</p>}
          {response?.kind === "http" && (
            <>
              <pre className="whitespace-pre-wrap break-words">{response.body}</pre>
              <p className="mt-2 text-red-600 dark:text-red-400">✗ the message was not accepted. Check the fields above and send again, or email me directly.</p>
            </>
          )}
          {response?.kind === "network" && <p className="text-red-600 dark:text-red-400">✗ no response: the request could not be sent. Try again, or email me directly.</p>}
        </div>
      </div>
    </form>
  );
}
