import list from "../../core/data/apps.json";
import { renderMarkdown, splitFrontMatter } from "./markdown";

type App = (typeof list.apps)[number];

declare const __APP_VERSION__: string;

const STATES: Record<string, string> = { live: "Live", public: "Public", prelaunch: "Coming" };
const HERE = "Checking the app's latest release.";

type Source =
  | { kind: "release"; channel: string; version: string; downloaded: boolean }
  | { kind: "kept"; channel: string; version: string; reason: string }
  | { kind: "dev"; path: string }
  | { kind: "missing"; reason: string };
type SkillFile = { path: string; bytes: number; kind: string };
type Skill = { folder: string; name: string; description: string; files: SkillFile[] };
type AppSkills = { id: string; source: Source; skills: Skill[] };
type Library = { catalogue: string; dev: boolean; dev_roots: string[]; apps: AppSkills[] };
type Invoke = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

const invoke = (window as unknown as { __TAURI__?: { core?: { invoke?: Invoke } } }).__TAURI__?.core?.invoke;
const library = new Map<string, AppSkills>();

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function shortText(a: AppSkills): string {
  const s = a.source;
  if (s.kind === "release") return `${plural(a.skills.length, "skill")} · release ${s.version}${s.channel === "beta" ? " beta" : ""}`;
  if (s.kind === "kept") return `${plural(a.skills.length, "skill")} · kept ${s.version}`;
  if (s.kind === "dev") return `${plural(a.skills.length, "skill")} · checkout`;
  return "No released skills yet";
}

