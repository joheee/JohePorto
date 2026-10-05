import { describe, expect, it } from "vitest";
import { parseRange, RANGES } from "./range";

describe("parseRange", () => {
  it("accepts the periods that are offered", () => {
    for (const r of RANGES) expect(parseRange(String(r))).toBe(r);
  });
  it("uses 30 days for anything else, including nothing, a list and junk", () => {
    expect(parseRange(undefined)).toBe(30);
    expect(parseRange("")).toBe(30);
    expect(parseRange("14")).toBe(30);
    expect(parseRange("abc")).toBe(30);
    expect(parseRange("-7")).toBe(30);
  });
  it("reads the first of repeated values", () => {
    expect(parseRange(["7", "90"])).toBe(7);
  });
});
