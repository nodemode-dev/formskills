import list from "../../core/data/apps.json";
import { renderMarkdown, splitFrontMatter } from "./markdown";

type App = (typeof list.apps)[number];

declare const __APP_VERSION__: string;

const STATES: Record<string, string> = { live: "Live", public: "Public", prelaunch: "Coming" };
const HERE = "Checking the app's latest release.";

type Source =
  | { kind: "release"; channel: string; version: string; downloaded: boolean; pinned: boolean; latest: string }
  | { kind: "kept"; channel: string; version: string; reason: string }
  | { kind: "dev"; path: string }
  | { kind: "missing"; reason: string };
type SkillFile = { path: string; bytes: number; kind: string };
type Summary = { errors: number; warnings: number };
type Skill = { folder: string; name: string; description: string; license: string; check: Summary; scripts: number; files: SkillFile[] };
type Hit = { app: string; folder: string; name: string; description: string; score: number; matched: string[]; path: string; snippet: string };
type Finding = { level: "error" | "warning"; path: string; rule: string; message: string };
type Field = { name: string; required: boolean; set: boolean; chars: number };
type Report = { folder: string; name: string; license: string; fields: Field[]; errors: number; warnings: number; findings: Finding[]; spec: string };
type AppSkills = { id: string; source: Source; skills: Skill[]; releases: string[]; pin: string | null };
const OWN = "yours";
type Library = { catalogue: string; dev: boolean; dev_roots: string[]; apps: AppSkills[] };
type Invoke = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

const invoke = (window as unknown as { __TAURI__?: { core?: { invoke?: Invoke } } }).__TAURI__?.core?.invoke;
const library = new Map<string, AppSkills>();

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function shortText(a: AppSkills): string {
  const s = a.source;
  if (s.kind === "release") return `${plural(a.skills.length, "skill")} · ${s.pinned ? "pinned " : "release "}${s.version}${s.channel === "beta" ? " beta" : ""}${s.pinned && s.latest !== s.version ? ` (${s.latest} out)` : ""}`;
  if (s.kind === "kept") return `${plural(a.skills.length, "skill")} · kept ${s.version}`;
  if (s.kind === "dev") return `${plural(a.skills.length, "skill")} · checkout`;
  return "No released skills yet";
}

function longText(a: AppSkills): string {
  const s = a.source;
  if (s.kind === "release") return `${plural(a.skills.length, "skill")} from release ${s.version} (${s.channel}), signed and checked${s.downloaded ? ", downloaded now" : ""}${s.pinned ? ", pinned" : ""}.`;
  if (s.kind === "kept") return `${plural(a.skills.length, "skill")} from release ${s.version}, kept from an earlier check. The latest could not be read: ${s.reason}`;
  if (s.kind === "dev") return `${plural(a.skills.length, "skill")} from the checkout at ${s.path} (dev mode, not a release).`;
  return `None to show: ${s.reason}`;
}

function checkText(c: Summary): string {
  if (c.errors) return `${plural(c.errors, "format error")}${c.warnings ? `, ${plural(c.warnings, "note")}` : ""}`;
  if (c.warnings) return `Format check passed, ${plural(c.warnings, "note")}`;
  return "Format check passed";
}

