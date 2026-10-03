import type { Profile } from "@/types/content";

// Shown until you save your profile in /admin/settings (then Firestore takes over).
export const defaultProfile: Profile = {
  name: "Your Name",
  roles: ["Software Engineer", "Web Developer", "Problem Solver"],
  pitch: "I build fast, reliable web products from idea to deployment.",
  email: "you@example.com",
  location: "Your City, Country",
  status: "Open to new opportunities",
  focus: "Currently building a personal site with Next.js and Firebase.",
  bio: [
    "Write two or three sentences about who you are and what you care about.",
    "Mention what you are working on now and what kind of work you are open to.",
  ],
  skills: ["TypeScript", "React", "Next.js", "Node.js", "Tailwind CSS", "Firebase"],
  socials: [
    { label: "GitHub", href: "https://github.com/joheee" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/your-handle" },
  ],
  experience: [
    {
      role: "Software Engineer",
      company: "Company Name",
      summary: "What you built and the impact it had.",
      current: true,
      startMonth: 1,
      startYear: 2024,
      endMonth: null,
      endYear: null,
      createdAt: "",
    },
  ],
};

export const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/#contact" },
];
