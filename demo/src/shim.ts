import list from "../../core/data/apps.json";
import { asText, cloneFiles, digests, frontMatter, indexSkills, nameProblem, plainPath, readText, search, skillFiles, template, validate, byteLength, type Files, type FileText, type Report, type Skill, type Tree } from "./model";
import { releases, sampleTree } from "./samples";
import { copyOf, load, save, type EditRec, type InstRec, type Origin, type Target } from "./store";
import { writeZip } from "./zip";

const OWN = "yours";
const OWN_BASE = "your own skill";
const REASON = "this demo carries sample skills and reads no network";
const AGENTS: Record<string, [string, string]> = { claude: ["Claude Code", ".claude/skills"], codex: ["Codex", ".agents/skills"], cursor: ["Cursor", ".cursor/skills"] };

const state = load();
const latest = sampleTree("latest");
const earlier = sampleTree("earlier");
const index = new Map<string, Tree>();
const skillsCache = new Map<string, Skill[]>();

type Current = { id: string; version: string; latest: string; earlier: string; tree: Tree; skills: Skill[] };

function currentOf(id: string): Current | null {
  const at = list.apps.findIndex((a) => a.id === id);
  if (at < 0) return null;
  const [top, prev] = releases(at);
  const pinned = state.pins[id] === prev ? prev : null;
  const version = pinned ?? top;
  const tree = (pinned ? earlier : latest).get(id) as Tree;
  const key = `${id}@${version}`;
  index.set(key, tree);
  let skills = skillsCache.get(key);
  if (!skills) {
    skills = indexSkills(tree);
    skillsCache.set(key, skills);
  }
  return { id, version, latest: top, earlier: prev, tree, skills };
}

function libraryApps(): Current[] {
  return list.apps.map((a) => currentOf(a.id) as Current);
}

function library() {
  return {
    catalogue: "sample skills bundled with the demo, not a signed catalogue",
    dev: false,
    dev_roots: [] as string[],
    apps: libraryApps().map((c) => ({
      id: c.id,
      source: { kind: "kept", channel: "stable", version: c.version, reason: REASON },
      skills: c.skills,
      releases: [c.latest, c.earlier],
      pin: state.pins[c.id] ?? null,
    })),
  };
}

const now = (): number => Math.floor(Date.now() / 1000);

function find(app: string, folder: string): EditRec | undefined {
  return state.edits.find((e) => e.app === app && e.folder === folder);
}

function need(app: string, folder: string): EditRec {
  const rec = find(app, folder);
  if (!rec) throw new Error(`there is no copy of ${folder}`);
  return rec;
}

function diff(before: Record<string, string>, after: Record<string, string>): string[] {
  const out = Object.keys(after).filter((p) => before[p] !== after[p]);
  out.push(...Object.keys(before).filter((p) => !(p in after)));
  return [...new Set(out)].sort();
}

function describe(rec: EditRec) {
  const name = frontMatter(asText(rec.files.get("SKILL.md") ?? "") ?? "").get("name") || rec.folder;
  const mine = digests(rec.files);
  const edited = diff(rec.digests, mine);
  const cur = rec.app === OWN ? null : currentOf(rec.app);
  let original = "not available";
  let changed: string[] = [];
  if (cur) {
    const there = cur.tree.get(rec.folder);
    if (there) {
      changed = diff(rec.digests, digests(there));
      original = `release ${cur.version}`;
    } else original = `release ${cur.version} (this skill is no longer in it)`;
  }
  return { app: rec.app, folder: rec.folder, name, base: rec.base, created: rec.created, updated: rec.updated, files: skillFiles(rec.files), edited, original, original_changed: changed };
}

function appFiles(app: string, folder: string): Files {
  const cur = currentOf(app);
  const files = cur?.tree.get(folder);
  if (!files) throw new Error(`${app} has no skill ${JSON.stringify(folder)}`);
  return files;
}

function download(name: string, bytes: Uint8Array): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function saved(stem: string, skills: [string, Files][]) {
  const entries: [string, string | Uint8Array][] = [];
  for (const [folder, files] of skills) for (const f of skillFiles(files)) entries.push([`${folder}/${f.path}`, files.get(f.path) as string | Uint8Array]);
  const bytes = writeZip(entries);
  const name = `${stem}.zip`;
  download(name, bytes);
  return { path: "your browser's downloads", name, skills: skills.length, files: entries.length, bytes: bytes.length };
}

function targetOf(agent: string, project: string | null): Target {
  if (!AGENTS[agent]) throw new Error(`there is no agent ${JSON.stringify(agent)}; use claude, codex or cursor`);
  const p = (project ?? "").trim();
  return { agent, project: p && p !== "~" ? p : null };
}

const describeTarget = (t: Target): string => (t.project ? `${AGENTS[t.agent][0]} in ${t.project}` : `${AGENTS[t.agent][0]} for you`);
const pathOf = (t: Target, folder: string): string => `${t.project ?? "~"}/${AGENTS[t.agent][1]}/${folder}`;
const sameTarget = (a: Target, b: Target): boolean => a.agent === b.agent && a.project === b.project;