function licenceText(app: string, skill: Skill): string {
  if (skill.license) return `Licence ${skill.license}`;
  if (app === OWN) return "Your licence: add license to its front matter";
  const own = list.apps.find((a) => a.id === app)?.licence;
  return own ? `Licence ${own} (the app's)` : "No licence named";
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

const topicChips = list.topics.filter((t) => list.apps.some((a) => a.topic === t)).map((t) => {
  const c = chip(t, `topic:${t}`);
  c.classList.add("chip-topic");
  c.title = `Apps for ${t.toLowerCase()}`;
  return c;
});
const appChips = list.apps.map((a) => chip(a.name, a.id));
const chips = [chip("All", "all"), ...topicChips, ...appChips];
const sep = el("span", "chip-sep");
sep.setAttribute("aria-hidden", "true");
chipsBox.append(chips[0], ...topicChips, sep, ...appChips);
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
  const version = found?.source.kind === "release" || found?.source.kind === "kept" ? found.source.version : "";
  const marks = version + "|" + (found?.skills ?? []).map((s) => `${s.folder}:${editMark(id, s.folder)}:${s.check.errors}.${s.check.warnings}:${s.license}:${s.scripts}:${s.description.length}`).join("|");
  const shown = skillList.dataset.app === id && skillList.dataset.count === String(found?.skills.length ?? -1) && skillList.dataset.marks === marks;
  if (shown) return;
  skillList.dataset.app = id;
  skillList.dataset.count = String(found?.skills.length ?? -1);
  skillList.dataset.marks = marks;
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
    const mark = editMark(id, s.folder);
    if (mark) {
      const badge = el("span", `skill-mark${mark === "updated" ? " is-updated" : ""}`, mark === "updated" ? "Your copy · original updated" : "Your copy");
      head.append(badge);
    }
    const meta = el("span", "skill-meta");
    meta.append(el("span", "", licenceText(id, s)), el("span", s.check.errors ? "is-fault" : "", checkText(s.check)));
    if (s.scripts) meta.append(el("span", "is-note", `Holds ${plural(s.scripts, "script")} an agent may run`));
    hit.append(head, el("span", "skill-desc", s.description || "No description in its SKILL.md."), meta);
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

type Edit = { app: string; folder: string; name: string; base: string; created: number; updated: number; files: SkillFile[]; edited: string[]; original: string; original_changed: string[] };
type FileText = { path: string; bytes: number; text: string | null; note: string | null };
const editsMap = new Map<string, Edit>();
const editKey = (app: string, folder: string): string => `${app}/${folder}`;
const readerBody = reader.querySelector(".reader-body") as HTMLElement;
const editBar = document.getElementById("edit-bar") as HTMLElement;
const saveState = document.getElementById("save-state") as HTMLElement;
const flag = document.getElementById("flag") as HTMLElement;
const flagText = document.getElementById("flag-text") as HTMLElement;
const seenButton = document.getElementById("seen") as HTMLButtonElement;
const downloadCopy = document.getElementById("download-copy") as HTMLButtonElement;
const discardButton = document.getElementById("discard") as HTMLButtonElement;
const editToggle = document.getElementById("edit-toggle") as HTMLButtonElement;
const editorWrap = document.getElementById("editor-wrap") as HTMLElement;
const editor = document.getElementById("editor") as HTMLTextAreaElement;
const side = document.getElementById("side") as HTMLElement;
const tabPreview = document.getElementById("tab-preview") as HTMLButtonElement;
const tabOriginal = document.getElementById("tab-original") as HTMLButtonElement;
const previewView = document.getElementById("preview") as HTMLElement;
const originalView = document.getElementById("original") as HTMLElement;
let editing = false;
let editPath = "";
let dirty = false;
let saving: Promise<void> | null = null;
let saveTimer = 0;
let previewTimer = 0;
let editSeq = 0;
let discardArmed = 0;

const checkButton = document.getElementById("check-skill") as HTMLButtonElement;
const findingsBox = document.getElementById("findings") as HTMLElement;
const findingsSum = document.getElementById("findings-sum") as HTMLElement;
const findingsFields = document.getElementById("findings-fields") as HTMLElement;
const findingsList = document.getElementById("findings-list") as HTMLUListElement;
const LIMITS: Record<string, number> = { name: 64, description: 1024, compatibility: 500 };
let checkOpen = false;
let checkSeq = 0;

function renderReport(r: Report | null, note = ""): void {
  findingsBox.classList.toggle("is-fault", !!r && r.errors > 0);
  if (!r) {
    setText(findingsSum, note);
    setText(findingsFields, "");
    findingsList.replaceChildren();
    return;
  }
  const whose = reading?.app === OWN ? "Your skill" : editing ? "Your copy" : "This skill";
  setText(findingsSum, r.errors ? `${whose}: ${plural(r.errors, "format error")}${r.warnings ? ` and ${plural(r.warnings, "note")}` : ""}` : `${whose} passes the format check${r.warnings ? `, with ${plural(r.warnings, "note")}` : ""}`);
  const fields = r.fields.filter((f) => f.required || f.set).map((f) => {
    if (!f.set) return `${f.name} missing`;
    const most = LIMITS[f.name];
    return most ? `${f.name} ${f.chars} of ${most}` : `${f.name} set`;
  });
  setText(findingsFields, `Fields: ${fields.join(" · ")}`);
  const items = r.findings.map((f) => {
    const li = el("li", `finding is-${f.level}`);
    const where = el("button", "finding-path", f.path);
    where.type = "button";
    where.title = `Open ${f.path}`;
    where.translate = false;
    where.addEventListener("click", () => void (editing ? openEditFile(f.path) : openFile(f.path)));
    li.append(el("span", "finding-level", f.level === "error" ? "Error" : "Note"), where, el("span", "finding-text", f.message));
    return li;
  });
  findingsList.replaceChildren(...items);
}

async function runCheck(): Promise<void> {
  if (!reading || !invoke) return;
  const { app, folder } = reading;
  const seq = ++checkSeq;
  if (!findingsSum.textContent) setText(findingsSum, "Checking against the skill format");
  try {
    const r = (await invoke(editing ? "edit_check" : "check_skill", { app, skill: folder })) as Report;
    if (seq === checkSeq) renderReport(r);
  } catch (e) {
    if (seq === checkSeq) renderReport(null, `Could not check: ${String(e)}`);
  }
}

checkButton.addEventListener("click", () => {
  checkOpen = !checkOpen;
  updateControls();
  if (checkOpen) void runCheck();
});

function editMark(app: string, folder: string): "" | "copy" | "updated" {
  const e = editsMap.get(editKey(app, folder));
  if (!e) return "";
  return e.original_changed.length ? "updated" : "copy";
}

function show(node: HTMLElement, on: boolean): void {
  if (node.hidden === on) node.hidden = !on;
}

function renderInto(target: HTMLElement, path: string, file: FileText | null, note = ""): void {
  const nodes: HTMLElement[] = [];
  if (!file || file.text === null) {
    nodes.push(el("p", "doc-note", note || file?.note || "Not shown here."));
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
  target.replaceChildren(...nodes);
}

function clockNow(): string {
  return clock(Date.now());
}

function clock(t: number): string {
  const d = new Date(t);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

function updateControls(): void {
  if (!reading) return;
  const copy = editsMap.get(editKey(reading.app, reading.folder));
  const updated = (copy?.original_changed.length ?? 0) > 0;
  setText(editToggle, editing ? "Show original" : copy ? (updated ? "Your copy (original updated)" : "Edit your copy") : "Edit a copy");
  editToggle.disabled = !invoke;
  show(editToggle, reading.app !== OWN);
  setText(downloadCopy, reading.app === OWN ? "Download skill" : "Download your copy");
  checkButton.disabled = !invoke;
  checkButton.setAttribute("aria-pressed", String(checkOpen));
  show(checkButton, !editing);
  show(findingsBox, editing || checkOpen);
  show(editBar, editing);
  readerBody.classList.toggle("is-editing", editing);
  detailPane.classList.toggle("is-editing", editing);
  show(doc, !editing);
  show(editorWrap, editing);
  show(side, editing);
  show(flag, editing && updated);
  if (copy && updated) {
    const list = copy.original_changed.slice(0, 3).join(", ") + (copy.original_changed.length > 3 ? ` and ${copy.original_changed.length - 3} more` : "");
    setText(flagText, `The original (${copy.original}) changed since your copy: ${list}`);
    flagText.title = copy.original_changed.join("\n");
  }
}

function markEdited(): void {
  if (!reading) return;
  const copy = editsMap.get(editKey(reading.app, reading.folder));
  for (const b of filesNav.querySelectorAll<HTMLButtonElement>(".file")) {
    b.classList.toggle("is-edited", editing && !!copy?.edited.includes(b.dataset.path ?? ""));
    b.classList.toggle("is-upstream", editing && !!copy?.original_changed.includes(b.dataset.path ?? ""));
  }
}

function setSave(text: string, fault = false): void {
  setText(saveState, text);
  saveState.classList.toggle("is-fault", fault);
}

async function saveNow(): Promise<void> {
  window.clearTimeout(saveTimer);
  if (saving) await saving;
  if (!dirty || !reading || !invoke) return;
  const { app, folder } = reading;
  const path = editPath;
  const text = editor.value;
  dirty = false;
  setSave("Saving");
  saving = (async () => {
    try {
      const copy = (await invoke("edit_write", { app, skill: folder, path, text })) as Edit;
      editsMap.set(editKey(app, folder), copy);
      if (!dirty) setSave(`Saved ${clockNow()}`);
      markEdited();
      updateControls();
      void runCheck();
    } catch (e) {
      dirty = true;
      setSave(`Could not save: ${String(e)}`, true);
    } finally {
      saving = null;
    }
  })();
  await saving;
}

function renderPreview(): void {
  renderInto(previewView, editPath, { path: editPath, bytes: editor.value.length, text: editor.value, note: null });
}

async function loadOriginal(path: string): Promise<void> {
  const skill = currentSkill();
  if (!reading || !invoke) return;
  if (!skill?.files.some((f) => f.path === path)) {
    renderInto(originalView, path, null, "This file is not in the original.");
    return;
  }
  const seq = editSeq;
  try {
    const file = (await invoke("read_file", { app: reading.app, path: `${reading.folder}/${path}` })) as FileText;
    if (seq === editSeq) renderInto(originalView, path, file);
  } catch (e) {
    if (seq === editSeq) renderInto(originalView, path, null, `Could not read the original: ${String(e)}`);
  }
}

async function openEditFile(path: string): Promise<void> {
  if (!reading || !invoke) return;
  await saveNow();
  editPath = path;
  reading.path = path;
  const seq = ++editSeq;
  for (const b of filesNav.querySelectorAll<HTMLButtonElement>(".file")) b.setAttribute("aria-current", String(b.dataset.path === path));
  editor.disabled = true;
  try {
    const file = (await invoke("edit_read", { app: reading.app, skill: reading.folder, path })) as FileText;
    if (seq !== editSeq) return;
    editor.value = file.text ?? "";
    editor.disabled = file.text === null;
    editor.placeholder = file.text === null ? (file.note ?? "Not text") : "";
    dirty = false;
    setSave(file.text === null ? "This file is not text; it is kept as it is" : "Saved");
    renderPreview();
    void loadOriginal(path);
  } catch (e) {
    if (seq === editSeq) setSave(`Could not open your copy: ${String(e)}`, true);
  }
}

async function enterEdit(): Promise<void> {
  if (!reading || !invoke) return;
  const { app, folder } = reading;
  let copy = editsMap.get(editKey(app, folder));
  if (!copy) {
    editToggle.disabled = true;
    try {
      copy = (await invoke("edit_start", { app, skill: folder })) as Edit;
      editsMap.set(editKey(app, folder), copy);
      setText(status, `Made your copy of ${copy.name}. The original stays as released.`);
      if (chosen) showSkills(chosen);
    } catch (e) {
      editToggle.disabled = false;
      setText(status, `Could not make a copy: ${String(e)}`);
      return;
    }
  }
  editing = true;
  showFiles({ folder, name: copy.name, description: "", license: "", check: { errors: 0, warnings: 0 }, scripts: 0, files: copy.files });
  updateControls();
  void runCheck();
  markEdited();
  const start = copy.files.some((f) => f.path === reading?.path) ? reading.path : "SKILL.md";
  await openEditFile(start);
  editor.focus();
}

async function leaveEdit(save = true): Promise<void> {
  if (save) await saveNow();
  editing = false;
  editSeq += 1;
  const skill = currentSkill();
  updateControls();
  if (checkOpen) void runCheck();
  if (skill && reading) {
    showFiles(skill);
    void openFile(skill.files.some((f) => f.path === reading?.path) ? reading.path : "SKILL.md");
  }
}

async function loadEdits(): Promise<void> {
  if (!invoke) return;
  try {
    const list = (await invoke("edits")) as Edit[];
    editsMap.clear();
    for (const e of list) editsMap.set(editKey(e.app, e.folder), e);
    if (chosen) showSkills(chosen);
    updateControls();
    markEdited();
  } catch {
    return;
  }
}

function selectTab(original: boolean): void {
  tabPreview.setAttribute("aria-selected", String(!original));
  tabOriginal.setAttribute("aria-selected", String(original));
  show(previewView, !original);
  show(originalView, original);
}

editor.addEventListener("input", () => {
  dirty = true;
  setSave("Unsaved changes");
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(renderPreview, 150);
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void saveNow(), 800);
});
editor.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    void saveNow();
  }
});
tabPreview.addEventListener("click", () => selectTab(false));
tabOriginal.addEventListener("click", () => selectTab(true));
editToggle.addEventListener("click", () => void (editing ? leaveEdit() : enterEdit()));
seenButton.addEventListener("click", async () => {
  if (!reading || !invoke) return;
  seenButton.disabled = true;
  try {
    const copy = (await invoke("edit_seen", { app: reading.app, skill: reading.folder })) as Edit;
    editsMap.set(editKey(copy.app, copy.folder), copy);
    setText(status, `Your copy of ${copy.name} now follows the original from ${copy.base}. Your text was not changed.`);
    updateControls();
    markEdited();
    if (chosen) showSkills(chosen);
  } catch (e) {
    setText(status, `Could not mark as seen: ${String(e)}`);
  } finally {
    seenButton.disabled = false;
  }
});
downloadCopy.addEventListener("click", async () => {
  if (!reading || !invoke) return;
  await saveNow();
  downloadCopy.disabled = true;
  try {
    const saved = (await invoke("edit_download", { app: reading.app, skill: reading.folder })) as { path: string; name: string; files: number };
    setText(status, `Saved ${saved.name} (your copy, ${plural(saved.files, "file")}) to ${saved.path}`);
    status.title = saved.path;
  } catch (e) {
    setText(status, `Could not download your copy: ${String(e)}`);
  } finally {
    downloadCopy.disabled = false;
  }
});
discardButton.addEventListener("click", async () => {
  if (!reading || !invoke) return;
  if (Date.now() > discardArmed) {
    discardArmed = Date.now() + 4000;
    setText(discardButton, "Click again to discard");
    window.setTimeout(() => {
      if (Date.now() >= discardArmed) setText(discardButton, "Discard copy");
    }, 4100);
    return;
  }
  discardArmed = 0;
  setText(discardButton, "Discard copy");
  const { app, folder } = reading;
  window.clearTimeout(saveTimer);
  dirty = false;
  try {
    await invoke("edit_discard", { app, skill: folder });
    editsMap.delete(editKey(app, folder));
    if (app === OWN) {
      editing = false;
      closeReader();
      setText(status, `Your skill ${folder} was deleted.`);
      await loadOwn();
      choose(OWN);
      return;
    }
    setText(status, "Your copy was deleted. The original is as released.");
    await leaveEdit(false);
    if (chosen) showSkills(chosen);
  } catch (e) {
    setText(status, `Could not discard: ${String(e)}`);
  }
});
window.addEventListener("beforeunload", () => void saveNow());

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
      b.addEventListener("click", () => void (editing ? openEditFile(f.path) : openFile(f.path)));
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
  editing = false;
  editSeq += 1;
  checkOpen = false;
  checkSeq += 1;
  renderReport(null);
  reading = { app, folder, path: "SKILL.md" };
  const skill = currentSkill();
  const found = library.get(app);
  if (!skill || !found) return;
  setText(readerName, skill.name);
  setText(readerFrom, app === OWN ? "Your own skill · kept in formskills' folder" : `${list.apps.find((a) => a.id === app)?.name ?? app} · ${shortText(found)}${skill.scripts ? ` · holds ${plural(skill.scripts, "script")}` : ""}`);
  showFiles(skill);
  if (!detail.hidden) detail.hidden = true;
  if (reader.hidden) reader.hidden = false;
  detailPane.classList.add("is-reading");
  updateControls();
  void openFile("SKILL.md");
}

