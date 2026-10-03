import Link from "next/link";
import { getProfile } from "@/lib/settings";
import NavLinks from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

export default async function Navbar() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight">
          {profile.name}
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <NavLinks />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