function sourceOf(app: string, folder: string, copy: boolean): { files: Files; origin: Origin } {
  if (app === OWN || copy) {
    const rec = find(app, folder);
    if (!rec) throw new Error(`there is no ${app === OWN ? "skill of yours named" : "copy of"} ${folder}`);
    return { files: rec.files, origin: { kind: app === OWN ? "own" : "copy", app, version: rec.base } };
  }
  const cur = currentOf(app);
  if (!cur) throw new Error(`${app} is not in the library`);
  return { files: appFiles(app, folder), origin: { kind: "release", app, version: cur.version } };
}

function install(files: Files, folder: string, origin: Origin, target: Target): void {
  if (!files.has("SKILL.md")) throw new Error(`${folder} has no SKILL.md`);
  const rec: InstRec = { target, folder, origin, digests: digests(files), installed: now(), files: copyOf(files) };
  const at = state.installs.findIndex((r) => sameTarget(r.target, target) && r.folder === folder);
  if (at >= 0) state.installs[at] = rec;
  else state.installs.push(rec);
}

function installedRows() {
  const rows = state.installs.map((r) => {
    let update: string | null = null;
    if (r.origin.kind === "release") {
      const cur = currentOf(r.origin.app);
      if (cur && cur.version !== r.origin.version && cur.tree.has(r.folder)) update = cur.version;
    }
    return { target: r.target, folder: r.folder, origin: r.origin, installed: r.installed, path: pathOf(r.target, r.folder), where: describeTarget(r.target), state: "ok", changed: [] as string[], update };
  });
  rows.sort((a, b) => a.target.agent.localeCompare(b.target.agent) || (a.target.project ?? "").localeCompare(b.target.project ?? "") || a.folder.localeCompare(b.folder));
  return rows;
}

export function exportInstalls(): number {
  const entries: [string, string | Uint8Array][] = [];
  for (const r of state.installs) {
    const base = `${r.target.project ? `project${r.target.project.replace(/[^A-Za-z0-9._/-]/g, "_")}` : "home"}/${AGENTS[r.target.agent][1]}/${r.folder}`;
    for (const f of skillFiles(r.files)) entries.push([`${base}/${f.path}`, r.files.get(f.path) as string | Uint8Array]);
  }
  if (!entries.length) return 0;
  download("formskills-demo-installed.zip", writeZip(entries));
  return entries.length;
}

export function ownFolders(): string[] {
  return state.edits.filter((e) => e.app === OWN).map((e) => e.folder);
}

export function importOwn(wanted: string, files: Files): string {
  let folder = wanted.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "imported-skill";
  if (nameProblem(folder)) folder = "imported-skill";
  const taken = new Set(ownFolders());
  let unique = folder;
  for (let n = 2; taken.has(unique); n += 1) unique = `${folder.slice(0, 60)}-${n}`;
  state.edits.push({ app: OWN, folder: unique, base: OWN_BASE, digests: {}, created: now(), updated: now(), files: cloneFiles(files) });
  save(state);
  return unique;
}

function ownSkills(): Skill[] {
  const tree: Tree = new Map(state.edits.filter((e) => e.app === OWN).map((e) => [e.folder, e.files]));
  return indexSkills(tree);
}

