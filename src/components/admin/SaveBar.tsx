import { SaveStatus, buttonClass, ghostButtonClass } from "@/components/ui/fields";
import type { SaveResult } from "./useEditForm";

// The floating bar at the bottom of an edit form: change status, save result, Cancel, Discard, Save.
export default function SaveBar({
  dirty,
  pending,
  result,
  submitLabel,
  emptyLabel,
  onDiscard,
  onCancel,
}: {
  dirty: boolean;
  pending: boolean;
  result: SaveResult;
  submitLabel: string; // "Save changes", "Create project"
  emptyLabel?: string; // shown instead of "All changes saved" while nothing has been entered (a new item)
  onDiscard: () => void;
  onCancel?: () => void;
}) {
  const status = dirty
    ? { dot: "bg-amber-500", text: "Unsaved changes" }
    : emptyLabel
      ? { dot: "bg-border", text: emptyLabel }
      : { dot: "bg-emerald-500", text: "All changes saved" };

  return (
    <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/90 px-5 py-3 shadow-lg shadow-black/10 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex items-center gap-2 text-sm text-muted">
          <span aria-hidden className={`h-2 w-2 rounded-full ${status.dot}`} />
          <span className="sr-only sm:not-sr-only">{status.text}</span>
        </span>
        <SaveStatus status={result} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onCancel && (
          <button type="button" disabled={pending} className={ghostButtonClass} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" disabled={!dirty || pending} className={`${ghostButtonClass} whitespace-nowrap`} onClick={onDiscard}>
          Discard
        </button>
        <button type="submit" disabled={pending} className={`${buttonClass} whitespace-nowrap`}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
