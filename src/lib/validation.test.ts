import { describe, expect, it } from "vitest";
import { profile, project, review } from "@/test/fixtures";
import { ValidationError, assertHasLink, parseProfile, parseProject } from "./validation";

const bad = (fn: () => unknown, message: RegExp) => {
  expect(fn).toThrow(ValidationError);
  expect(fn).toThrow(message);
};

describe("parseProfile", () => {
  it("accepts a valid profile and derives the flat skills list", () => {
    const p = parseProfile(profile());
    expect(p.skills).toEqual(["Go", "Terraform", "Kubernetes"]);
    expect(p.experience[0].role).toBe("DevOps Engineer");
  });

  it("trims text and drops empty roles and bio paragraphs", () => {
    const p = parseProfile(profile({ name: "  Jo  ", roles: [" A ", "", "B"], bio: ["x", "  "] }));
    expect(p.name).toBe("Jo");
    expect(p.roles).toEqual(["A", "B"]);
    expect(p.bio).toEqual(["x"]);
  });

  it("requires a name, a valid email and at least one role", () => {
    bad(() => parseProfile(profile({ name: " " })), /Name is required/);
    bad(() => parseProfile(profile({ email: "nope" })), /Email is not valid/);
    bad(() => parseProfile(profile({ roles: [" "] })), /at least one role/);
  });

  it("enforces length limits", () => {
    bad(() => parseProfile(profile({ name: "x".repeat(81) })), /Name is too long/);
    bad(() => parseProfile(profile({ roles: Array(9).fill("r") })), /too many items/);
  });

  it("collapses line breaks in single-line fields", () => {
    const p = parseProfile(profile({ experience: [{ ...profile().experience[0], role: "DevOps\n Engineer" }] }));
    expect(p.experience[0].role).toBe("DevOps Engineer");
  });

  it("validates social links", () => {
    bad(() => parseProfile(profile({ socials: [{ label: "X", href: "ftp://x" }] })), /must start with http/);
    bad(() => parseProfile(profile({ socials: [{ label: "", href: "https://x.com" }] })), /name is required/);
  });

  it("rejects an end date before the start date, and ignores the end date while current", () => {
    const base = profile().experience[0];
    bad(() => parseProfile(profile({ experience: [{ ...base, endYear: 2021 }] })), /before the start date/);
    const p = parseProfile(profile({ experience: [{ ...base, current: true, endMonth: 1, endYear: 1999 }] }));
    expect(p.experience[0]).toMatchObject({ current: true, endMonth: null, endYear: null });
  });

  it("defaults missing optional fields on older data (location, stack, education)", () => {
    // Older data simply lacks these fields.
    const legacyJob: Record<string, unknown> = { ...profile().experience[0] };
    delete legacyJob.location;
    delete legacyJob.stack;
    const old: Record<string, unknown> = { ...profile(), experience: [legacyJob] };
    delete old.education;
    const p = parseProfile(old);
    expect(p.experience[0]).toMatchObject({ location: "", stack: [] });
    expect(p.education).toEqual([]);
  });

  it("turns a legacy flat `skills` list into one group", () => {
    const old: Record<string, unknown> = { ...profile(), skills: ["Go", "go", "Rust"] };
    delete old.skillGroups;
    const p = parseProfile(old);
    expect(p.skillGroups).toEqual([{ name: "Skills", items: [{ name: "Go", aliases: [] }, { name: "Rust", aliases: [] }] }]);
  });

  it("keeps the createdAt of an entry as a normalised ISO date, and rejects junk", () => {
    const base = profile().experience[0];
    expect(parseProfile(profile({ experience: [{ ...base, createdAt: "2022-02-01" }] })).experience[0].createdAt).toBe("2022-02-01T00:00:00.000Z");
    bad(() => parseProfile(profile({ experience: [{ ...base, createdAt: "yesterday" }] })), /valid date/);
  });

  describe("skill groups", () => {
    const groups = (g: unknown) => parseProfile({ ...profile(), skillGroups: g }).skillGroups;

    it("drops empty groups and aliases that equal the skill's own name", () => {
      expect(groups([{ name: "A", items: [{ name: "React JS", aliases: ["ReactJS", "React"] }] }, { name: "Empty", items: [] }])).toEqual([
        { name: "A", items: [{ name: "React JS", aliases: ["React"] }] },
      ]);
    });

    it("rejects a skill listed twice, or a spelling shared by two skills", () => {
      bad(() => groups([{ name: "A", items: [{ name: "Go" }, { name: "Go" }] }]), /listed twice/);
      bad(() => groups([{ name: "A", items: [{ name: "Go" }, { name: "go" }] }]), /overlaps with "Go"/);
      bad(() => groups([{ name: "A", items: [{ name: "Go", aliases: ["Golang"] }, { name: "Golang" }] }]), /overlaps with "Go"/);
    });

    it("accepts a skill given as a plain string", () => {
      expect(groups([{ name: "A", items: ["Go"] }])[0].items).toEqual([{ name: "Go", aliases: [] }]);
    });
  });
});

