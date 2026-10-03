"use client";

import { useOptimistic, useState, useTransition } from "react";
import { deleteMessage, setMessageRead } from "@/app/admin/(protected)/actions";
import type { Message } from "@/types/content";
import ConfirmDialog from "./ConfirmDialog";
import { ghostButtonClass } from "./fields";

// Rendered in the viewer's own timezone. suppressHydrationWarning: the server's timezone differs.
function Time({ iso }: { iso: string }) {
  if (!iso) return null;
  return (
    <time dateTime={iso} suppressHydrationWarning className="font-mono text-xs text-muted">
      {new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
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
    `rounded-full px-4 py-1.5 text-sm transition-colors ${
      active ? "bg-accent text-accent-foreground" : "border border-border hover:bg-card"
    }`;

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <button type="button" className={tab(filter === "all")} onClick={() => setFilter("all")}>
          All ({items.length})
        </button>
        <button type="button" className={tab(filter === "unread")} onClick={() => setFilter("unread")}>
          Unread ({unread})
        </button>
      </div>

      <p role="alert" className="mb-4 min-h-5 text-sm text-red-500">
        {error}
      </p>

      {shown.length === 0 ? (
        <p className="text-muted">{filter === "unread" ? "No unread messages." : "No messages yet."}</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((m) => (
            <li
              key={m.id}
              data-message-id={m.id}
              data-read={m.read}
              className={`rounded-2xl border bg-card p-5 ${m.read ? "border-border" : "border-accent"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {!m.read && <span aria-label="Unread" className="h-2 w-2 rounded-full bg-accent" />}
                    {m.name}
                  </p>
                  <a
                    href={`mailto:${encodeURIComponent(m.email)}`}
                    className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {m.email}
                  </a>
                </div>
                <Time iso={m.createdAt} />
              </div>

              <p className="mt-4 whitespace-pre-wrap break-words leading-7">{m.text}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: your message")}`}
                  className={ghostButtonClass}
                >
                  Reply
                </a>
                <button
                  type="button"
                  disabled={pending}
                  className={ghostButtonClass}
                  onClick={() => run({ type: "read", id: m.id, read: !m.read }, () => setMessageRead(m.id, !m.read))}
                >
                  {m.read ? "Mark as unread" : "Mark as read"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={`${ghostButtonClass} text-red-500`}
                  onClick={() => setToDelete(m)}
                >
                  Delete
                </button>
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
