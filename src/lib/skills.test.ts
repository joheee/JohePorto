import { describe, expect, it } from "vitest";
import { buildSkillIndex, canonicalizeStack, findUnassigned, findVariants, skillKey, suggestSkills } from "./skills";
import type { SkillGroup } from "@/types/content";

const groups: SkillGroup[] = [
  { name: "Languages", items: [{ name: "Go", aliases: ["Golang"] }, { name: "C++", aliases: [] }, { name: "C", aliases: [] }] },
  { name: "Frontend", items: [{ name: "React JS", aliases: ["React"] }] },
  { name: "Ops", items: [{ name: "Kubernetes", aliases: ["K8s"] }] },
];
const index = buildSkillIndex(groups);

describe("skillKey", () => {
  it("ignores case, spaces and punctuation", () => {
    expect(new Set(["React JS", "ReactJS", "react.js", " REACT-JS "].map(skillKey))).toEqual(new Set(["reactjs"]));
  });
  it("keeps + and # so C, C++ and C# stay different", () => {
    expect(new Set([skillKey("C"), skillKey("C++"), skillKey("C#")]).size).toBe(3);
  });
});

describe("canonicalizeStack", () => {
  it("rewrites names and aliases to the catalog spelling", () => {
    expect(canonicalizeStack(["Golang", "ReactJS", "k8s"], index)).toEqual(["Go", "React JS", "Kubernetes"]);
  });
  it("drops repeats after rewriting, keeping the first position", () => {
    expect(canonicalizeStack(["go", "Terraform", "Golang"], index)).toEqual(["Go", "Terraform"]);
  });
  it("leaves names that are not in the catalog as typed", () => {
    expect(canonicalizeStack(["Zabbix"], index)).toEqual(["Zabbix"]);
  });
});

describe("findUnassigned", () => {
  it("lists used-but-ungrouped names once, with where they are used, sorted", () => {
    const found = findUnassigned(
      [
        { name: "Zabbix", where: "Job A" },
        { name: "zabbix", where: "Project B" },
        { name: "Zabbix", where: "Job A" },
        { name: "Go", where: "Job A" },
        { name: "Debian", where: "Job C" },
      ],
      index,
    );
    expect(found).toEqual([
      { name: "Debian", where: ["Job C"] },
      { name: "Zabbix", where: ["Job A", "Project B"] },
    ]);
  });
});

describe("findVariants", () => {
  it("reports spellings that differ from the catalog, but not exact matches", () => {
    expect(
      findVariants(
        [
          { name: "ReactJS", where: "Job A" },
          { name: "React JS", where: "Job A" },
          { name: "Golang", where: "Project B" },
        ],
        index,
      ),
    ).toEqual([
      { from: "Golang", to: "Go", where: ["Project B"] },
      { from: "ReactJS", to: "React JS", where: ["Job A"] },
    ]);
  });
});

describe("suggestSkills", () => {
  it("matches by name or alias, prefix matches first", () => {
    expect(suggestSkills(groups, "k", [])).toEqual(["Kubernetes"]);
    expect(suggestSkills(groups, "re", [])).toEqual(["React JS"]);
    expect(suggestSkills(groups, "act", [])).toEqual(["React JS"]); // contains, not starts
  });
  it("skips skills already taken, and empty queries", () => {
    expect(suggestSkills(groups, "go", ["go"])).toEqual([]); // compared by key, so case does not matter
    expect(suggestSkills(groups, "  ", [])).toEqual([]);
  });
  it("respects the limit", () => {
    expect(suggestSkills(groups, "c", [], 1)).toHaveLength(1);
  });
});
