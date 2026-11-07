import list from "../../../core/data/apps.json";
import { shipped } from "../../../demo/src/family";
import { asText, listFiles, toBytes, type Files } from "../../../demo/src/model";
import { load, type InstRec } from "../../../demo/src/store";
import { hunks, lineDiff } from "./diff";
import { sha256 } from "./sha";

type Status = "changed" | "new" | "removed" | "same";
type FileRow = { path: string; status: Status; installed: string; release: string; plus: number; minus: number; before: string | null; after: string | null };
type Plan = { rec: InstRec; target: string; pending: boolean; rows: FileRow[] };

const AGENTS: Record<string, string> = { claude: "Claude Code", codex: "Codex", cursor: "Cursor" };
const RANK: Record<Status, number> = { changed: 0, new: 1, removed: 2, same: 3 };
const LINE_CAP = 360;

const pick = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const select = pick<HTMLSelectElement>("inspect-pick");
const sum = pick<HTMLElement>("inspect-sum");
const files = pick<HTMLUListElement>("inspect-files");
const view = pick<HTMLPreElement>("inspect-diff");
const installedList = pick<HTMLElement>("installed-list");

const family = shipped();
const shaCache = new Map<string, string>();

const keyOf = (r: InstRec): string => `${r.target.agent}|${r.target.project ?? ""}|${r.folder}`;
const whereOf = (r: InstRec): string => `${AGENTS[r.target.agent] ?? r.target.agent}${r.target.project ? ` in ${r.target.project}` : " for you"}`;
const appName = (id: string): string => list.apps.find((a) => a.id === id)?.name ?? id;

function digestOf(c: Uint8Array | string): string {
  if (typeof c !== "string") return sha256(c);
  const hit = shaCache.get(c);
  if (hit) return hit;
  const sha = sha256(toBytes(c));
  shaCache.set(c, sha);
  return sha;
}

function textOf(c: Uint8Array | string | undefined): string | null {
  return c === undefined ? null : asText(c);
}

function targetOf(rec: InstRec, pins: Record<string, string>): { version: string; files: Files | undefined } {
  const found = family.get(rec.origin.app);
  if (!found) return { version: rec.origin.version, files: undefined };
  const pin = pins[rec.origin.app];
  const version = pin && found.versions.slice(1).includes(pin) ? pin : found.versions[0];
  return { version, files: found.trees.get(version)?.get(rec.folder) };
}

