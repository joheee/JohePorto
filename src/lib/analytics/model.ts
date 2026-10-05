// What the analytics counts, and what the browser is allowed to report. Cookie-free and aggregate: the server
// keeps daily totals only (see record.ts), never a profile of a visitor.

// The sections of the home page the browser reports having scrolled to, in page order.
export const SECTION_IDS = ["hero", "about", "projects", "experience", "reviews", "contact"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

// The actions a visitor can take that are worth counting. `project.<slug>` (a click on a project's link) is
// allowed on top of these.
export const EVENT_NAMES = [
  "resume", // the resume PDF was opened or downloaded
  "social.github",
  "social.linkedin",
  "social.upwork",
  "social.other",
  "copy.email",
  "copy.clone", // the `git clone` command of a project
  "copy.curl", // the curl command of the contact form
  "contact.started", // typed into the contact form
  "contact.sent", // the message was accepted
] as const;

export const SLUG_EVENT = /^project\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isEventName = (name: string): boolean => (EVENT_NAMES as readonly string[]).includes(name) || (SLUG_EVENT.test(name) && name.length <= 70);

export const MAX_EVENTS = 40;

export type Utm = { source: string; medium: string; campaign: string };

// What the browser sends: once when the page has loaded, and once when the visitor leaves.
export type ViewBeacon = { kind: "view"; ref: string; utm: Utm; theme: "dark" | "light"; width: number };
export type EndBeacon = { kind: "end"; sections: SectionId[]; events: string[] };
export type Beacon = ViewBeacon | EndBeacon;

export type Dimension = "country" | "device" | "browser" | "lang" | "theme" | "ref";
