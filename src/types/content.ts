export type SocialLink = { label: string; href: string };

export type ExperienceItem = {
  role: string;
  company: string;
  period: string;
  summary: string;
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
