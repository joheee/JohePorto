import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import { getProfile } from "@/lib/settings";

export default async function Footer() {
  const profile = await getProfile();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted sm:flex-row">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <SocialLinks socials={profile.socials} variant="footer">
          <li>
            <a href="/resume.pdf" download className="transition-colors hover:text-foreground">
              Resume
            </a>
          </li>
          <li>
            <Link href="/#hero" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
              Back to top
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </Link>
          </li>
        </SocialLinks>
      </div>
    </footer>
  );
}
