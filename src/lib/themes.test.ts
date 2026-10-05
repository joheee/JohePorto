import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEMES, findTheme, resolveThemeId, themeScript } from "./themes";

describe("themes", () => {
  it("defaults to Aura Soft Dark, listed first", () => {
    expect(DEFAULT_THEME).toBe("aura-soft-dark");
    expect(THEMES[0].id).toBe(DEFAULT_THEME);
  });
  it("has unique ids", () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  });
  it("falls back to the default for unknown or missing ids", () => {
    expect(findTheme("nope").id).toBe(DEFAULT_THEME);
    expect(findTheme(null).id).toBe(DEFAULT_THEME);
  });
  it("maps the old light/dark choices", () => {
    expect(resolveThemeId("dark")).toBe("aura-soft-dark");
    expect(resolveThemeId("light")).toBe("light-plus");
    expect(resolveThemeId("dracula")).toBe("dracula");
  });
  it("the inline script knows every theme", () => {
    const s = themeScript();
    for (const t of THEMES) expect(s).toContain(t.id);
  });
  it("every theme has a CSS block", async () => {
    const css = (await import("node:fs")).readFileSync("src/app/globals.css", "utf8");
    for (const t of THEMES) expect(css).toContain(`[data-theme="${t.id}"]`);
  });
});
