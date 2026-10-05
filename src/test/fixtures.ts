import type { EducationItem, ExperienceItem, Profile, Project, ReviewItem } from "@/types/content";

// Small, valid sample data for tests. Override what a test cares about: `job({ current: true })`.
export const job = (o: Partial<ExperienceItem> = {}): ExperienceItem => ({
  role: "DevOps Engineer",
  company: "Acme",
  summary: "• Ran the pipeline\n• Cut costs",
  location: "Remote",
  stack: ["Go", "Terraform"],
  current: false,
  startMonth: 1,
  startYear: 2022,
  endMonth: 12,
  endYear: 2023,
  createdAt: "2022-01-01T00:00:00.000Z",
  ...o,
});

export const school = (o: Partial<EducationItem> = {}): EducationItem => ({
  school: "BINUS",
  degree: "BSc Computer Science",
  location: "Jakarta",
  summary: "GPA: 3.7",
  current: false,
  startMonth: 9,
  startYear: 2016,
  endMonth: 7,
  endYear: 2020,
  ...o,
});

export const review = (o: Partial<ReviewItem> = {}): ReviewItem => ({
  name: "Jane Doe",
  role: "CTO at Acme",
  text: "Johe automated our whole deployment pipeline and it has run without a hitch since.",
  link: "https://www.linkedin.com/in/jane-doe/",
  ...o,
});

export const project = (o: Partial<Project> = {}): Project => ({
  slug: "aws-base",
  title: "AWS Base Infrastructure",
  summary: "Terraform for AWS",
  description: "• VPC and EKS\n• Modular code",
  stack: ["AWS", "Terraform"],
  links: [{ label: "GitHub", href: "https://github.com/x/y" }],
  month: 5,
  year: 2026,
  ...o,
});

export const profile = (o: Partial<Profile> = {}): Profile => ({
  name: "Jo Doe",
  roles: ["DevOps Engineer", "Cloud Engineer"],
  pitch: "I ship things.",
  email: "jo@example.com",
  location: "Jakarta",
  status: "Open for projects",
  focus: "Kubernetes",
  bio: ["First paragraph.", "Second paragraph."],
  skillGroups: [
    { name: "Languages", items: [{ name: "Go", aliases: ["Golang"] }] },
    { name: "DevOps Tools", items: [{ name: "Terraform", aliases: [] }, { name: "Kubernetes", aliases: ["K8s"] }] },
  ],
  skills: ["Go", "Terraform", "Kubernetes"],
  socials: [
    { label: "GitHub", href: "https://github.com/jo" },
    { label: "LinkedIn", href: "http://www.linkedin.com/in/jo/" },
  ],
  experience: [job()],
  education: [school()],
  reviews: [],
  ...o,
});