function longText(a: AppSkills): string {
  const s = a.source;
  if (s.kind === "release") return `${plural(a.skills.length, "skill")} from release ${s.version} (${s.channel}), digest checked${s.downloaded ? ", downloaded now" : ""}.`;
  if (s.kind === "kept") return `${plural(a.skills.length, "skill")} from release ${s.version}, kept from an earlier check. The latest could not be read: ${s.reason}`;
  if (s.kind === "dev") return `${plural(a.skills.length, "skill")} from the checkout at ${s.path} (dev mode, not a release).`;
  return `None to show: ${s.reason}`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function setText(node: Element | null, text: string): void {
  if (node && node.textContent !== text) node.textContent = text;
}

function chip(label: string, id: string): HTMLButtonElement {
  const b = el("button", "chip", label);
  b.type = "button";
  b.dataset.filter = id;
  b.setAttribute("aria-pressed", "false");
  if (id !== "all") b.translate = false;
  return b;
}

function card(app: App): HTMLLIElement {
  const li = el("li", "card");
  li.dataset.app = app.id;
  const button = el("button", "card-hit");
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  const head = el("span", "card-head");
  const name = el("span", "card-name", app.name);
  name.translate = false;
  head.append(name, el("span", "card-kind", app.kind));
  const foot = el("span", "card-foot");
  const where = el("span", "card-where", invoke ? "Checking the latest release" : "Not read in a browser");
  where.dataset.where = "";
  foot.append(where, el("span", `state state-${app.state}`, STATES[app.state] ?? app.state));
  button.append(head, el("span", "card-summary", app.summary), foot);
  li.append(button);
  return li;
}

const chipsBox = document.getElementById("chips") as HTMLDivElement;
const cardsBox = document.getElementById("cards") as HTMLUListElement;
const count = document.getElementById("count") as HTMLParagraphElement;
const empty = document.getElementById("detail-empty") as HTMLElement;
const detail = document.getElementById("detail-app") as HTMLElement;
const skillList = document.getElementById("skill-list") as HTMLUListElement;
const status = document.getElementById("status") as HTMLParagraphElement;
const refreshButton = document.getElementById("refresh") as HTMLButtonElement;

const chips = [chip("All", "all"), ...list.apps.map((a) => chip(a.name, a.id))];
chipsBox.append(...chips);
const cards = list.apps.map((app) => ({ app, node: card(app) }));
cardsBox.append(...cards.map((c) => c.node));

(document.getElementById("version") as HTMLElement).textContent = `v${__APP_VERSION__}`;
(document.getElementById("source") as HTMLElement).textContent = `List from ${list.source.repository} ${list.source.version} (${list.source.commit.slice(0, 7)})`;

let filter = "all";
let chosen = "";

function field(name: string): Element | null {
  return detail.querySelector(`[data-f="${name}"]`);
}

function showSkills(id: string): void {
  const found = library.get(id);
  setText(field("here"), found ? longText(found) : invoke ? HERE : "Open the formskills app to read the released skills.");
  const shown = skillList.dataset.app === id && skillList.dataset.count === String(found?.skills.length ?? -1);
  if (shown) return;
  skillList.dataset.app = id;
  skillList.dataset.count = String(found?.skills.length ?? -1);
  const items = (found?.skills ?? []).map((s) => {
    const li = el("li", "skill");
    const hit = el("button", "skill-hit");
    hit.type = "button";
    hit.title = `Read ${s.name}`;
    const head = el("span", "skill-head");
    const name = el("span", "skill-name", s.name);
    name.translate = false;
    const subs = s.files.filter((f) => f.kind === "sub-skill").length;
    const refs = s.files.filter((f) => f.kind === "reference").length;
    head.append(name, el("span", "skill-files", [plural(s.files.length, "file"), subs ? plural(subs, "sub-skill") : "", refs ? plural(refs, "reference") : ""].filter(Boolean).join(" · ")));
    hit.append(head, el("span", "skill-desc", s.description || "No description in its SKILL.md."));
    hit.addEventListener("click", () => openSkill(id, s.folder));
    li.append(hit);
    return li;
  });
  skillList.replaceChildren(...items);
}

const reader = document.getElementById("reader") as HTMLElement;
const readerName = document.getElementById("reader-name") as HTMLElement;
const readerFrom = document.getElementById("reader-from") as HTMLElement;
const filesNav = document.getElementById("files") as HTMLElement;
const doc = document.getElementById("doc") as HTMLElement;
const downloadApp = document.getElementById("download-app") as HTMLButtonElement;
const downloadSkill = document.getElementById("download-skill") as HTMLButtonElement;
const detailPane = document.getElementById("detail") as HTMLElement;
const GROUPS: [string, string][] = [["skill", "Skill"], ["sub-skill", "Sub-skills"], ["reference", "References"], ["file", "Other files"]];
let reading: { app: string; folder: string; path: string } | null = null;
let readSeq = 0;

function currentSkill(): Skill | undefined {
  return reading ? library.get(reading.app)?.skills.find((s) => s.folder === reading?.folder) : undefined;
}

function fileLabel(f: SkillFile): string {
  if (f.kind === "sub-skill") {
    const parts = f.path.split("/");
    return parts.length > 1 ? parts[parts.length - 2] : f.path;
  }
  const parts = f.path.split("/");
  return parts.length > 2 ? parts.slice(-2).join("/") : f.path;
}

function showFiles(skill: Skill): void {
  const nodes: HTMLElement[] = [];
  for (const [kind, title] of GROUPS) {
    const files = skill.files.filter((f) => f.kind === kind);
    if (!files.length) continue;
    nodes.push(el("p", "files-title", title));
    for (const f of files) {
      const b = el("button", "file", fileLabel(f));
      b.type = "button";
      b.title = f.path;
      b.dataset.path = f.path;
      b.translate = false;
      b.addEventListener("click", () => void openFile(f.path));
      nodes.push(b);
    }
  }
  filesNav.replaceChildren(...nodes);
}

function resolve(from: string, href: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) return null;
  const parts = from.split("/").slice(0, -1);
  for (const piece of href.split("#")[0].split("/")) {
    if (!piece || piece === ".") continue;
    if (piece === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else parts.push(piece);
  }
  return parts.join("/");
}

function wireLinks(skill: Skill, from: string): void {
  for (const link of doc.querySelectorAll<HTMLElement>(".fs-md-link")) {
    const target = resolve(from, link.dataset.href ?? "");
    if (target && skill.files.some((f) => f.path === target)) {
      link.classList.add("is-file");
      link.tabIndex = 0;
      link.setAttribute("role", "link");
      link.addEventListener("click", () => void openFile(target));
      link.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void openFile(target);
      });
    }
  }
}

