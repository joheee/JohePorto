import { getProfile } from "@/lib/settings";
import BrandLink from "./BrandLink";
import AdminActions from "./AdminActions";
import MobileMenu from "./MobileMenu";
import NavLinks from "./NavLinks";
import SectionBar from "./SectionBar";
import { shellUser } from "@/lib/navPath";
import NavPath from "./NavPath";
import ThemeToggle from "./ThemeToggle";

export default async function Navbar() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex min-w-0 flex-col justify-center leading-tight md:flex-row md:items-center">
          <BrandLink name={profile.name} user={shellUser(profile.name)} />
          <NavPath />
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <NavLinks />
          <ThemeToggle />
          <AdminActions />
          <MobileMenu />
        </div>
      </nav>
      <SectionBar />
    </header>
  );
}
