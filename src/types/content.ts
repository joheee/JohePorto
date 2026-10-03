export type SocialLink = { label: string; href: string };

export type ExperienceItem = {
  role: string;
  company: string;
  summary: string;
  current: boolean; // "I am currently working here"
  startMonth: number; // 1-12
  startYear: number;
  endMonth: number | null; // null while current
  endYear: number | null;
  createdAt: string; // ISO datetime. Stored in Firestore as a Timestamp. "" until first saved.
};

// Stored in Firestore as the single document `settings/profile`.
export type Profile = {
  name: string;
  roles: string[]; // rotating line in the hero
  pitch: string;
  email: string;
  cvUrl: string; // "" hides the download button
  location: string;
  status: string;
  focus: string;
  bio: string[]; // paragraphs
  skills: string[];
  socials: SocialLink[];
  experience: ExperienceItem[];
};

// Stored in Firestore as `projects/{slug}`.
export type Project = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  stack: string[];
  links: SocialLink[];
  order: number;
};
