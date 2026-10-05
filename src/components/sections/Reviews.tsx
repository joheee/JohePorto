import Reveal from "@/components/motion/Reveal";
import { initials, linkHost } from "@/lib/reviews";
import { getProfile } from "@/lib/settings";
import type { ReviewItem } from "@/types/content";
import Section from "./Section";

// A review is laid out like an approving review on a pull request: a round avatar, "name approved these
// changes", their role, a green Approved tag, then what they wrote, and where to check it.
function ReviewCard({ review, footer }: { review: ReviewItem; footer?: React.ReactNode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent">
      <header className="flex items-center gap-3 border-b border-border bg-foreground/[0.03] px-4 py-3">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-sm font-medium text-accent">
          {initials(review.name)}
        </span>
        <div className="min-w-0 flex-1 text-sm leading-5">
          {/* Phones: the name may wrap (there is little room beside the tag); wider screens cut it with an ellipsis. */}
          <p className="break-words sm:truncate sm:break-normal">
            <span className="font-semibold">{review.name}</span> <span className="text-muted">approved these changes</span>
          </p>
          {review.role && <p className="truncate font-mono text-xs text-muted">{review.role}</p>}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400 sm:px-2.5 sm:py-0.5">
          <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
          <span className="max-sm:sr-only">Approved</span>
        </span>
      </header>
      <blockquote className="flex-1 whitespace-pre-line px-5 py-5 leading-7 sm:px-8 sm:py-6">
        <p>{review.text}</p>
      </blockquote>
      {review.link && (
        <footer className="border-t border-border px-4 py-2.5 font-mono text-xs">
          <a href={review.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-accent">
            view on {linkHost(review.link)}
            <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </footer>
      )}
      {footer && <div className="border-t border-border px-4 pb-4">{footer}</div>}
    </article>
  );
}

// The Reviews section. It only exists on the public site when there is at least one review; in the editor
// (`action` given) it always shows, with a hint when empty, so the first review can be added from there.
// `entryActions` puts the editor's Edit and Delete under a review.
export default async function Reviews({
  number,
  action,
  entryActions,
}: {
  number: string;
  action?: React.ReactNode;
  entryActions?: (review: ReviewItem & { index: number }) => React.ReactNode;
}) {
  const profile = await getProfile();
  const reviews = profile.reviews.map((r, index) => ({ ...r, index }));
  if (reviews.length === 0 && !action) return null;

  return (
    <Section id="reviews" number={number} title="Reviews" actions={action}>
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <p className="font-medium">No reviews yet</p>
          <p className="mt-1 text-sm text-muted">Add what clients and colleagues say about working with you. The section appears on your site once there is one.</p>
        </div>
      ) : (
        <>
          <p className="mb-6 inline-flex items-center gap-2 font-mono text-xs text-muted">
            <span aria-hidden className="text-emerald-700 dark:text-emerald-400">
              ✓
            </span>
            {reviews.length} approving {reviews.length === 1 ? "review" : "reviews"}
          </p>
          {/* One full-width card per review, stacked like the project cards. */}
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li key={`${r.name}-${r.index}`} id={`review-${r.index}`} className="scroll-mt-24">
                <Reveal>
                  <ReviewCard review={r} footer={entryActions?.(r)} />
                </Reveal>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