function closeReader(): void {
  if (editing) void saveNow();
  editing = false;
  editSeq += 1;
  reading = null;
  readSeq += 1;
  if (!reader.hidden) reader.hidden = true;
  detailPane.classList.remove("is-reading", "is-editing");
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
  if (hits && searchBox.value.trim().length >= 2) {
    setOverlay("results");
    renderHits();
  } else if (chosen) choose(chosen);
});

function showLibrary(lib: Library): void {
  library.clear();
  for (const a of lib.apps) library.set(a.id, a);
  library.set(OWN, { id: OWN, source: { kind: "missing", reason: "your own skills" }, skills: ownSkills, releases: [], pin: null });
  if (chosen && chosen !== OWN) showRelease(chosen);
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
    } else if (!editing) {
      showFiles(skill);
      void openFile(skill.files.some((f) => f.path === reading?.path) ? reading.path : "SKILL.md");
    }
  }
  void loadEdits();
  if (overlay === "results") void runSearch();
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
  ownCard.setAttribute("aria-pressed", String(id === OWN));
  if (reading && reading.app !== id) closeReader();
  if (id === OWN) {
    if (reading) return;
    show(empty, false);
    show(detail, false);
    show(detailOwn, true);
    showOwn();
    return;
  }
  show(detailOwn, false);
  if (!app) {
    if (empty.hidden) empty.hidden = false;
    if (!detail.hidden) detail.hidden = true;
    return;
  }
  downloadApp.disabled = !invoke || !(library.get(id)?.skills.length ?? 0);
  showRelease(id);
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

