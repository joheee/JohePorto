import Link from "next/link";
import PostForm from "@/components/admin/posts/PostForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewPostPage() {
  await requireAdmin();
  return (
    <div>
      <header className="mb-8">
        <Link href="/admin/posts" className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent">
          ← Posts
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">New post</h1>
      </header>
      <PostForm />
    </div>
  );
}
