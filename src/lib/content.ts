// PLACEHOLDER CONTENT: replace with your own details.
// Later this moves to Firestore (`settings` and `projects` collections).

export const profile = {
  name: "Your Name",
  role: "Software Engineer",
  roles: ["Software Engineer", "Web Developer", "Problem Solver"], // rotates in the hero
  location: "Your City, Country",
  status: "Open to new opportunities",
  focus: "Currently building a personal site with Next.js and Firebase.",
  pitch: "I build fast, reliable web products from idea to deployment.",
  email: "you@example.com",
  cvUrl: "", // e.g. "/cv.pdf" (put the file in /public). Leave empty to hide the button.
  socials: [
    { label: "GitHub", href: "https://github.com/joheee" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/your-handle" },
  ],
  bio: [
    "Write two or three sentences about who you are and what you care about.",
    "Mention what you are working on now and what kind of work you are open to.",
  ],
  skills: ["TypeScript", "React", "Next.js", "Node.js", "Tailwind CSS", "Firebase"],
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  stack: string[];
  links: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    slug: "project-one",
    title: "Project One",
    summary: "One line about what this project does.",
    description:
      "A longer description: the problem, your approach, and the result. This text shows in the detail modal.",
    stack: ["Next.js", "TypeScript"],
    links: [{ label: "Source", href: "https://github.com/joheee" }],
  },
  {
    slug: "project-two",
    title: "Project Two",
    summary: "One line about what this project does.",
    description:
      "A longer description: the problem, your approach, and the result. This text shows in the detail modal.",
    stack: ["React", "Firebase"],
    links: [],
  },
  {
    slug: "project-three",
    title: "Project Three",
    summary: "One line about what this project does.",
    description:
      "A longer description: the problem, your approach, and the result. This text shows in the detail modal.",
    stack: ["Node.js", "PostgreSQL"],
    links: [],
  },
];

export type Experience = {
  role: string;
  company: string;
  period: string;
  summary: string;
};

export const experience: Experience[] = [
  {
    role: "Software Engineer",
    company: "Company Name",
    period: "2024 – Present",
    summary: "What you built and the impact it had.",
  },
  {
    role: "Junior Developer",
    company: "Previous Company",
    period: "2022 – 2024",
    summary: "What you built and the impact it had.",
  },
];

export const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/#contact" },
];
