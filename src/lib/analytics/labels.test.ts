import { describe, expect, it } from "vitest";
import { changeText, countryName, labelFor, number, percent, shortDay } from "./labels";

describe("percent", () => {
  it("rounds, and says <1% for something small but real", () => {
    expect(percent(0.583)).toBe("58%");
    expect(percent(1)).toBe("100%");
    expect(percent(0)).toBe("0%");
    expect(percent(0.004)).toBe("<1%");
  });
});

describe("number", () => {
  it("groups thousands", () => expect(number(1284)).toBe("1,284"));
});

describe("countryName", () => {
  it("names a country from its code, in either case", () => {
    expect(countryName("id")).toBe("Indonesia");
    expect(countryName("US")).toBe("United States");
  });
  it("says Unknown for what it cannot place", () => {
    expect(countryName("xx")).toBe("Unknown");
    expect(countryName("")).toBe("Unknown");
    expect(countryName("zzz")).toBe("Unknown");
  });
});

describe("labelFor", () => {
  it("gives the usual names for what the server stores, and leaves other keys alone", () => {
    expect(labelFor("direct")).toBe("Direct or unknown");
    expect(labelFor("phone")).toBe("Phone");
    expect(labelFor("linkedin.com")).toBe("linkedin.com");
  });
});

describe("shortDay and changeText", () => {
  it("writes a day short", () => expect(shortDay("2026-10-06")).toBe("Oct 6"));
  it("writes a change with its sign, and a dash for nothing to compare", () => {
    expect(changeText(18)).toBe("+18%");
    expect(changeText(-4)).toBe("-4%");
    expect(changeText(0)).toBe("0%");
    expect(changeText(null)).toBe("–");
  });
});
