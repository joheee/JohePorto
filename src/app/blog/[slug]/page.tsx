import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostBody from "@/components/blog/PostBody";
import PostOutline from "@/components/blog/PostOutline";
import { formatPostDate, isoDay, readingMinutes, shortHash } from "@/lib/blog";
import { extractHeadings, lex } from "@/lib/markdown";
import { getPost, getPosts } from "@/lib/posts";
import { getProfile } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Post not found", robots: { index: false } };
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: post.title, description: post.excerpt, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, tags: post.tags },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

function PostLink({ href, label, title, align }: { href: string; label: string; title: string; align: "left" | "right" }) {
  return (
    <Link href={href} className={`group block rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-accent ${align === "right" ? "sm:text-right" : ""}`}>
      <span className="font-mono text-xs text-muted">{label}</span>
      <span className="mt-1 block font-semibold leading-snug transition-colors group-hover:text-accent">{title}</span>
    </Link>
  );
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [post, posts, profile] = await Promise.all([getPost(slug), getPosts(), getProfile()]);
  if (!post) notFound();

  const tokens = lex(post.content);
  const headings = extractHeadings(tokens);
  const index = posts.findIndex((p) => p.slug === post.slug);
  const newer = index > 0 ? posts[index - 1] : null; // the list is newest first
  const older = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;
  const edited = post.updatedAt && post.publishedAt && post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10);

  // Structured data for search engines (schema.org BlogPosting). "<" is escaped so the text can never close the script tag.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    keywords: post.tags.join(", "),
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    author: { "@type": "Person", "@id": `${siteUrl}/#person`, name: profile.name, url: siteUrl },
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Link href="/blog" className="inline-flex items-center gap-2 font-mono text-sm text-muted transition-colors hover:text-accent">
        <span aria-hidden>←</span>
        <span aria-hidden>cd ~/blog</span>
        <span className="sr-only">Back to the blog</span>
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-x-14 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
        <article className="min-w-0">
          <header>
            <p aria-hidden className="font-mono text-xs text-muted">
              <span className="text-accent">$ </span>cat posts/{post.slug}.md
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-lg leading-8 text-muted">{post.excerpt}</p>

            {/* The metadata as the front matter of a Markdown file. */}
            <div className="mt-6 rounded-xl border border-border bg-card px-4 py-3 font-mono text-xs leading-6">
              <div aria-hidden className="text-muted">
                ---
              </div>
              <dl>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-accent">date:</dt>
                <dd>
                  <time dateTime={isoDay(post.publishedAt)}>{formatPostDate(post.publishedAt)}</time>
                </dd>
              </div>
              {edited && (
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-accent">updated:</dt>
                  <dd>
                    <time dateTime={isoDay(post.updatedAt)}>{formatPostDate(post.updatedAt)}</time>
                  </dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-accent">reading:</dt>
                <dd>{readingMinutes(post.content)} min</dd>
              </div>
              {post.tags.length > 0 && (
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-accent">tags:</dt>
                  <dd className="flex min-w-0 flex-wrap gap-x-2">
                    {post.tags.map((t) => (
                      <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">
                        #{t}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              <div aria-hidden className="flex gap-3">
                <dt className="w-16 shrink-0 text-accent">commit:</dt>
                <dd>{shortHash(post.slug)}</dd>
              </div>
              </dl>
              <div aria-hidden className="text-muted">
                ---
              </div>
            </div>
          </header>

          <div className="mt-10">
            <PostBody tokens={tokens} />
          </div>

          {(newer || older) && (
            <nav aria-label="More posts" className="mt-16 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
              {older ? <PostLink href={`/blog/${older.slug}`} label="← older" title={older.title} align="left" /> : <span />}
              {newer ? <PostLink href={`/blog/${newer.slug}`} label="newer →" title={newer.title} align="right" /> : <span />}
            </nav>
          )}
        </article>

        <aside className="hidden lg:block">
          <PostOutline headings={headings} />
        </aside>
      </div>
    </div>
  );
}
