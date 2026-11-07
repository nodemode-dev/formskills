import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const VIRTUAL = "virtual:family-skills";
const RESOLVED = `\0${VIRTUAL}`;
const SKILLS = ".claude/skills";
const KEPT = 2;
const FILE_LIMIT = 2 * 1024 * 1024;

type Release = { version: string; skills: Record<string, Record<string, string>> };

function git(repo: string, args: string[]): string {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
}

function releaseAt(repo: string, tag: string): Release | null {
  const names = git(repo, ["ls-tree", "-r", "--name-only", "-z", tag, "--", SKILLS]).split("\0").filter(Boolean);
  const skills: Record<string, Record<string, string>> = {};
  for (const name of names) {
    const rest = name.slice(SKILLS.length + 1);
    const at = rest.indexOf("/");
    if (at < 0 || rest.endsWith(".gitkeep")) continue;
    const text = git(repo, ["show", `${tag}:${name}`]);
    if (text.length > FILE_LIMIT || text.includes("\0")) continue;
    (skills[rest.slice(0, at)] ??= {})[rest.slice(at + 1)] = text;
  }
  return Object.keys(skills).some((folder) => skills[folder]["SKILL.md"] !== undefined) ? { version: tag.replace(/^v/, ""), skills } : null;
}

export function familySkills(): Plugin {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const family = process.env.FORM_FAMILY_DIR ?? root;
  const apps = JSON.parse(readFileSync(new URL("../core/data/apps.json", import.meta.url), "utf-8")) as { apps: { repository: string }[] };
  return {
    name: "formskills-family-skills",
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : null;
    },
    load(id) {
      if (id !== RESOLVED) return null;
      const out: Record<string, Release[]> = {};
      for (const app of apps.apps) {
        const name = app.repository.split("/").pop() as string;
        const repo = `${family}${name}`;
        if (out[name] || !existsSync(`${repo}/.git`)) continue;
        const releases: Release[] = [];
        for (const tag of git(repo, ["tag", "--sort=-v:refname"]).split("\n").filter(Boolean)) {
          const found = releaseAt(repo, tag);
          if (found) releases.push(found);
          if (releases.length === KEPT) break;
        }
        if (releases.length) out[name] = releases;
      }
      return `export default ${JSON.stringify(out)};`;
    },
  };
}
