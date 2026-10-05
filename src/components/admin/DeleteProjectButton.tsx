"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject } from "@/app/admin/(protected)/actions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ghostButtonClass } from "@/components/ui/fields";

export default function DeleteProjectButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setOpen(false);
    setError("");
    startTransition(async () => {
      const res = await deleteProject(slug);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={pending} className={`${ghostButtonClass} text-red-500`}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-500">
          {error}
        </span>
      )}
      <ConfirmDialog
        open={open}
        title="Delete this project?"
        description={`"${title}" will be removed from your site. This can't be undone.`}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
