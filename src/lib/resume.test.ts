import { describe, expect, it } from "vitest";
import { job, profile, project, school } from "@/test/fixtures";
import { buildResume, displayUrl, resumeFilename, toBullets } from "./resume";

describe("toBullets", () => {
  it("makes every non-empty line a bullet, with or without a bullet character", () => {
    expect(toBullets("• one\ntwo\n- three\n\n")).toEqual(["one", "two", "three"]);
  });
});

describe("displayUrl", () => {
  it("drops the scheme, www, trailing slashes and query", () => {
    expect(displayUrl("https://www.linkedin.com/in/x/?a=1")).toBe("linkedin.com/in/x");
  });
  it("returns the input when it is not a URL", () => {
    expect(displayUrl("not a url")).toBe("not a url");
  });
});

describe("resumeFilename", () => {
  it("uses the name, falling back to Resume", () => {
    expect(resumeFilename("Johevin Blesstowi")).toBe("Johevin-Blesstowi-Resume.pdf");
    expect(resumeFilename("  ")).toBe("Resume-Resume.pdf");
  });
});

describe("buildResume", () => {
  const data = buildResume(
    profile({ experience: [job({ role: "Old", endYear: 2021 }), job({ role: "Now", current: true, endMonth: null, endYear: null, startYear: 2024, location: "" })], education: [school()] }),
    [project({ slug: "a", title: "Older", month: 1, year: 2025 }), project({ slug: "b", title: "Newer", month: 6, year: 2026 })],
  );

  it("puts email first, then LinkedIn and GitHub upgraded to https", () => {
    expect(data.contact).toEqual([
      { text: "jo@example.com", href: "mailto:jo@example.com" },
      { text: "linkedin.com/in/jo", href: "https://www.linkedin.com/in/jo/" },
      { text: "github.com/jo", href: "https://github.com/jo" },
    ]);
  });

  it("lists experience newest first, joining company and location and using resume-style dates", () => {
    expect(data.experience.map((e) => e.title)).toEqual(["Now", "Old"]);
    expect(data.experience[0]).toMatchObject({ org: "Acme", period: "Jan. 2024 - Present", detail: "Go, Terraform", bullets: ["Ran the pipeline", "Cut costs"] });
    expect(data.experience[1].org).toBe("Acme, Remote");
  });

  it("lists projects newest first (the site lists them oldest first), using the description as bullets", () => {
    expect(data.projects.map((p) => p.title)).toEqual(["Newer", "Older"]);
    expect(data.projects[0].bullets).toEqual(["VPC and EKS", "Modular code"]);
  });

  it("falls back to the summary when a project has no description", () => {
    expect(buildResume(profile(), [project({ description: "" })]).projects[0].bullets).toEqual(["Terraform for AWS"]);
  });

  it("turns skill groups into the technical summary", () => {
    expect(data.skills[0]).toEqual({ name: "Languages", items: ["Go"] });
  });
});
