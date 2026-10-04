import Link from "next/link";
import { getProfile } from "@/lib/settings";

export default async function Footer() {
  const profile = await getProfile();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted sm:flex-row">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {profile.socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            </li>
          ))}
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
        </ul>
      </div>
    </footer>
  );
}
