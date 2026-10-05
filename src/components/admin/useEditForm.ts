"use client";

import { useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@/app/admin/(protected)/actions";

export type SaveResult = { ok: boolean; message: string } | null;

// The behaviour every admin edit form shares: the form state, "has anything changed", Save (with the
// pending and error/success state), Discard (back to the last saved state), and the warnings that go with
// unsaved changes. The form itself only renders fields and says how to save.
export function useEditForm<F extends object>({
  initial,
  changes,
  save,
  onSaved,
  onDirtyChange,
  successMessage,
}: {
  initial: () => F;
  changes: (form: F) => unknown; // what counts as an edit: dirty means this differs from the last saved state
  save: (form: F) => Promise<ActionResult>;
  onSaved?: () => void; // after a successful save
  onDirtyChange?: (dirty: boolean) => void;
  successMessage?: string; // shown after a save; nothing when omitted
}) {
  const [form, setForm] = useState<F>(initial);
  const [saved, setSaved] = useState<F>(form); // last saved state: what Discard returns to
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveResult>(null);

  const set = <K extends keyof F>(key: K, value: F[K]) => setForm((f) => ({ ...f, [key]: value }));

  const dirty = JSON.stringify(changes(form)) !== JSON.stringify(changes(saved));

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const snapshot = form;
    startTransition(async () => {
      const res = await save(snapshot);
      if (res.ok) {
        setSaved(snapshot); // nothing is "unsaved" any more
        onSaved?.();
      }
      setResult(res.ok ? (successMessage ? { ok: true, message: successMessage } : null) : { ok: false, message: res.error });
    });
  }

  function discard() {
    setForm(saved);
    setResult(null);
  }

  return { form, setForm, set, dirty, pending, result, submit, discard };
}