async function openFile(path: string): Promise<void> {
  const skill = currentSkill();
  if (!reading || !skill || !invoke) return;
  reading.path = path;
  for (const b of filesNav.querySelectorAll<HTMLButtonElement>(".file")) b.setAttribute("aria-current", String(b.dataset.path === path));
  const seq = ++readSeq;
  const { app, folder } = reading;
  doc.replaceChildren(el("p", "doc-note", `Reading ${path}`));
  try {
    const file = (await invoke("read_file", { app, path: `${folder}/${path}` })) as { path: string; bytes: number; text: string | null; note: string | null };
    if (seq !== readSeq) return;
    const nodes: HTMLElement[] = [el("p", "doc-path", path)];
    if (file.text === null) {
      nodes.push(el("p", "doc-note", file.note ?? "Not shown here."));
    } else if (/\.md$/i.test(path)) {
      const { meta, body } = splitFrontMatter(file.text);
      if (meta.length) {
        const dl = el("dl", "doc-meta");
        for (const [k, v] of meta) dl.append(el("dt", "", k), el("dd", "", v));
        nodes.push(dl);
      }
      const md = el("div", "fs-md");
      md.append(...renderMarkdown(body));
      nodes.push(md);
    } else {
      const pre = el("pre", "doc-text");
      pre.textContent = file.text;
      nodes.push(pre);
    }
    doc.replaceChildren(...nodes);
    doc.scrollTop = 0;
    wireLinks(skill, path);
  } catch (e) {
    if (seq === readSeq) doc.replaceChildren(el("p", "doc-note", `Could not read ${path}: ${String(e)}`));
  }
}

function openSkill(app: string, folder: string): void {
  reading = { app, folder, path: "SKILL.md" };
  const skill = currentSkill();
  const found = library.get(app);
  if (!skill || !found) return;
  setText(readerName, skill.name);
  setText(readerFrom, `${list.apps.find((a) => a.id === app)?.name ?? app} · ${shortText(found)}`);
  showFiles(skill);
  if (!detail.hidden) detail.hidden = true;
  if (reader.hidden) reader.hidden = false;
  detailPane.classList.add("is-reading");
  void openFile("SKILL.md");
}

function closeReader(): void {
  reading = null;
  readSeq += 1;
  if (!reader.hidden) reader.hidden = true;
  detailPane.classList.remove("is-reading");
}

async function save(app: string, skill: string | null, button: HTMLButtonElement): Promise<void> {
  if (!invoke) return;
  button.disabled = true;
  try {
    const saved = (await invoke("download", { app, skill })) as { path: string; name: string; skills: number; files: number };
    setText(status, `Saved ${saved.name} (${plural(saved.skills, "skill")}, ${plural(saved.files, "file")}) to ${saved.path}`);
    status.title = saved.path;
  } catch (e) {
    setText(status, `Could not download: ${String(e)}`);
  } finally {
    button.disabled = false;
  }
}

downloadApp.addEventListener("click", () => void save(chosen, null, downloadApp));
downloadSkill.addEventListener("click", () => reading && void save(reading.app, reading.folder, downloadSkill));
(document.getElementById("back") as HTMLButtonElement).addEventListener("click", () => {
  closeReader();
  if (chosen) choose(chosen);
});