async function handle(cmd: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const app = String(args.app ?? "");
  const skill = typeof args.skill === "string" ? args.skill : "";
  switch (cmd) {
    case "library":
    case "refresh":
      return library();
    case "refresh_app":
    case "pin": {
      const cur = currentOf(app);
      if (!cur) throw new Error(`${app} is not an app that ships skills`);
      if (cmd === "pin") {
        const v = typeof args.version === "string" ? args.version : "";
        if (v && v === cur.earlier) state.pins[app] = v;
        else delete state.pins[app];
        save(state);
      }
      return library();
    }
    case "check_skill":
      return validate(appFiles(app, skill), skill);
    case "edit_check":
      return validate(need(app, skill).files, skill) as Report;
    case "read_file": {
      const path = String(args.path ?? "");
      const at = path.indexOf("/");
      const folder = path.slice(0, at);
      const rel = path.slice(at + 1);
      if (at < 0 || !plainPath(path)) throw new Error(`${JSON.stringify(path)} is not a path inside the skills folder`);
      const files = app === OWN ? need(app, folder).files : appFiles(app, folder);
      return readText(files, rel);
    }
    case "edit_read":
      return readText(need(app, skill).files, String(args.path ?? "")) as FileText;
    case "edit_write": {
      const rec = need(app, skill);
      const path = String(args.path ?? "");
      const text = String(args.text ?? "");
      if (!plainPath(path) || !rec.files.has(path)) throw new Error(`${path} is not a file in the copy`);
      if (byteLength(text) > 2 * 1024 * 1024) throw new Error(`${path} would be larger than 2097152 bytes`);
      rec.files.set(path, text);
      rec.updated = now();
      save(state);
      return describe(rec);
    }
    case "edit_start": {
      const existing = find(app, skill);
      if (existing) return describe(existing);
      const cur = currentOf(app);
      const files = cur?.tree.get(skill);
      if (!cur || !files) throw new Error(`${app} has no skill ${JSON.stringify(skill)} to copy`);
      const rec: EditRec = { app, folder: skill, base: `release ${cur.version}`, digests: digests(files), created: now(), updated: now(), files: copyOf(files) };
      state.edits.push(rec);
      save(state);
      return describe(rec);
    }
    case "edits":
      return [...state.edits].sort((a, b) => a.app.localeCompare(b.app) || a.folder.localeCompare(b.folder)).map(describe);
    case "edit_seen": {
      const rec = need(app, skill);
      const cur = currentOf(app);
      const files = cur?.tree.get(skill);
      if (!cur || !files) throw new Error("the original is not available now");
      rec.digests = digests(files);
      rec.base = `release ${cur.version}`;
      save(state);
      return describe(rec);
    }
    case "edit_download": {
      const rec = need(app, skill);
      return saved(app === OWN ? skill : `${skill}-edited`, [[rec.folder, rec.files]]);
    }
    case "edit_discard": {
      need(app, skill);
      state.edits = state.edits.filter((e) => !(e.app === app && e.folder === skill));
      save(state);
      return null;
    }
    case "download": {
      const cur = currentOf(app);
      if (!cur) throw new Error("this app has no skills to download here");
      const name = list.apps.find((a) => a.id === app)?.name ?? app;
      const chosen = cur.skills.filter((s) => !skill || s.folder === skill).map((s): [string, Files] => [s.folder, cur.tree.get(s.folder) as Files]);
      if (!chosen.length) throw new Error(skill ? `${name} has no skill ${JSON.stringify(skill)}` : `${name} has no skills to download`);
      return saved(skill || `${name}-skills-v${cur.version}`, chosen);
    }
    case "own_list":
      return ownSkills();
    case "own_new": {
      const name = String(args.name ?? "");
      const why = nameProblem(name);
      if (why) throw new Error(why);
      if (find(OWN, name)) throw new Error(`you already have a skill named ${name}`);
      const rec: EditRec = { app: OWN, folder: name, base: OWN_BASE, digests: {}, created: now(), updated: now(), files: new Map([["SKILL.md", template(name, String(args.description ?? ""))]]) };
      state.edits.push(rec);
      save(state);
      return describe(rec);
    }
    case "search": {
      const apps = libraryApps().map((c) => ({ id: c.id, skills: c.skills, tree: c.tree }));
      return search(apps, String(args.query ?? ""));
    }
    case "install_skills": {
      const copy = args.copy === true;
      const agents = (args.agents as string[]) ?? [];
      const project = typeof args.project === "string" ? args.project : null;
      const folders = skill ? [skill] : (currentOf(app)?.skills.map((s) => s.folder) ?? []);
      if (!folders.length) throw new Error("there are no skills to install");
      if (!agents.length) throw new Error("choose at least one agent");
      const out: { folder: string; where: string; path: string | null; error: string | null }[] = [];
      for (const agent of agents) {
        const target = targetOf(agent, project);
        for (const folder of folders) {
          try {
            const src = sourceOf(app, folder, copy);
            install(src.files, folder, src.origin, target);
            out.push({ folder, where: describeTarget(target), path: pathOf(target, folder), error: null });
          } catch (e) {
            out.push({ folder, where: describeTarget(target), path: null, error: String(e instanceof Error ? e.message : e) });
          }
        }
      }
      save(state);
      return out;
    }
    case "installed":
      return installedRows();
    case "install_update": {
      const target = targetOf(String(args.agent ?? ""), (args.project as string | null) ?? null);
      const folder = String(args.skill ?? "");
      const rec = state.installs.find((r) => sameTarget(r.target, target) && r.folder === folder);
      if (!rec) throw new Error(`formskills did not install ${folder} for ${describeTarget(target)}`);
      const src = sourceOf(rec.origin.app, folder, rec.origin.kind === "copy");
      install(src.files, folder, src.origin, target);
      save(state);
      return null;
    }
    case "install_remove": {
      const target = targetOf(String(args.agent ?? ""), (args.project as string | null) ?? null);
      const folder = String(args.skill ?? "");
      const before = state.installs.length;
      state.installs = state.installs.filter((r) => !(sameTarget(r.target, target) && r.folder === folder));
      if (state.installs.length === before) throw new Error(`formskills did not install ${folder} for ${describeTarget(target)}; nothing was removed`);
      save(state);
      return null;
    }
    default:
      throw new Error(`the demo has no command ${cmd}`);
  }
}

(window as unknown as { __TAURI__: unknown }).__TAURI__ = { core: { invoke: handle } };
