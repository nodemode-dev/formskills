import list from "../../core/data/apps.json";

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
    const head = el("div", "skill-head");
    const name = el("span", "skill-name", s.name);
    name.translate = false;
    const subs = s.files.filter((f) => f.kind === "sub-skill").length;
    const refs = s.files.filter((f) => f.kind === "reference").length;
    head.append(name, el("span", "skill-files", [plural(s.files.length, "file"), subs ? plural(subs, "sub-skill") : "", refs ? plural(refs, "reference") : ""].filter(Boolean).join(" · ")));
    li.append(head, el("p", "skill-desc", s.description || "No description in its SKILL.md."));
    return li;
  });
  skillList.replaceChildren(...items);
}

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
  if (!app) {
    if (empty.hidden) empty.hidden = false;
    if (!detail.hidden) detail.hidden = true;
    return;
  }
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
for (const { app, node } of cards) node.firstElementChild?.addEventListener("click", () => choose(app.id));
apply("all");

if (invoke) {
  refreshButton.addEventListener("click", () => void load("refresh"));
  void load("library");
} else {
  setText(status, "Preview in a browser: open the formskills app to read the released skills.");
}

document.documentElement.classList.remove("booting");
