"use client";

import Link from "next/link";
import { PROMPT_HOST } from "@/lib/navPath";
import { useAdminArea } from "./useNav";

// The name in the navbar, written as the start of a shell prompt (johevin-blesstowi@portfolio); NavPath adds the
// section path after it. A link to the top of the home page, or inside /admin to the hero of the site editor.
// Screen readers get the real name instead of the hyphens and the @.
export default function BrandLink({ name, user }: { name: string; user: string }) {
  const { admin } = useAdminArea();
  return (
    <Link href={admin ? "/admin/site#hero" : "/#hero"} className="min-w-0 truncate font-mono text-sm font-semibold tracking-tight transition-colors hover:text-accent">
      <span aria-hidden>
        {user}
        <span className="font-normal text-muted max-[379px]:hidden">@{PROMPT_HOST}</span>
      </span>
      <span className="sr-only">{name}</span>
    </Link>
  );
}