describe("parseProfile reviews", () => {
  it("accepts a valid review and trims it", () => {
    const p = parseProfile(profile({ reviews: [review({ name: "  Jane Doe ", text: " Great work. " })] }));
    expect(p.reviews).toEqual([review({ name: "Jane Doe", text: "Great work." })]);
  });

  it("needs a name and a text, but the role and the link are optional", () => {
    bad(() => parseProfile(profile({ reviews: [review({ name: " " })] })), /Reviewer name is required/);
    bad(() => parseProfile(profile({ reviews: [review({ text: " " })] })), /Review is required/);
    expect(parseProfile(profile({ reviews: [review({ role: "", link: "" })] })).reviews[0]).toMatchObject({ role: "", link: "" });
  });

  it("only takes a link that starts with http:// or https://", () => {
    bad(() => parseProfile(profile({ reviews: [review({ link: "javascript:alert(1)" })] })), /Review link must start with http/);
  });

  it("limits the length of every field and the number of reviews", () => {
    bad(() => parseProfile(profile({ reviews: [review({ name: "x".repeat(81) })] })), /Reviewer name is too long/);
    bad(() => parseProfile(profile({ reviews: [review({ role: "x".repeat(101) })] })), /Reviewer role is too long/);
    bad(() => parseProfile(profile({ reviews: [review({ text: "x".repeat(1501) })] })), /Review is too long/);
    bad(() => parseProfile(profile({ reviews: Array(13).fill(review()) })), /Reviews has too many items/);
  });

  it("collapses line breaks in the name and role, but keeps them in the text", () => {
    const r = parseProfile(profile({ reviews: [review({ name: "Jane\nDoe", role: "CTO\n at Acme", text: "Line one.\nLine two." })] })).reviews[0];
    expect(r.name).toBe("Jane Doe");
    expect(r.role).toBe("CTO at Acme");
    expect(r.text).toBe("Line one.\nLine two.");
  });

  it("treats a profile saved before reviews existed as having none", () => {
    const old: Record<string, unknown> = { ...profile() };
    delete old.reviews;
    expect(parseProfile(old).reviews).toEqual([]);
  });
});

describe("parseProject", () => {
  it("accepts a valid project", () => {
    expect(parseProject(project())).toEqual(project());
  });

  it("requires a valid slug, title and date", () => {
    bad(() => parseProject(project({ slug: "Bad Slug" })), /lowercase letters/);
    bad(() => parseProject(project({ slug: "-x" })), /lowercase letters/);
    bad(() => parseProject(project({ title: " " })), /Title is required/);
    bad(() => parseProject({ ...project(), month: 13 }), /month is not valid/);
    bad(() => parseProject({ ...project(), year: undefined }), /year is required/);
  });

  it("accepts month and year sent as numeric strings (form values)", () => {
    expect(parseProject({ ...project(), month: "5", year: "2026" })).toMatchObject({ month: 5, year: 2026 });
  });

  it("limits the stack and the links", () => {
    bad(() => parseProject({ ...project(), stack: Array(21).fill("x") }), /too many items/);
    bad(() => parseProject({ ...project(), links: [{ label: "x", href: "javascript:alert(1)" }] }), /must start with http/);
  });
});

describe("assertHasLink", () => {
  it("only complains when a project has no link", () => {
    expect(() => assertHasLink(project())).not.toThrow();
    bad(() => assertHasLink(project({ links: [] })), /at least one link/);
  });
});