const ownCard = document.getElementById("own-card") as HTMLButtonElement;
const ownCount = document.getElementById("own-count") as HTMLElement;
const detailOwn = document.getElementById("detail-own") as HTMLElement;
const ownForm = document.getElementById("own-form") as HTMLFormElement;
const ownName = document.getElementById("own-name") as HTMLInputElement;
const ownDescription = document.getElementById("own-description") as HTMLInputElement;
const ownCreate = document.getElementById("own-create") as HTMLButtonElement;
const ownNote = document.getElementById("own-note") as HTMLElement;
const ownList = document.getElementById("own-list") as HTMLUListElement;
const releasePick = document.getElementById("release-pick") as HTMLSelectElement;
const updateApp = document.getElementById("update-app") as HTMLButtonElement;
const releaseNote = document.getElementById("release-note") as HTMLElement;
const OWN_HINT = "Lowercase letters, digits and hyphens; the name becomes the skill's folder.";
let ownSkills: Skill[] = [];

function nameProblem(name: string): string {
  if (!name) return OWN_HINT;
  if (name.length > 64) return "At most 64 characters.";
  if (!/^[a-z0-9-]+$/.test(name)) return "Only lowercase letters, digits and hyphens.";
  if (name.startsWith("-") || name.endsWith("-") || name.includes("--")) return "No hyphen at either end, and never two in a row.";
  if (name.includes("anthropic") || name.includes("claude")) return "Claude refuses names holding \"anthropic\" or \"claude\".";
  if (ownSkills.some((s) => s.folder === name)) return `You already have ${name}.`;
  return "";
}

