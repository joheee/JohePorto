import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { initials } from "@/lib/reviews";
import type { Message } from "@/types/content";

// The latest messages on the dashboard, as card-like rows: an avatar with the sender's initials (filled while the
// message is unread), the name and address stacked, the time on the right, then the message with its own line
// breaks (the inbox's `pre-wrap` rule), cut after 3 lines. Every row links to the inbox.
export default function RecentMessages({ messages }: { messages: Message[] }) {
  return (
    <ul className="-mx-2 space-y-1">
      {messages.map((m) => (
        <li key={m.id}>
          <Link
            href="/admin/messages"
            className={`group flex items-start gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-background ${m.read ? "" : "bg-accent/[0.07]"}`}
          >
            <span
              aria-hidden
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold ${
                m.read ? "bg-accent/10 text-accent" : "bg-accent text-accent-foreground"
              }`}
            >
              {initials(m.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className={`block truncate text-sm leading-5 ${m.read ? "font-medium" : "font-semibold"}`}>
                    {m.name}
                    {!m.read && <span className="sr-only"> (unread)</span>}
                  </span>
                  <span className="block truncate font-mono text-xs leading-5 text-muted">{m.email}</span>
                </span>
                <span className="shrink-0 pt-0.5 font-mono text-xs text-muted">{timeAgo(m.createdAt)}</span>
              </span>
              <span className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted transition-colors group-hover:text-foreground">{m.text}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
