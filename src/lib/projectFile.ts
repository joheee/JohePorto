import { skillKey } from "./skills";

// What a project looks like as a "file" in its card: a name made from the slug and an extension that
// follows the first technology of the stack we know ("Terraform" -> .tf). Anything else is a README.
const EXTENSIONS: Record<string, string> = {
  terraform: "tf",
  kubernetes: "yaml",
  k8s: "yaml",
  helm: "yaml",
  helmchart: "yaml",
  ansible: "yml",
  githubactions: "yml",
  docker: "dockerfile",
  jenkins: "groovy",
  bash: "sh",
  bashscript: "sh",
  shell: "sh",
  shellscript: "sh",
  go: "go",
  golang: "go",
  python: "py",
  typescript: "ts",
  javascript: "js",
  java: "java",
  kotlin: "kt",
  rust: "rs",
  php: "php",
  flutter: "dart",
  sql: "sql",
  postgresql: "sql",
  postgres: "sql",
  mysql: "sql",
};

export function projectFileName(slug: string, stack: string[]): string {
  const ext = stack.map((s) => EXTENSIONS[skillKey(s)]).find(Boolean) ?? "md";
  return `${slug}.${ext}`;
}

const REPO_HOSTS = new Set(["github.com", "gitlab.com", "bitbucket.org"]);

// `git clone <url>` for the first link that points at a repository (owner/repo on GitHub, GitLab or
// Bitbucket); null when there is none (a demo site, a write-up, a repo page deeper than owner/repo).
export function cloneCommand(links: { href: string }[]): string | null {
  for (const { href } of links) {
    try {
      const u = new URL(href);
      const parts = u.pathname.split("/").filter(Boolean);
      if (!REPO_HOSTS.has(u.hostname.replace(/^www\./, "")) || parts.length !== 2) continue;
      return `git clone https://${u.hostname.replace(/^www\./, "")}/${parts[0]}/${parts[1].replace(/\.git$/, "")}.git`;
    } catch {
      continue;
    }
  }
  return null;
}
