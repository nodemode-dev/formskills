export type Content = string | Uint8Array;
export type Files = Map<string, Content>;
export type Tree = Map<string, Files>;
export type SkillFile = { path: string; bytes: number; kind: string };
export type Summary = { errors: number; warnings: number };
export type Skill = { folder: string; name: string; description: string; license: string; check: Summary; scripts: number; files: SkillFile[] };
export type Finding = { level: "error" | "warning"; path: string; rule: string; message: string };
export type Field = { name: string; required: boolean; set: boolean; chars: number };
export type Report = { folder: string; name: string; license: string; fields: Field[]; errors: number; warnings: number; findings: Finding[]; spec: string };
export type FileText = { path: string; bytes: number; text: string | null; note: string | null };
export type Hit = { app: string; folder: string; name: string; description: string; score: number; matched: string[]; path: string; snippet: string };

export const SPEC = "https://agentskills.io/specification";
const NAME_MAX = 64;
const DESCRIPTION_MAX = 1024;
const COMPATIBILITY_MAX = 500;
const SKILL_LINES = 500;
const RESERVED = ["anthropic", "claude"];
const READ_LIMIT = 2 * 1024 * 1024;
const SKIP_DIRS = ["__pycache__", "node_modules", ".git"];
const SKIP_FILES = [".DS_Store", "Thumbs.db"];
const SCRIPT_ENDINGS = [".py", ".sh", ".bash", ".zsh", ".js", ".mjs", ".ts", ".ps1", ".bat", ".cmd", ".rb", ".pl"];

const encoder = new TextEncoder();
const strict = new TextDecoder("utf-8", { fatal: true });

export function toBytes(c: Content): Uint8Array {
  return typeof c === "string" ? encoder.encode(c) : c;
}

export function byteLength(c: Content): number {
  return typeof c === "string" ? encoder.encode(c).length : c.length;
}

export function asText(c: Content): string | null {
  if (typeof c === "string") return c;
  try {
    return strict.decode(c);
  } catch {
    return null;
  }
}

export function cloneFiles(files: Files): Files {
  return new Map([...files].map(([p, c]) => [p, typeof c === "string" ? c : c.slice()]));
}

export function digest(c: Content): string {
  const bytes = toBytes(c);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (const b of bytes) {
    h1 = Math.imul(h1 ^ b, 2654435761);
    h2 = Math.imul(h2 ^ b, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0") + bytes.length.toString(16);
}

export function digests(files: Files): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [p, c] of listFiles(files, true)) out[p] = digest(c);
  return out;
}

