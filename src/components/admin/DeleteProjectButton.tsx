"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteProject } from "@/app/admin/(protected)/actions";
import { ghostButtonClass } from "./fields";

export default function DeleteProjectButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteProject(slug);
      if (!res.ok) alert(res.error);
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} className={`${ghostButtonClass} text-red-500`}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
