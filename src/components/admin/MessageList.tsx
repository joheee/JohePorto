"use client";

import { useOptimistic, useState, useTransition } from "react";
import { deleteMessage, setMessageRead } from "@/app/admin/(protected)/actions";
import type { Message } from "@/types/content";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ghostButtonClass } from "@/components/ui/fields";
import Icon from "@/components/ui/Icons";
import { timeAgo } from "@/lib/format";
import { initials } from "@/lib/reviews";

// When it arrived: "2 hours ago" with the full date and time on hover (and, from sm up, written under it), in the
// viewer's own timezone. suppressHydrationWarning: the server's clock and timezone differ from the browser's.
function Time({ iso }: { iso: string }) {
  if (!iso) return null;
  const full = new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return (
    <time dateTime={iso} title={full} suppressHydrationWarning className="shrink-0 text-right font-mono text-xs leading-5 text-muted">
      <span className="block text-foreground/80">{timeAgo(iso)}</span>
      <span className="block max-sm:hidden">{full}</span>
    </time>
  );
}

type Change = { type: "delete"; id: string } | { type: "read"; id: string; read: boolean };

export default function MessageList({ messages }: { messages: Message[] }) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [toDelete, setToDelete] = useState<Message | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Optimistic: the card changes the instant you act. It settles on the server's answer
  // (or snaps back, with an error message, if the action fails).
  const [items, apply] = useOptimistic(messages, (state: Message[], c: Change) =>
    c.type === "delete"
      ? state.filter((m) => m.id !== c.id)
      : state.map((m) => (m.id === c.id ? { ...m, read: c.read } : m)),
  );

  const unread = items.filter((m) => !m.read).length;
  const shown = filter === "unread" ? items.filter((m) => !m.read) : items;

  function run(change: Change, action: () => ReturnType<typeof deleteMessage>) {
    setError("");
    startTransition(async () => {
      apply(change);
      const res = await action();
      if (!res.ok) setError(res.error);
    });
  }

  const tab = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors ${
      active ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
    }`;
  const count = (active: boolean) => `rounded-full px-1.5 font-mono text-xs ${active ? "bg-black/15" : "bg-border"}`;

  return (
    <div>
      <div role="group" aria-label="Filter messages" className="mb-4 inline-flex rounded-lg border border-border bg-card/60 p-1">
        <button type="button" aria-pressed={filter === "all"} className={tab(filter === "all")} onClick={() => setFilter("all")}>
          All <span className={count(filter === "all")}>{items.length}</span>
        </button>
        <button type="button" aria-pressed={filter === "unread"} className={tab(filter === "unread")} onClick={() => setFilter("unread")}>
          Unread <span className={count(filter === "unread")}>{unread}</span>
        </button>
      </div>

      <p role="alert" className="mb-2 min-h-5 text-sm text-red-500">
        {error}
      </p>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon name="mail" className="h-5 w-5" />
          </span>
          <p className="mt-4 font-medium">{filter === "unread" ? "No unread messages." : "No messages yet."}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {filter === "unread" ? "You are all caught up." : "When someone uses the contact form on your site, the message shows up here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {shown.map((m) => (
            <li
              key={m.id}
              data-message-id={m.id}
              data-read={m.read}
              className={`relative overflow-hidden rounded-2xl border bg-card/60 transition-colors ${m.read ? "border-border" : "border-accent/40 bg-accent/[0.04]"}`}
            >
              {!m.read && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />}
              <div className="p-5 sm:p-6">
                {/* Avatar and sender on one row; the message and the buttons use the full width on phones and line up with the sender from sm up (sm:ml-15 = the avatar plus its gap). */}
                <div className="flex gap-4">
                  <span
                    aria-hidden
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold ${
                      m.read ? "bg-accent/10 text-accent" : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {initials(m.name)}
                  </span>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold leading-5">
                        <span className="truncate">{m.name}</span>
                        {!m.read && <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-medium text-accent">New</span>}
                      </p>
                      <a
                        href={`mailto:${encodeURIComponent(m.email)}`}
                        className="mt-0.5 block truncate font-mono text-xs leading-5 text-muted underline-offset-2 hover:text-accent hover:underline"
                      >
                        {m.email}
                      </a>
                    </div>
                    <Time iso={m.createdAt} />
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-border bg-background/60 px-4 py-3.5 leading-7 sm:ml-15">{m.text}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 sm:ml-15">
                  <a
                    href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: your message")}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition hover:brightness-110"
                  >
                    <Icon name="reply" className="h-3.5 w-3.5" /> Reply
                  </a>
                  <button
                    type="button"
                    disabled={pending}
                    className={ghostButtonClass}
                    onClick={() => run({ type: "read", id: m.id, read: !m.read }, () => setMessageRead(m.id, !m.read))}
                  >
                    <Icon name={m.read ? "mail" : "check"} className="h-3.5 w-3.5" />
                    {m.read ? "Mark as unread" : "Mark as read"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className={`${ghostButtonClass} text-red-500 hover:border-red-500/50 hover:bg-red-500/10 sm:ml-auto`}
                    onClick={() => setToDelete(m)}
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this message?"
        description={toDelete ? `From ${toDelete.name} (${toDelete.email}). This can't be undone.` : undefined}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const m = toDelete;
          setToDelete(null);
          if (m) run({ type: "delete", id: m.id }, () => deleteMessage(m.id));
        }}
      />
    </div>
  );
}