export function lines(text: string): string[] {
  const parts = text.split("\n");
  if (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts.map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
}

export function frontMatter(text: string): Map<string, string> {
  const found = new Map<string, string>();
  const all = lines(text);
  if (all.length === 0 || all[0].trim() !== "---") return found;
  let block: string | null = null;
  for (const line of all.slice(1)) {
    if (line.trim() === "---") break;
    const colon = line.indexOf(":");
    const key = colon > 0 ? line.slice(0, colon) : "";
    const startsKey = /^[A-Za-z_]/.test(line);
    if (colon > 0 && startsKey && /^[A-Za-z0-9_-]+$/.test(key)) {
      const value = line.slice(colon + 1).trim();
      if ([">", "|", ">-", "|-", ">+", "|+"].includes(value)) {
        found.set(key, "");
        block = key;
      } else {
        found.set(key, value.replace(/^["']+|["']+$/g, ""));
        block = null;
      }
    } else if (block !== null && line.trim()) {
      found.set(block, `${found.get(block) ?? ""} ${line.trim()}`.trim());
    }
  }
  return found;
}

function hasTag(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "<" && /[A-Za-z/]/.test(text[i + 1] ?? "") && text.indexOf(">", i) >= 0) return true;
  }
  return false;
}

function blockClosed(text: string): boolean | null {
  const all = lines(text);
  if (all.length === 0 || all[0].trim() !== "---") return null;
  return all.slice(1).some((l) => l.trim() === "---");
}

function linkTargets(text: string): string[] {
  const found: string[] = [];
  let fenced = false;
  for (const line of lines(text)) {
    if (line.trimStart().startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    let rest = line.split("`").filter((_, i) => i % 2 === 0).join(" ");
    for (;;) {
      const at = rest.indexOf("](");
      if (at < 0) break;
      const after = rest.slice(at + 2);
      const end = after.indexOf(")");
      if (end < 0) break;
      const target = (after.slice(0, end).trim().split(/\s+/)[0] ?? "").replace(/^[<>]+|[<>]+$/g, "");
      if (target) found.push(target);
      rest = after.slice(end);
    }
  }
  return found;
}

function resolve(from: string, target: string): string | null {
  const bare = target.split(/[#?]/)[0];
  if (!bare) return "";
  const parts = from.split("/");
  parts.pop();
  for (const piece of bare.split("/")) {
    if (piece === "" || piece === ".") continue;
    if (piece === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else parts.push(piece);
  }
  return parts.join("/");
}

function isOutside(target: string): boolean {
  const lower = target.toLowerCase();
  return target.startsWith("#") || lower.includes("://") || lower.startsWith("mailto:") || lower.startsWith("tel:");
}

export function kindOf(path: string): string {
  const name = path.split("/").pop() ?? path;
  if (path === "SKILL.md") return "skill";
  if (name === "SUB-SKILL.md" || name === "SKILL.md") return "sub-skill";
  if (name.toLowerCase().endsWith(".md")) return "reference";
  return "file";
}

export function isScript(path: string): boolean {
  const lower = path.toLowerCase();
  return SCRIPT_ENDINGS.some((e) => lower.endsWith(e));
}

function skipped(path: string): boolean {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  return parts.slice(0, -1).some((d) => SKIP_DIRS.includes(d)) || SKIP_FILES.includes(name) || name.endsWith(".pyc");
}

function compare(a: string, b: string): number {
  const x = a.split("/");
  const y = b.split("/");
  for (let i = 0; i < Math.min(x.length, y.length); i += 1) {
    if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return x.length - y.length;
}

export function listFiles(files: Files, withContent = false): [string, Content][] {
  const keep = [...files].filter(([p]) => !skipped(p));
  keep.sort((a, b) => compare(a[0], b[0]));
  return withContent ? keep : keep.map(([p, c]) => [p, c]);
}

export function skillFiles(files: Files): SkillFile[] {
  return listFiles(files).map(([path, c]) => ({ path, bytes: byteLength(c), kind: kindOf(path) }));
}

function nameFindings(name: string, folder: string, out: Finding[]): void {
  const error = (rule: string, message: string): void => void out.push({ level: "error", path: "SKILL.md", rule, message });
  if (!name) {
    error("name-required", "the front matter has no name; every skill needs one");
    return;
  }
  const chars = [...name].length;
  if (chars > NAME_MAX) error("name-length", `the name is ${chars} characters; at most ${NAME_MAX}`);
  if (!/^[a-z0-9-]*$/.test(name)) error("name-characters", `the name "${name}" may hold only lowercase letters, digits and hyphens`);
  if (name.startsWith("-") || name.endsWith("-")) error("name-hyphen-ends", `the name "${name}" must not start or end with a hyphen`);
  if (name.includes("--")) error("name-double-hyphen", `the name "${name}" must not hold two hyphens in a row`);
  if (name !== folder) error("name-folder", `the name "${name}" must match the skill's folder "${folder}"`);
  if (hasTag(name)) error("name-xml", "the name must not hold XML tags");
  const lower = name.toLowerCase();
  for (const word of RESERVED) if (lower.includes(word)) error("name-reserved", `Claude refuses a skill name holding the reserved word "${word}"`);
}

export function validate(files: Files, folder: string): Report {
  const findings: Finding[] = [];
  const card = files.get("SKILL.md");
  const text = card === undefined ? null : asText(card);
  if (text === null) findings.push({ level: "error", path: "SKILL.md", rule: "skill-file", message: "there is no readable SKILL.md in this folder" });
  const body = text ?? "";
  const closed = blockClosed(body);
  if (closed === null && text !== null) findings.push({ level: "error", path: "SKILL.md", rule: "front-matter", message: "SKILL.md must open with a front matter block: a line of three hyphens, the fields, and a closing line of three hyphens" });
  else if (closed === false) findings.push({ level: "error", path: "SKILL.md", rule: "front-matter", message: "the front matter block is never closed with a line of three hyphens" });
  const meta = frontMatter(body);
  const get = (key: string): string | undefined => meta.get(key)?.trim();
  const name = get("name") ?? "";
  const description = get("description") ?? "";
  nameFindings(name, folder, findings);
  const descriptionChars = [...description].length;
  if (!description) findings.push({ level: "error", path: "SKILL.md", rule: "description-required", message: "the front matter has no description; agents choose skills by it" });
  else {
    if (descriptionChars > DESCRIPTION_MAX) findings.push({ level: "error", path: "SKILL.md", rule: "description-length", message: `the description is ${descriptionChars} characters; at most ${DESCRIPTION_MAX}` });
    if (hasTag(description)) findings.push({ level: "error", path: "SKILL.md", rule: "description-xml", message: "the description must not hold XML tags" });
  }
  const compatibility = get("compatibility");
  if (compatibility !== undefined) {
    const chars = [...compatibility].length;
    if (chars === 0 || chars > COMPATIBILITY_MAX) findings.push({ level: "error", path: "SKILL.md", rule: "compatibility-length", message: `compatibility, when set, holds 1 to ${COMPATIBILITY_MAX} characters; it has ${chars}` });
  }
  const count = lines(body).length;
  if (count > SKILL_LINES) findings.push({ level: "warning", path: "SKILL.md", rule: "skill-lines", message: `SKILL.md is ${count} lines; the format suggests under ${SKILL_LINES}, with detail moved to reference files` });
  const listed = listFiles(files).map(([p, c]) => ({ path: p, bytes: byteLength(c), c }));
  for (const file of listed.filter((f) => f.path.toLowerCase().endsWith(".md") && f.bytes <= READ_LIMIT)) {
    const md = asText(file.c);
    if (md === null) continue;
    for (const target of linkTargets(md)) {
      if (isOutside(target)) continue;
      const wanted = resolve(file.path, target);
      const inside = wanted !== null;
      const found = wanted !== null && (wanted === "" || listed.some((f) => f.path === wanted || f.path.startsWith(`${wanted}/`)));
      if (!inside || !found) findings.push({ level: "warning", path: file.path, rule: "link", message: `the link to ${target} ${inside ? "is not a file in this skill" : "points outside this skill"}` });
    }
  }
  const fields: Field[] = [
    { name: "name", required: true, set: !!name, chars: [...name].length },
    { name: "description", required: true, set: !!description, chars: descriptionChars },
    { name: "license", required: false, set: meta.has("license"), chars: [...(get("license") ?? "")].length },
    { name: "compatibility", required: false, set: compatibility !== undefined, chars: [...(compatibility ?? "")].length },
    { name: "metadata", required: false, set: meta.has("metadata"), chars: 0 },
    { name: "allowed-tools", required: false, set: meta.has("allowed-tools"), chars: [...(get("allowed-tools") ?? "")].length },
  ];
  const errors = findings.filter((f) => f.level === "error").length;
  return { folder, name, license: get("license") ?? "", fields, errors, warnings: findings.length - errors, findings, spec: SPEC };
}

export function indexSkills(tree: Tree): Skill[] {
  const folders = [...tree.keys()].filter((n) => !n.startsWith(".")).sort();
  const skills: Skill[] = [];
  for (const folder of folders) {
    const files = tree.get(folder) as Files;
    const card = files.get("SKILL.md");
    const text = card === undefined ? null : asText(card);
    if (text === null) continue;
    const meta = frontMatter(text);
    const report = validate(files, folder);
    const listed = skillFiles(files);
    skills.push({
      folder,
      name: meta.get("name") || folder,
      description: meta.get("description") ?? "",
      license: meta.get("license") ?? "",
      check: { errors: report.errors, warnings: report.warnings },
      scripts: listed.filter((f) => isScript(f.path)).length,
      files: listed,
    });
  }
  return skills;
}

export function plainPath(path: string): boolean {
  return !!path && path.split("/").every((p) => p !== "" && p !== "." && p !== "..") && !path.startsWith("/") && !path.includes("\\");
}

export function readText(files: Files, rel: string): FileText {
  if (!plainPath(rel)) throw new Error(`${JSON.stringify(rel)} is not a path inside the skills folder`);
  const found = files.get(rel);
  if (found === undefined) throw new Error(`${rel} is not in these skills`);
  const bytes = byteLength(found);
  if (bytes > READ_LIMIT) return { path: rel, bytes, text: null, note: `${bytes} bytes, too large to show here; download the skill to open it` };
  const text = asText(found);
  if (text === null || text.includes("\0")) return { path: rel, bytes, text: null, note: `${bytes} bytes, not text; download the skill to open it` };
  return { path: rel, bytes, text, note: null };
}

export function words(query: string): string[] {
  const found: string[] = [];
  for (const raw of query.split(/\s+/)) {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase();
    if (word && !found.includes(word)) found.push(word);
  }
  return found;
}

function starts(hay: string, word: string): number {
  let n = 0;
  let from = 0;
  for (;;) {
    const at = hay.indexOf(word, from);
    if (at < 0) return n;
    const before = at > 0 ? hay[at - 1] : "";
    if (!before || !/[\p{L}\p{N}]/u.test(before)) n += 1;
    from = at + Math.max(word.length, 1);
  }
}

function searchBody(text: string): string {
  if (!text.startsWith("---")) return text;
  const rest = text.slice(3);
  const end = rest.indexOf("\n---");
  if (end < 0) return text;
  return rest.slice(end + 4).replace(/^[-\r\n]+/, "");
}

function snippet(line: string, word: string): string {
  const clean = line.trim().replace(/^[#\-*> ]+/, "");
  const chars = [...clean];
  if (chars.length <= 160) return clean;
  const at = clean.toLowerCase().indexOf(word);
  const start = Math.min(Math.max((at < 0 ? 0 : at) - 53, 0), chars.length);
  const end = Math.min(start + 160, chars.length);
  return `${start > 0 ? "..." : ""}${chars.slice(start, end).join("")}${end < chars.length ? "..." : ""}`;
}

export function search(apps: { id: string; skills: Skill[]; tree: Tree }[], query: string): Hit[] {
  const wanted = words(query);
  if (!wanted.length) return [];
  const hits: Hit[] = [];
  for (const app of apps) {
    for (const skill of app.skills) {
      const files = app.tree.get(skill.folder);
      if (!files) continue;
      const title = `${skill.name} ${skill.folder}`.toLowerCase();
      const about = skill.description.toLowerCase();
      const texts: [string, string][] = [];
      for (const f of skill.files) {
        if (!f.path.toLowerCase().endsWith(".md") || f.bytes > READ_LIMIT) continue;
        const c = files.get(f.path);
        const t = c === undefined ? null : asText(c);
        if (t !== null) texts.push([f.path, searchBody(t)]);
      }
      let score = 0;
      const matched: string[] = [];
      let first: [string, string] | null = null;
      let every = true;
      for (const word of wanted) {
        let here = 0;
        if (starts(title, word) > 0) {
          here += 8;
          if (!matched.includes("name")) matched.push("name");
        }
        if (starts(about, word) > 0) {
          here += 4;
          if (!matched.includes("description")) matched.push("description");
        }
        for (const [path, text] of texts) {
          const lower = text.toLowerCase();
          const count = starts(lower, word);
          if (count === 0) continue;
          here += Math.min(count, 5);
          if (!matched.includes("text")) matched.push("text");
          if (first === null) {
            const line = text.split("\n").find((l) => starts(l.toLowerCase(), word) > 0);
            if (line !== undefined) first = [path, snippet(line, word)];
          }
        }
        if (here === 0) {
          every = false;
          break;
        }
        score += here;
      }
      if (!every) continue;
      const [path, snip] = first ?? ["SKILL.md", ""];
      hits.push({ app: app.id, folder: skill.folder, name: skill.name, description: skill.description, score, matched, path, snippet: snip });
    }
  }
  hits.sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) || (a.app < b.app ? -1 : a.app > b.app ? 1 : 0));
  return hits.slice(0, 60);
}

export function nameProblem(name: string): string | null {
  const chars = [...name].length;
  if (chars === 0 || chars > 64) return "a skill name has 1 to 64 characters";
  if (!/^[a-z0-9-]+$/.test(name)) return "a skill name holds only lowercase letters, digits and hyphens";
  if (name.startsWith("-") || name.endsWith("-") || name.includes("--")) return "a skill name has no hyphen at either end and never two in a row";
  if (name.includes("anthropic") || name.includes("claude")) return 'Claude refuses skill names holding "anthropic" or "claude"';
  return null;
}

function title(name: string): string {
  return name.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export function template(name: string, description: string): string {
  const said = description.split(/\s+/).filter(Boolean).join(" ").replace(/"/g, "'") || "Says what this skill does and when an agent should use it, with the words a person would use.";
  return `---\nname: ${name}\ndescription: "${said}"\n---\n\n# ${title(name)}\n\nOne paragraph: what this skill is for, and what it is not for.\n\n## When to use\n\n- The person asks for ...\n- The task involves ...\n\n## Steps\n\n1. First ...\n2. Then ...\n3. Check the result by ...\n\n## Examples\n\nInput: ...\n\nOutput: ...\n\n## Notes\n\n- Edge cases and what to do about them.\n- Keep this file under 500 lines; put long reference material in a \`references/\` file and link it.\n`;
}
