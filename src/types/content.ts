export type SocialLink = { label: string; href: string };

export type ExperienceItem = {
  role: string;
  company: string;
  summary: string;
  location: string; // e.g. "Remote" or "East Jakarta"; "" when unset
  stack: string[]; // technologies used in this role
  current: boolean; // "I am currently working here"
  startMonth: number; // 1-12
  startYear: number;
  endMonth: number | null; // null while current
  endYear: number | null;
  createdAt: string; // ISO datetime. Stored in Firestore as a Timestamp. "" until first saved.
};

export type EducationItem = {
  school: string;
  degree: string;
  location: string; // "" when unset
  summary: string; // one point per line, like experience (e.g. "GPA: 3.72")
  current: boolean; // still studying
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
};

// What someone said about working with you, shown in the Reviews section as a pull-request review comment.
export type ReviewItem = {
  name: string; // who said it
  role: string; // e.g. "CTO at Acme" or "Client on Upwork"; "" when unset
  text: string; // the quote
  link: string; // where it can be read or verified (a LinkedIn recommendation, an Upwork review); "" when unset
};

export type Skill = { name: string; aliases: string[] }; // aliases: other spellings, e.g. Go / Golang
export type SkillGroup = { name: string; items: Skill[] };

// Stored in Firestore as the single document `settings/profile`.
export type Profile = {
  name: string;
  roles: string[]; // rotating line in the hero
  pitch: string;
  email: string;
  location: string;
  status: string;
  focus: string;
  bio: string[]; // paragraphs
  skillGroups: SkillGroup[]; // the skill catalog you edit, e.g. "DevOps Tools" with its skills
  skills: string[]; // every skill name in one flat list: derived from skillGroups, never edited
  socials: SocialLink[];
  experience: ExperienceItem[];
  education: EducationItem[];
  reviews: ReviewItem[]; // optional: the Reviews section only shows when there is at least one
};

// Stored in Firestore as `projects/{slug}`.
export type Project = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  stack: string[];
  links: SocialLink[];
  month: number; // 1-12: when the project was created
  year: number;
};

// Contact-form message, stored in Firestore as `messages/{id}`.
export type Message = {
  id: string;
  name: string;
  email: string;
  text: string;
  createdAt: string; // ISO datetime (Firestore Timestamp)
  read: boolean; // messages saved before this field existed count as unread
};