function showOwn(): void {
  const key = ownSkills.map((s) => `${s.folder}:${s.check.errors}.${s.check.warnings}:${s.description.length}`).join("|");
  if (ownList.dataset.key === key) return;
  ownList.dataset.key = key;
  const items = ownSkills.map((s) => {
    const li = el("li", "skill");
    const hit = el("button", "skill-hit");
    hit.type = "button";
    hit.title = `Edit ${s.name}`;
    const head = el("span", "skill-head");
    const name = el("span", "skill-name", s.name);
    name.translate = false;
    head.append(name, el("span", "skill-files", plural(s.files.length, "file")));
    const meta = el("span", "skill-meta");
    meta.append(el("span", "", licenceText(OWN, s)), el("span", s.check.errors ? "is-fault" : "", checkText(s.check)));
    hit.append(head, el("span", "skill-desc", s.description || "No description yet."), meta);
    hit.addEventListener("click", () => void openOwn(s.folder));
    li.append(hit);
    return li;
  });
  if (!items.length) items.push(el("li", "own-empty", invoke ? "No skills of your own yet. Name one above to start from the template." : "Open the formskills app to write skills of your own."));
  ownList.replaceChildren(...items);
}

async function loadOwn(): Promise<void> {
  if (!invoke) return;
  try {
    ownSkills = (await invoke("own_list")) as Skill[];
    library.set(OWN, { id: OWN, source: { kind: "missing", reason: "your own skills" }, skills: ownSkills, releases: [], pin: null });
    setText(ownCount, ownSkills.length ? `${plural(ownSkills.length, "skill")} of yours` : "None yet");
    if (chosen === OWN && !reading) showOwn();
  } catch {
    return;
  }
}

