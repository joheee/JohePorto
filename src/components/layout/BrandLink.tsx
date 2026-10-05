"use client";

import Link from "next/link";
import { useAdminArea } from "./useNav";

// The name in the navbar: the top of the home page, or inside /admin the hero of the site editor.
export default function BrandLink({ name }: { name: string }) {
  const { admin } = useAdminArea();
  return (
    <Link href={admin ? "/admin/site#hero" : "/#hero"} className="min-w-0 truncate font-semibold tracking-tight">
      {name}
    </Link>
  );
}
