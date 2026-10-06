"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { buttonClass, ghostButtonClass } from "@/components/ui/fields";
import Icon from "@/components/ui/Icons";
import type { Post } from "@/types/content";
import DeletePostButton from "./DeletePostButton";
import PostForm from "./PostForm";

// The blog editor of /admin/blogs, built like the site editor of /admin/site: the page is the real blog list, and
// New post and Edit open the post form in a modal. `posts` are the full posts (with their text); an Edit button
// names its post by slug.
type Open = (slug: string | null) => void; // null = a new post
const EditorContext = createContext<Open | null>(null);

function useOpen(): Open {
  const open = useContext(EditorContext);
  if (!open) throw new Error("Blog buttons must be inside <BlogEditor>");
  return open;
}

export function BlogEditor({ posts, children }: { posts: Post[]; children: React.ReactNode }) {
  const [target, setTarget] = useState<{ slug: string | null; n: number } | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty = useRef(false);
  const count = useRef(0);

  const open = useCallback<Open>((slug) => setTarget({ slug, n: ++count.current }), []);
  const markDirty = useCallback((d: boolean) => {
    dirty.current = d;
  }, []);
  const close = useCallback(() => {
    dirty.current = false;
    setConfirmClose(false);
    setTarget(null);
  }, []);
  // Cancel, the X and Escape ask first when there are unsaved edits.
  const requestClose = useCallback(() => (dirty.current ? setConfirmClose(true) : close()), [close]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (target && !el.open) el.showModal();
    if (!target && el.open) el.close();
  }, [target]);

  const post = target?.slug ? (posts.find((p) => p.slug === target.slug) ?? null) : null;
  const title = target ? (target.slug ? "Edit post" : "New post") : "Edit";

  return (
    <EditorContext.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-label={title}
        // Lenis (smooth scroll) would otherwise swallow the wheel and the dialog could not scroll.
        data-lenis-prevent
        onCancel={(e) => {
          e.preventDefault();
          requestClose();
        }}
        className="m-auto max-h-[90dvh] w-[min(96vw,52rem)] overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50"
      >
        {target && (target.slug === null || post) && (
          <div className="p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={requestClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-card hover:text-foreground"
              >
                <Icon name="close" />
              </button>
            </div>
            <PostForm key={target.n} initial={post ?? undefined} onSaved={close} onCancel={requestClose} onDirtyChange={markDirty} />
          </div>
        )}
      </dialog>
      <ConfirmDialog
        open={confirmClose}
        title="Discard your changes?"
        description="You have edits that are not saved."
        confirmLabel="Discard"
        onConfirm={close}
        onCancel={() => setConfirmClose(false)}
      />
    </EditorContext.Provider>
  );
}

// "New post", next to the heading of /admin/blogs.
export function NewPostButton() {
  const open = useOpen();
  return (
    <button type="button" onClick={() => open(null)} className={buttonClass}>
      <Icon name="plus" /> New post
    </button>
  );
}

const chip = `${ghostButtonClass} bg-background/80 backdrop-blur`;

// Under each post: View (published ones), Edit and Delete.
export function PostActions({ slug, title, published }: { slug: string; title: string; published: boolean }) {
  const open = useOpen();
  return (
    <>
      {published && (
        <a href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer" className={chip}>
          <Icon name="external" className="h-3.5 w-3.5" /> View
        </a>
      )}
      <button type="button" onClick={() => open(slug)} className={chip}>
        <Icon name="edit" className="h-3.5 w-3.5" /> Edit
      </button>
      <DeletePostButton slug={slug} title={title} />
    </>
  );
}