function stageOwn(folder: string): void {
  chosen = OWN;
  checkOpen = false;
  checkSeq += 1;
  editSeq += 1;
  renderReport(null, "Checking against the skill format");
  reading = { app: OWN, folder, path: "SKILL.md" };
  editing = true;
  setText(readerName, folder);
  setText(readerFrom, "Your own skill · kept in formskills' folder");
  filesNav.replaceChildren();
  editor.value = "";
  editor.disabled = true;
  previewView.replaceChildren();
  originalView.replaceChildren(el("p", "doc-note", "Your own skill has no released original."));
  setSave("Opening");
  show(empty, false);
  show(detail, false);
  show(detailOwn, false);
  show(reader, true);
  detailPane.classList.add("is-reading");
  updateControls();
}

async function openOwn(folder: string, staged = false): Promise<void> {
  if (!invoke) return;
  if (!staged) stageOwn(folder);
  await loadOwn();
  if (!editsMap.has(editKey(OWN, folder))) await loadEdits();
  if (!reading || reading.app !== OWN || reading.folder !== folder) return;
  await enterEdit();
}

ownName.addEventListener("input", () => {
  const why = nameProblem(ownName.value.trim());
  setText(ownNote, why || "Ready: New skill writes SKILL.md from the template and opens it for editing.");
  ownNote.classList.toggle("is-fault", !!why && why !== OWN_HINT);
  ownCreate.disabled = !invoke || !!why;
});
ownForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = ownName.value.trim();
  if (!invoke || nameProblem(name)) return;
  ownCreate.disabled = true;
  stageOwn(name);
  try {
    const made = (await invoke("own_new", { name, description: ownDescription.value })) as Edit;
    editsMap.set(editKey(OWN, made.folder), made);
    ownName.value = "";
    ownDescription.value = "";
    setText(ownNote, OWN_HINT);
    setText(status, `Made ${made.folder} from the template. It is saved as you type.`);
    await openOwn(made.folder, true);
  } catch (err) {
    editing = false;
    closeReader();
    choose(OWN);
    setText(ownNote, `Could not make it: ${String(err)}`);
    ownNote.classList.add("is-fault");
    ownCreate.disabled = false;
  }
});

