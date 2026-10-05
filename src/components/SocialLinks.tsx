import type { SocialLink } from "@/types/content";

// The profile's social links, opened in a new tab. `contact`: a stacked list with an arrow (Contact
// section). `footer`: a wrapping row, with `children` as extra items at the end (Footer).
export default function SocialLinks({ socials, variant, children }: { socials: SocialLink[]; variant: "contact" | "footer"; children?: React.ReactNode }) {
  if (variant === "footer") {
    return (
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {socials.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
              {s.label}
            </a>
          </li>
        ))}
        {children}
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      {socials.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-accent"
          >
            {s.label}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
