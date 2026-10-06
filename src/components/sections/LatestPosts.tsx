import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { formatPostDate, isoDay, shortHash } from "@/lib/blog";
import type { PostSummary } from "@/types/content";
import Section from "./Section";

const SHOWN = 3;

// The newest posts as a `git log --oneline`: a short hash, the title and the date. The section only exists when
// there is a published post (the caller decides), like Reviews.
export default function LatestPosts({ number, posts }: { number: string; posts: PostSummary[] }) {
  if (posts.length === 0) return null;
  const latest = posts.slice(0, SHOWN);

  return (
    <Section id="blog" number={number} title="Blog">
      <Reveal>
        <p aria-hidden className="mb-4 font-mono text-sm text-muted">
          <span className="text-accent">$ </span>git log --oneline -{latest.length}
        </p>
        <ul className="divide-y divide-border border-y border-border">
          {latest.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group -mx-3 flex flex-col gap-1 rounded-lg px-3 py-4 transition-colors hover:bg-card sm:flex-row sm:items-baseline sm:gap-5">
                <span aria-hidden className="shrink-0 font-mono text-sm text-accent">
                  {shortHash(p.slug)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold leading-snug transition-colors group-hover:text-accent">{p.title}</span>
                  <span className="mt-1 line-clamp-2 block text-[15px] leading-6 text-muted">{p.excerpt}</span>
                </span>
                <time dateTime={isoDay(p.publishedAt)} className="shrink-0 font-mono text-xs text-muted">
                  {formatPostDate(p.publishedAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/blog" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-mono text-sm transition-colors hover:border-accent hover:text-accent">
          {posts.length > latest.length ? `View all ${posts.length} posts` : "View all posts"}
          <span aria-hidden>→</span>
        </Link>
      </Reveal>
    </Section>
  );
}
