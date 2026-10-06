import Link from "next/link";
import DeletePostButton from "@/components/admin/posts/DeletePostButton";
import Icon from "@/components/ui/Icons";
import { buttonClass, ghostButtonClass } from "@/components/ui/fields";
import { requireAdmin } from "@/lib/auth";
import { formatPostDate } from "@/lib/blog";
import { getAllPosts } from "@/lib/posts";

export default async function AdminPostsPage() {
  await requireAdmin();
  const posts = await getAllPosts();

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Blog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Posts</h1>
          <p className="mt-2 text-sm text-muted">Written in Markdown. Drafts stay private until you publish them.</p>
        </div>
        <Link href="/admin/posts/new" className={buttonClass}>
          <Icon name="plus" /> New post
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="font-medium">No posts yet</p>
          <p className="mt-1 text-sm text-muted">Write your first post. It stays a draft until you publish it.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.slug} className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="min-w-0 break-words font-semibold leading-snug">{p.title}</h2>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${
                        p.status === "published" ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-amber-600/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {p.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                  <p className="mt-2 flex flex-wrap gap-x-3 font-mono text-xs text-muted">
                    <span>/blog/{p.slug}</span>
                    {p.publishedAt && <span>{formatPostDate(p.publishedAt)}</span>}
                    <span>{p.readingMinutes} min</span>
                    {p.tags.length > 0 && <span>{p.tags.map((t) => `#${t}`).join(" ")}</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {p.status === "published" && (
                    <Link href={`/blog/${p.slug}`} target="_blank" className={ghostButtonClass}>
                      View
                    </Link>
                  )}
                  <Link href={`/admin/posts/${p.slug}`} className={ghostButtonClass}>
                    <Icon name="edit" /> Edit
                  </Link>
                  <DeletePostButton slug={p.slug} title={p.title} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
