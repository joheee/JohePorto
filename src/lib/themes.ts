// Colour themes, named after the ones people know from VS Code. The colours themselves live in
// globals.css (one `[data-theme="<id>"]` block each); this list holds what the rest of the code needs:
// the order, the names and whether a theme is dark or light (the `dark:` variant follows `data-mode`).
export type ThemeMode = "dark" | "light";
export type Theme = { id: string; label: string; mode: ThemeMode; themeColor: string };

export const DEFAULT_THEME = "aura-soft-dark";

export const THEMES: Theme[] = [
  { id: "aura-soft-dark", label: "Aura Soft Dark", mode: "dark", themeColor: "#21202e" },
  { id: "dark-plus", label: "Dark+", mode: "dark", themeColor: "#1f1f1f" },
  { id: "one-dark-pro", label: "One Dark Pro", mode: "dark", themeColor: "#282c34" },
  { id: "dracula", label: "Dracula", mode: "dark", themeColor: "#282a36" },
  { id: "tokyo-night", label: "Tokyo Night", mode: "dark", themeColor: "#1a1b26" },
  { id: "nord", label: "Nord", mode: "dark", themeColor: "#2e3440" },
  { id: "github-dark", label: "GitHub Dark", mode: "dark", themeColor: "#0d1117" },
  { id: "solarized-dark", label: "Solarized Dark", mode: "dark", themeColor: "#002b36" },
  { id: "light-plus", label: "Light+", mode: "light", themeColor: "#ffffff" },
  { id: "solarized-light", label: "Solarized Light", mode: "light", themeColor: "#fdf6e3" },
];

export function findTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

// Themes saved by the old light/dark toggle.
const LEGACY: Record<string, string> = { dark: "aura-soft-dark", light: "light-plus" };

export function resolveThemeId(saved: string | null | undefined): string {
  if (saved && LEGACY[saved]) return LEGACY[saved];
  return findTheme(saved).id;
}

/** Sets the theme on <html> (data-theme + data-mode) and the browser UI colour; returns the theme. */
export function applyTheme(id: string): Theme {
  const theme = findTheme(id);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.dataset.mode = theme.mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.themeColor);
  return theme;
}

// Inline script for <head>: runs before paint so the saved theme shows without a flash. Built from the
// list above, so the two cannot drift apart.
export function themeScript(): string {
  const table = JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, [t.mode, t.themeColor]])));
  return `(function(){try{var T=${table},L=${JSON.stringify(LEGACY)},s=localStorage.getItem("theme");s=L[s]||s;if(!T[s])s=${JSON.stringify(DEFAULT_THEME)};var r=document.documentElement;r.dataset.theme=s;r.dataset.mode=T[s][0];var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",T[s][1])}catch(e){}})()`;
}
