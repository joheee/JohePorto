"use client";

import { useEffect, useRef } from "react";
import { ghostButtonClass } from "./fields";

// A styled confirmation modal (native <dialog>: focus trap, Escape, backdrop) instead of confirm().
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        // Escape: let React state decide, so the dialog and `open` never disagree.
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself) cancels.
        if (e.target === ref.current && !busy) onCancel();
      }}
      className="m-auto w-[min(90vw,26rem)] rounded-2xl border border-border bg-background p-0 text-foreground backdrop:bg-black/50"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="mt-2 break-words text-sm leading-6 text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} disabled={busy} className={ghostButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
