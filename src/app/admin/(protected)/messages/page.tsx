import MessageList from "@/components/admin/MessageList";
import { requireAdmin } from "@/lib/auth";
import { getMessages } from "@/lib/messages";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await getMessages();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Messages</h1>
      <p className="mb-8 text-sm text-muted">Sent through the contact form on your site, newest first.</p>
      <MessageList messages={messages} />
    </div>
  );
}