function showLibrary(lib: Library): void {
  library.clear();
  for (const a of lib.apps) library.set(a.id, a);
  for (const { app, node } of cards) {
    const found = library.get(app.id);
    const where = node.querySelector("[data-where]");
    setText(where, found ? shortText(found) : "Not read");
    where?.classList.toggle("is-missing", !found || found.source.kind === "missing");
  }
  if (chosen) showSkills(chosen);
  if (chosen) downloadApp.disabled = !(library.get(chosen)?.skills.length ?? 0);
  if (reading) {
    const skill = currentSkill();
    if (!skill) {
      closeReader();
      if (chosen) choose(chosen);
    } else {
      showFiles(skill);
      void openFile(skill.files.some((f) => f.path === reading?.path) ? reading.path : "SKILL.md");
    }
  }
  const total = lib.apps.reduce((n, a) => n + a.skills.length, 0);
  const withSkills = lib.apps.filter((a) => a.skills.length > 0).length;
  const mode = lib.dev ? `Dev mode: checkouts in ${lib.dev_roots.join(", ") || "no folder"} first, releases otherwise` : "Released skills only";
  setText(status, `${mode} · ${plural(total, "skill")} from ${withSkills} of ${lib.apps.length} apps · ${lib.catalogue}`);
  status.title = status.textContent ?? "";
}

async function load(cmd: "library" | "refresh"): Promise<void> {
  if (!invoke) return;
  refreshButton.disabled = true;
  setText(status, cmd === "refresh" ? "Checking every app's latest release again." : "Reading the family catalogue and each app's latest released skills.");
  try {
    showLibrary((await invoke(cmd)) as Library);
  } catch (e) {
    setText(status, `Could not read the skills: ${String(e)}`);
  } finally {
    refreshButton.disabled = false;
  }
}

function choose(id: string): void {
  chosen = id;
  const app = list.apps.find((a) => a.id === id);
  for (const { app: a, node } of cards) {
    const hit = node.firstElementChild as HTMLButtonElement;
    hit.setAttribute("aria-pressed", String(a.id === id));
  }
  if (reading && reading.app !== id) closeReader();
  if (!app) {
    if (empty.hidden) empty.hidden = false;
    if (!detail.hidden) detail.hidden = true;
    return;
  }
  downloadApp.disabled = !invoke || !(library.get(id)?.skills.length ?? 0);
  if (reading) return;
  setText(field("name"), app.name);
  setText(field("kind"), app.kind);
  setText(field("summary"), app.summary);
  setText(field("skills"), app.skills);
  setText(field("repository"), app.repository.replace(/^https:\/\//, ""));
  setText(field("state"), `${STATES[app.state] ?? app.state}${app.released ? "" : " · not released yet"}`);
  showSkills(app.id);
  if (!empty.hidden) empty.hidden = true;
  if (detail.hidden) detail.hidden = false;
}

function apply(next: string): void {
  filter = next;
  let shown = 0;
  for (const { app, node } of cards) {
    const visible = filter === "all" || app.id === filter;
    if (node.hidden === visible) node.hidden = !visible;
    if (visible) shown += 1;
  }
  for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.filter === filter));
  setText(count, filter === "all" ? `${list.apps.length} apps ship skills` : `${shown} of ${list.apps.length} apps`);
  if (filter !== "all") choose(filter);
  else if (chosen && !list.apps.some((a) => a.id === chosen)) choose("");
}

for (const c of chips) c.addEventListener("click", () => apply(c.dataset.filter ?? "all"));
chipsBox.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || chipsBox.scrollWidth <= chipsBox.clientWidth) return;
  e.preventDefault();
  chipsBox.scrollLeft += e.deltaY;
}, { passive: false });
for (const { app, node } of cards) node.firstElementChild?.addEventListener("click", () => choose(app.id));
apply("all");

if (invoke) {
  refreshButton.addEventListener("click", () => void load("refresh"));
  void load("library");
} else {
  setText(status, "Preview in a browser: open the formskills app to read the released skills.");
}

document.documentElement.classList.remove("booting");
