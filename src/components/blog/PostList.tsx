"use client";

import Link from "next/link";
import { useState } from "react";
import { filterPosts, formatPostDate, isoDay, shortHash, tagCounts } from "@/lib/blog";
import type { PostSummary } from "@/types/content";

// The block cursor after a row's title (see .btn-cursor in globals.css): it blinks while the row is hovered or focused.
function Cursor() {
  return <span aria-hidden className="btn-cursor ml-1.5 inline-block h-4 w-1.5 translate-y-0.5 bg-accent opacity-0" />;
}

// /blog: the list as a directory listing. `$ ls -l` heads it, the search is a `grep` and the tags are `--tag`
// flags. Filtering happens in the browser, over the posts the page already holds.
// `actions` is what /admin/blogs adds: the editor's buttons for each post (by slug). With it the rows are not
// links (the buttons are the way in), drafts are marked, and everything else looks exactly like the public list.
export default function PostList({ posts, initialTag = null, actions }: { posts: PostSummary[]; initialTag?: string | null; actions?: Record<string, React.ReactNode> }) {
  const admin = actions !== undefined;
  const [query, setQuery] = useState("");
  const tags = tagCounts(posts);
  const [tag, setTag] = useState<string | null>(initialTag && tags.some((t) => t.tag === initialTag) ? initialTag : null);
  const shown = filterPosts(posts, query, tag);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="font-mono text-sm text-muted">ls: posts/: no such file or directory</p>
        <p className="mt-3 font-medium">No posts yet</p>
        <p className="mt-1 text-sm text-muted">{admin ? "Write your first post with the New post button. It stays a draft until you publish it." : "Nothing has been published here yet. Check back soon."}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3 font-mono text-sm">
        <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-muted">
          <span>
            <span aria-hidden className="text-accent">
              ${" "}
            </span>
            ls -l --sort=date posts/
          </span>
          <span aria-live="polite">
            {shown.length === posts.length ? `${posts.length} ${posts.length === 1 ? "post" : "posts"}` : `${shown.length} of ${posts.length} posts`}
          </span>
        </p>
        <label className="flex items-center gap-2 text-muted">
          <span aria-hidden className="text-accent">
            $
          </span>
          <span aria-hidden>grep -i</span>
          <span className="flex min-w-0 flex-1 items-center rounded-lg border border-border bg-card px-3 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            <span aria-hidden>&quot;</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search posts"
              placeholder="search title, tag or text"
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-foreground outline-none placeholder:text-muted/70"
            />
            <span aria-hidden>&quot;</span>
          </span>
        </label>
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tag">
            <span aria-hidden className="text-muted">
              --tag
            </span>
            {[{ tag: null, count: posts.length }, ...tags].map((t) => (
              <button
                key={t.tag ?? "all"}
                type="button"
                aria-pressed={tag === t.tag}
                onClick={() => setTag(t.tag)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  tag === t.tag ? "border-accent bg-accent/15 text-foreground" : "border-border text-muted hover:border-accent hover:text-foreground"
                }`}
              >
                {t.tag ?? "all"}
                <span className="ml-1.5 opacity-80">{t.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="font-mono text-sm text-muted">grep: no matches</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTag(null);
            }}
            className="mt-4 rounded-lg border border-border px-4 py-1.5 text-sm transition-colors hover:bg-card"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {shown.map((p) => {
            const body = (
              <>
                <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-accent sm:text-xl">
                  {p.title}
                  {admin ? (
                    p.status === "draft" && (
                      <span className="ml-3 rounded-full border border-amber-600/40 bg-amber-500/10 px-2.5 py-0.5 align-middle font-mono text-xs font-normal tracking-normal text-amber-800 dark:text-amber-300">Draft</span>
                    )
                  ) : (
                    <Cursor />
                  )}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[15px] leading-6 text-muted">{p.excerpt}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
                  <span aria-hidden className="text-accent">
                    {shortHash(p.slug)}
                  </span>
                  {p.publishedAt && <time dateTime={isoDay(p.publishedAt)}>{formatPostDate(p.publishedAt)}</time>}
                  <span>{p.readingMinutes} min read</span>
                  {p.tags.length > 0 && <span>{p.tags.map((t) => `#${t}`).join(" ")}</span>}
                </p>
              </>
            );
            return (
              <li key={p.slug}>
                {admin ? (
                  <div className="-mx-3 px-3 py-5">
                    {body}
                    <div className="mt-4 flex flex-wrap items-center gap-2">{actions?.[p.slug]}</div>
                  </div>
                ) : (
                  <Link href={`/blog/${p.slug}`} className="group -mx-3 block rounded-lg px-3 py-5 transition-colors hover:bg-card">
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
