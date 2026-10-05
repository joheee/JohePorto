import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import { getProfile } from "@/lib/settings";

// A status bar, like the one at the bottom of a code editor: the copyright and a way back to the top on the
// left, the links as paths (./github, ./resume) on the right.
export default async function Footer() {
  const profile = await getProfile();

  return (
    <footer className="border-t border-border bg-foreground/[0.02]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-6 font-mono text-xs text-muted md:flex-row md:justify-between">
        <p className="inline-flex items-center gap-3">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <Link href="/#hero" aria-label="Back to top" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <span aria-hidden>↑ top</span>
          </Link>
        </p>
        <SocialLinks socials={profile.socials} variant="footer">
          <li>
            <a href="/resume.pdf" download className="transition-colors hover:text-foreground">
              <span aria-hidden>./</span>
              <span className="lowercase">Resume</span>
            </a>
          </li>
        </SocialLinks>
      </div>
    </footer>
  );
}
