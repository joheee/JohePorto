import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "@/components/admin/posts/PostForm";
import { requireAdmin } from "@/lib/auth";
import { getPostForAdmin } from "@/lib/posts";

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[slug]">) {
  await requireAdmin();
  const post = await getPostForAdmin((await params).slug);
  if (!post) notFound();

  return (
    <div>
      <header className="mb-8">
        <Link href="/admin/posts" className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent">
          ← Posts
        </Link>
        <h1 className="mt-2 break-words text-3xl font-bold tracking-tight">{post.title}</h1>
      </header>
      {/* key: opening another post starts the form from that post's data. */}
      <PostForm key={post.slug} initial={post} />
    </div>
  );
}
