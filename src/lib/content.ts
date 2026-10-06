import type { Profile } from "@/types/content";

// Shown until you save your profile in /admin/site (then Firestore takes over).
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
  skillGroups: [
    {
      name: "Skills",
      items: ["TypeScript", "React", "Next.js", "Node.js", "Tailwind CSS", "Firebase"].map((name) => ({ name, aliases: [] })),
    },
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
      location: "",
      stack: [],
      current: true,
      startMonth: 1,
      startYear: 2024,
      endMonth: null,
      endYear: null,
      createdAt: "",
    },
  ],
  education: [],
  reviews: [],
};

// The admin area's tabs, shown in the same navbar instead of the public links.
export const adminNavLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Site", href: "/admin/site" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Blogs", href: "/admin/blogs" },
];

// The page-section bar under the navbar on /admin/site (same sections as the public links).
export const siteSectionLinks = [
  { label: "About", href: "/admin/site#about" },
  { label: "Projects", href: "/admin/site#projects" },
  { label: "Experience", href: "/admin/site#experience" },
  { label: "Reviews", href: "/admin/site#reviews" },
  { label: "Contact", href: "/admin/site#contact" },
];

export const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Contact", href: "/#contact" },
];

// The public links. Reviews (before Contact) and Blog (last) are only there when they have something to show: a
// link to an empty section would scroll nowhere, and an empty blog is not worth a visit.
export const publicNavLinks = (hasReviews: boolean, hasPosts = false) => {
  const links = hasReviews ? [...navLinks.slice(0, 3), { label: "Reviews", href: "/#reviews" }, ...navLinks.slice(3)] : navLinks;
  return hasPosts ? [...links, { label: "Blog", href: "/blog" }] : links;
};