function plan(rec: InstRec, pins: Record<string, string>): Plan {
  const { version, files: there } = targetOf(rec, pins);
  const have = new Map(listFiles(rec.files).map(([p, c]) => [p, c]));
  const want = new Map(there ? listFiles(there).map(([p, c]) => [p, c]) : []);
  const paths = [...new Set([...have.keys(), ...want.keys()])];
  const rows: FileRow[] = paths.map((path) => {
    const a = have.get(path);
    const b = want.get(path);
    const installed = a === undefined ? "" : digestOf(a);
    const release = b === undefined ? "" : digestOf(b);
    const before = textOf(a);
    const after = textOf(b);
    let status: Status = "same";
    let plus = 0;
    let minus = 0;
    if (a === undefined) status = "new";
    else if (b === undefined) status = "removed";
    else if (installed !== release) status = "changed";
    if (status !== "same" && before !== null && after !== null) {
      for (const r of lineDiff(before, after)) {
        if (r.kind === "add") plus += 1;
        else if (r.kind === "del") minus += 1;
      }
    }
    return { path, status, installed, release, plus, minus, before, after };
  });
  rows.sort((x, y) => RANK[x.status] - RANK[y.status] || (x.path < y.path ? -1 : 1));
  const pending = !!there && version !== rec.origin.version;
  return { rec, target: version, pending, rows };
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function sorted(rows: InstRec[]): InstRec[] {
  return [...rows].sort((a, b) => a.target.agent.localeCompare(b.target.agent) || (a.target.project ?? "").localeCompare(b.target.project ?? "") || a.folder.localeCompare(b.folder));
}

let current: Plan | null = null;
let chosenPath = "";

function showFile(row: FileRow | undefined): void {
  const lines: HTMLElement[] = [];
  if (!current || !row) {
    view.replaceChildren(node("span", "d-note", "Nothing to show."));
    return;
  }
  const stem = `${row.path}`;
  if (row.before === null && row.after === null && row.status !== "same") lines.push(node("span", "d-note", `${stem} is not text; it changes as a whole.`));
  else if (row.status === "same") {
    lines.push(node("span", "d-note", `${stem} is identical in the install and in release ${current.target}.`));
    lines.push(node("span", "d-note", `SHA-256 ${row.installed}`));
  } else if (row.status === "new") {
    lines.push(node("span", "d-head", `${stem}: new in release ${current.target}`));
    (row.after ?? "").split("\n").slice(0, LINE_CAP).forEach((t) => lines.push(node("span", "d-add", `+ ${t}`)));
  } else if (row.status === "removed") {
    lines.push(node("span", "d-head", `${stem}: not in release ${current.target}`));
    (row.before ?? "").split("\n").slice(0, LINE_CAP).forEach((t) => lines.push(node("span", "d-del", `- ${t}`)));
  } else {
    lines.push(node("span", "d-head", `${stem}: installed ${current.rec.origin.version}, release ${current.target}`));
    let used = 0;
    for (const h of hunks(lineDiff(row.before ?? "", row.after ?? ""))) {
      lines.push(node("span", "d-gap", "..."));
      for (const r of h) {
        if (used >= LINE_CAP) break;
        used += 1;
        lines.push(node("span", r.kind === "add" ? "d-add" : r.kind === "del" ? "d-del" : "d-same", `${r.kind === "add" ? "+" : r.kind === "del" ? "-" : " "} ${r.text}`));
      }
    }
  }
  view.replaceChildren(...lines.flatMap((l) => [l, document.createTextNode("\n")]));
  view.scrollTop = 0;
}

function drawFiles(rows: FileRow[]): void {
  const items = rows.map((row) => {
    const li = node("li", "inspect-file");
    const b = node("button", "inspect-hit");
    b.type = "button";
    b.dataset.path = row.path;
    b.setAttribute("aria-pressed", String(row.path === chosenPath));
    b.title = row.path;
    const counts = row.status === "same" ? row.installed.slice(0, 10) : row.plus || row.minus ? `+${row.plus} -${row.minus}` : "";
    b.append(node("span", `inspect-tag is-${row.status}`, row.status), node("span", "inspect-name", row.path), node("span", "inspect-counts", counts));
    b.addEventListener("click", () => {
      chosenPath = row.path;
      for (const x of files.querySelectorAll<HTMLElement>(".inspect-hit")) x.setAttribute("aria-pressed", String(x.dataset.path === chosenPath));
      showFile(row);
    });
    li.append(b);
    return li;
  });
  files.replaceChildren(...items);
}

function draw(): void {
  const state = load();
  const rows = sorted(state.installs);
  const keys = rows.map(keyOf).join("\n");
  if (select.dataset.keys !== keys) {
    select.dataset.keys = keys;
    const was = select.value;
    const options = rows.map((r) => {
      const o = node("option", "", `${r.folder} · ${whereOf(r)}`);
      o.value = keyOf(r);
      return o;
    });
    select.replaceChildren(...options);
    select.disabled = !options.length;
    if (options.some((o) => o.value === was)) select.value = was;
  }
  const rec = rows.find((r) => keyOf(r) === select.value) ?? rows[0];
  if (!rec) {
    current = null;
    sum.textContent = "Nothing is installed yet. Install a skill, and what it holds is listed here.";
    files.replaceChildren();
    showFile(undefined);
    return;
  }
  const p = plan(rec, state.pins);
  current = p;
  const changed = p.rows.filter((r) => r.status !== "same");
  const plus = changed.reduce((n, r) => n + r.plus, 0);
  const minus = changed.reduce((n, r) => n + r.minus, 0);
  const name = appName(rec.origin.app);
  const text = p.pending
    ? `${name} release ${p.target} changes ${changed.length} of ${p.rows.length} files in ${rec.folder} (+${plus} -${minus} lines). Update in the list above replaces the install with release ${p.target}; nothing is changed until you press it.`
    : changed.length
      ? `Installed from ${name} release ${rec.origin.version}. The release you follow now (${p.target}) differs in ${changed.length} of ${p.rows.length} files, but this install is not offered the update.`
      : `Installed from ${name} release ${rec.origin.version}: all ${p.rows.length} files match the release byte for byte (SHA-256).`;
  if (sum.textContent !== text) sum.textContent = text;
  if (!p.rows.some((r) => r.path === chosenPath)) chosenPath = (changed[0] ?? p.rows[0])?.path ?? "";
  drawFiles(p.rows);
  showFile(p.rows.find((r) => r.path === chosenPath));
}

export function pendingKey(): string {
  const state = load();
  const found = sorted(state.installs).find((r) => plan(r, state.pins).pending);
  return found ? keyOf(found) : "";
}

export function inspectKey(key: string): void {
  if (key) select.value = key;
  chosenPath = "";
  draw();
}

select.addEventListener("change", () => {
  chosenPath = "";
  draw();
});
new MutationObserver(draw).observe(installedList, { childList: true });
draw();
