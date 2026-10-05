import MessageList from "@/components/admin/MessageList";
import { requireAdmin } from "@/lib/auth";
import { getMessages } from "@/lib/messages";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await getMessages();

  return (
    <div>
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Inbox</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Messages</h1>
        <p className="mt-2 text-sm text-muted">Sent through the contact form on your site, newest first.</p>
      </header>
      <MessageList messages={messages} />
    </div>
  );
}