function showRelease(id: string): void {
  const found = library.get(id);
  const releases = found?.releases ?? [];
  const key = `${id}:${releases.join(",")}:${found?.pin ?? ""}`;
  if (releasePick.dataset.key !== key) {
    releasePick.dataset.key = key;
    const options = [el("option", "", releases.length ? `Latest (${releases[0]})` : "Latest")];
    options[0].value = "";
    for (const v of releases.slice(1)) {
      const o = el("option", "", `Keep ${v}`);
      o.value = v;
      options.push(o);
    }
    releasePick.replaceChildren(...options);
    releasePick.value = found?.pin && releases.includes(found.pin) ? found.pin : "";
  }
  const source = found?.source.kind;
  releasePick.disabled = !invoke || releases.length < 2;
  updateApp.disabled = !invoke || !found || source === "dev";
  setText(releaseNote, !found ? "" : source === "dev" ? "Dev mode reads the checkout, not releases." : releases.length < 2 ? (found.pin ? `Pinned to ${found.pin}` : releases.length ? "No earlier release with skills in the catalogue" : "") : found.pin ? `Pinned: ${releases[0]} is not taken` : "");
}

releasePick.addEventListener("change", async () => {
  if (!invoke || !chosen) return;
  const version = releasePick.value || null;
  releasePick.disabled = true;
  setText(status, version ? `Keeping ${version} of this app's skills.` : "Following this app's latest release again.");
  try {
    showLibrary((await invoke("pin", { app: chosen, version })) as Library);
  } catch (e) {
    setText(status, `Could not change the release: ${String(e)}`);
    showRelease(chosen);
  }
});
updateApp.addEventListener("click", async () => {
  if (!invoke || !chosen) return;
  updateApp.disabled = true;
  setText(status, "Checking this app's release again and downloading its skills.");
  try {
    showLibrary((await invoke("refresh_app", { app: chosen })) as Library);
  } catch (e) {
    setText(status, `Could not update: ${String(e)}`);
    showRelease(chosen);
  }
});
ownCard.addEventListener("click", () => {
  if (overlay) setOverlay("");
  choose(OWN);
  void loadOwn();
});

const searchBox = document.getElementById("search") as HTMLInputElement;
const results = document.getElementById("results") as HTMLElement;
const resultsTitle = document.getElementById("results-title") as HTMLElement;
const resultsNote = document.getElementById("results-note") as HTMLElement;
const hitsList = document.getElementById("hits") as HTMLUListElement;
const guide = document.getElementById("guide") as HTMLElement;
const guideOpen = document.getElementById("guide-open") as HTMLButtonElement;
const trust = document.getElementById("trust") as HTMLElement;
const trustOpen = document.getElementById("trust-open") as HTMLButtonElement;
let overlay: "" | "results" | "guide" | "trust" = "";
let hits: Hit[] | null = null;
let searchNote = "";
let searchSeq = 0;
let searchTimer = 0;

function inFilter(appId: string): boolean {
  if (filter === "all") return true;
  if (filter.startsWith("topic:")) return list.apps.find((a) => a.id === appId)?.topic === filter.slice(6);
  return appId === filter;
}

function setOverlay(next: "" | "results" | "guide" | "trust"): void {
  if (next && reading) closeReader();
  overlay = next;
  show(results, next === "results");
  show(guide, next === "guide");
  show(trust, next === "trust");
  guideOpen.setAttribute("aria-pressed", String(next === "guide"));
  trustOpen.setAttribute("aria-pressed", String(next === "trust"));
  if (next) {
    show(empty, false);
    show(detail, false);
    show(detailOwn, false);
    detailPane.scrollTop = 0;
  } else if (!reading) {
    choose(chosen);
  }
}

