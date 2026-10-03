import Link from "next/link";
import RotatingText from "@/components/motion/RotatingText";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { getProfile } from "@/lib/settings";

export default async function Hero() {
  const profile = await getProfile();

  return (
    <section id="hero" className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20">
      <Stagger>
        <StaggerItem>
          <p className="mb-6 font-mono text-base text-accent sm:text-lg">
            <RotatingText words={profile.roles} />
          </p>
        </StaggerItem>
        <StaggerItem>
          <h1 className="bg-linear-to-r from-foreground via-foreground to-accent bg-clip-text pb-2 text-6xl font-bold leading-[0.95] tracking-tighter text-transparent sm:text-8xl lg:text-9xl">
            {profile.name}
          </h1>
        </StaggerItem>
        {profile.pitch && (
          <StaggerItem>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted sm:text-xl">
              {profile.pitch}
            </p>
          </StaggerItem>
        )}
        <StaggerItem className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/#contact"
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Get in touch
          </Link>
          {profile.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-card"
            >
              {s.label}
            </a>
          ))}
        </StaggerItem>
      </Stagger>
    </section>
  );
}