function renderHits(): void {
  const query = searchBox.value.trim();
  setText(resultsTitle, `Search: ${query}`);
  if (!hits) {
    setText(resultsNote, searchNote);
    hitsList.replaceChildren();
    return;
  }
  const kept = hits.filter((h) => inFilter(h.app));
  const elsewhere = hits.length - kept.length;
  const where = filter === "all" ? "" : ` in ${filter.startsWith("topic:") ? filter.slice(6) : (list.apps.find((a) => a.id === filter)?.name ?? filter)}`;
  setText(resultsNote, kept.length ? `${plural(kept.length, "skill")}${where} holding every word, best first${elsewhere ? `; ${elsewhere} more under All` : ""}` : `No skill${where} holds every word${elsewhere ? `; ${elsewhere} under All` : ""}. Fewer or shorter words find more.`);
  const items = kept.map((h) => {
    const li = el("li", "skill");
    const hit = el("button", "skill-hit");
    hit.type = "button";
    hit.title = `Read ${h.name}${h.path === "SKILL.md" ? "" : ` at ${h.path}`}`;
    const head = el("span", "skill-head");
    const name = el("span", "skill-name", h.name);
    name.translate = false;
    const from = el("span", "skill-files", list.apps.find((a) => a.id === h.app)?.name ?? h.app);
    from.translate = false;
    head.append(name, from);
    hit.append(head, el("span", "skill-desc", h.description || "No description in its SKILL.md."));
    if (h.snippet) {
      const found = el("span", "hit-snippet");
      const path = el("span", "hit-path", h.path);
      path.translate = false;
      found.append(path, el("span", "", h.snippet));
      hit.append(found);
    }
    hit.addEventListener("click", () => {
      setOverlay("");
      choose(h.app);
      cards.find((c) => c.app.id === h.app)?.node.scrollIntoView({ block: "nearest" });
      openSkill(h.app, h.folder);
      if (h.path !== "SKILL.md") void openFile(h.path);
    });
    li.append(hit);
    return li;
  });
  hitsList.replaceChildren(...items);
}

async function runSearch(): Promise<void> {
  const query = searchBox.value.trim();
  const seq = ++searchSeq;
  if (query.length < 2) {
    hits = null;
    if (overlay === "results") setOverlay("");
    return;
  }
  if (!invoke) {
    hits = null;
    searchNote = "Open the formskills app to search the released skills.";
  } else {
    try {
      const found = (await invoke("search", { query })) as Hit[];
      if (seq !== searchSeq) return;
      hits = found;
      searchNote = "";
    } catch (e) {
      if (seq !== searchSeq) return;
      hits = null;
      searchNote = `Could not search: ${String(e)}`;
    }
  }
  if (overlay !== "results") setOverlay("results");
  renderHits();
}

function clearSearch(): void {
  window.clearTimeout(searchTimer);
  searchBox.value = "";
  void runSearch();
}

searchBox.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => void runSearch(), 180);
});
searchBox.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && searchBox.value) {
    e.preventDefault();
    clearSearch();
  } else if (e.key === "Enter") {
    window.clearTimeout(searchTimer);
    void runSearch();
  }
});
(document.getElementById("results-clear") as HTMLButtonElement).addEventListener("click", () => {
  clearSearch();
  searchBox.focus();
});
guideOpen.addEventListener("click", () => setOverlay(overlay === "guide" ? (hits ? "results" : "") : "guide"));
(document.getElementById("guide-close") as HTMLButtonElement).addEventListener("click", () => setOverlay(hits && searchBox.value.trim().length >= 2 ? "results" : ""));
trustOpen.addEventListener("click", () => setOverlay(overlay === "trust" ? (hits ? "results" : "") : "trust"));
(document.getElementById("trust-close") as HTMLButtonElement).addEventListener("click", () => setOverlay(hits && searchBox.value.trim().length >= 2 ? "results" : ""));

function apply(next: string): void {
  filter = next;
  const topic = filter.startsWith("topic:") ? filter.slice(6) : "";
  let shown = 0;
  for (const { app, node } of cards) {
    const visible = inFilter(app.id);
    if (node.hidden === visible) node.hidden = !visible;
    if (visible) shown += 1;
  }
  for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.filter === filter));
  setText(count, filter === "all" ? `${list.apps.length} apps ship skills` : `${shown} of ${list.apps.length} apps${topic ? ` · ${topic}` : ""}`);
  if (overlay === "results") renderHits();
  else if (filter !== "all" && !topic) {
    if (overlay) setOverlay("");
    choose(filter);
  } else if (chosen && chosen !== OWN && !list.apps.some((a) => a.id === chosen)) choose("");
}

for (const c of chips) c.addEventListener("click", () => apply(c.dataset.filter ?? "all"));
chipsBox.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || chipsBox.scrollWidth <= chipsBox.clientWidth) return;
  e.preventDefault();
  chipsBox.scrollLeft += e.deltaY;
}, { passive: false });
for (const { app, node } of cards) {
  node.firstElementChild?.addEventListener("click", () => {
    if (overlay) setOverlay("");
    choose(app.id);
  });
}
apply("all");

if (invoke) {
  refreshButton.addEventListener("click", () => void load("refresh"));
  void load("library");
  void loadOwn();
} else {
  setText(status, "Preview in a browser: open the formskills app to read the released skills.");
}

document.documentElement.classList.remove("booting");
