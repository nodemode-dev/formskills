import { asText, frontMatter, type Content, type Files } from "./model";
import { exportInstalls, importOwn } from "./shim";
import { readZip } from "./zip";

type Raw = [string, Uint8Array];

const MOST_FILES = 1500;
const MOST_BYTES = 24 * 1024 * 1024;

const status = document.getElementById("status") as HTMLElement;
const drop = document.getElementById("demo-drop") as HTMLElement;
const note = document.getElementById("demo-import-note") as HTMLElement;
const folderInput = document.getElementById("demo-folder-input") as HTMLInputElement;
const fileInput = document.getElementById("demo-file-input") as HTMLInputElement;
const ownCard = document.getElementById("own-card") as HTMLButtonElement;

function say(text: string, fault = false): void {
  if (status.textContent !== text) status.textContent = text;
  status.title = text;
  if (note.textContent !== text) note.textContent = text;
  note.classList.toggle("is-fault", fault);
}

async function bytesOf(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

async function walk(entry: FileSystemEntry, prefix: string, out: Raw[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((ok, no) => (entry as FileSystemFileEntry).file(ok, no));
    out.push([`${prefix}${entry.name}`, await bytesOf(file)]);
    return;
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((ok, no) => reader.readEntries(ok, no));
    if (!batch.length) return;
    for (const child of batch) await walk(child, `${prefix}${entry.name}/`, out);
  }
}

async function expand(path: string, data: Uint8Array, out: Raw[]): Promise<void> {
  if (/\.zip$/i.test(path)) {
    const stem = path.split("/").pop()?.replace(/\.zip$/i, "") ?? "skill";
    for (const [p, b] of await readZip(data)) out.push([`${stem}/${p}`, b]);
  } else out.push([path, data]);
}

function toContent(data: Uint8Array): Content {
  const text = asText(data);
  return text !== null && !text.includes("\0") ? text : data;
}

export function organise(raw: Raw[]): [string, Files][] {
  if (raw.length > MOST_FILES) throw new Error(`that is ${raw.length} files; at most ${MOST_FILES}`);
  if (raw.reduce((n, [, b]) => n + b.length, 0) > MOST_BYTES) throw new Error("that is more than 24 MB; it is refused");
  const paths = raw.map(([p]) => p.replace(/^\/+/, ""));
  if (paths.some((p) => p.split("/").includes(".."))) throw new Error("a path leaves its folder; it is refused");
  const dirs = paths.filter((p) => p.split("/").pop() === "SKILL.md").map((p) => p.split("/").slice(0, -1).join("/"));
  let roots = [...new Set(dirs)].sort((a, b) => a.split("/").length - b.split("/").length);
  roots = roots.filter((r, i) => !roots.slice(0, i).some((k) => k === "" || r === k || r.startsWith(`${k}/`)));
  const loose = raw.filter(([p]) => !p.includes("/") && /\.md$/i.test(p));
  const out: [string, Files][] = [];
  if (!roots.length && loose.length === 1 && frontMatter(asText(loose[0][1]) ?? "").has("name")) {
    const text = asText(loose[0][1]) ?? "";
    return [[frontMatter(text).get("name") ?? "imported-skill", new Map([["SKILL.md", text]])]];
  }
  if (!roots.length) throw new Error("no SKILL.md found; open a skill folder, a SKILL.md or a zip of skills");
  for (const root of roots) {
    const files: Files = new Map();
    raw.forEach(([, data], i) => {
      const p = paths[i];
      if (root === "") files.set(p, toContent(data));
      else if (p.startsWith(`${root}/`)) files.set(p.slice(root.length + 1), toContent(data));
    });
    const folder = root === "" ? (frontMatter(asText(files.get("SKILL.md") ?? "") ?? "").get("name") ?? "imported-skill") : (root.split("/").pop() as string);
    out.push([folder, files]);
  }
  return out;
}

function openFirst(name: string): void {
  ownCard.click();
  let frames = 0;
  const look = (): void => {
    const hit = document.querySelector<HTMLButtonElement>(`#own-list .skill-hit[title="Edit ${name}"]`);
    if (hit) hit.click();
    else if ((frames += 1) < 90) requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
}

async function bring(raw: Raw[]): Promise<void> {
  try {
    const made = organise(raw).map(([wanted, files]) => importOwn(wanted, files));
    say(`Opened ${made.length === 1 ? "1 skill" : `${made.length} skills`} of yours: ${made.join(", ")}. Check runs as you edit; nothing leaves this page.`);
    openFirst(made[0]);
  } catch (e) {
    say(`Could not open that: ${e instanceof Error ? e.message : String(e)}`, true);
  }
}

async function fromFileList(files: FileList): Promise<void> {
  const raw: Raw[] = [];
  try {
    for (const f of files) await expand((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name, await bytesOf(f), raw);
  } catch (e) {
    say(`Could not open that: ${e instanceof Error ? e.message : String(e)}`, true);
    return;
  }
  await bring(raw);
}

async function fromDrop(transfer: DataTransfer): Promise<void> {
  const raw: Raw[] = [];
  try {
    const entries = [...transfer.items].map((i) => i.webkitGetAsEntry()).filter((e): e is FileSystemEntry => !!e);
    const found: Raw[] = [];
    for (const entry of entries) await walk(entry, "", found);
    for (const [p, b] of found) await expand(p, b, raw);
  } catch (e) {
    say(`Could not open that: ${e instanceof Error ? e.message : String(e)}`, true);
    return;
  }
  await bring(raw);
}

(document.getElementById("demo-open-folder") as HTMLButtonElement).addEventListener("click", () => folderInput.click());
(document.getElementById("demo-open-files") as HTMLButtonElement).addEventListener("click", () => fileInput.click());
for (const input of [folderInput, fileInput]) {
  input.addEventListener("change", () => {
    if (input.files?.length) void fromFileList(input.files);
    input.value = "";
  });
}

let depth = 0;
const carries = (e: DragEvent): boolean => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");
window.addEventListener("dragenter", (e) => {
  if (!carries(e)) return;
  depth += 1;
  drop.hidden = false;
});
window.addEventListener("dragover", (e) => {
  if (carries(e)) e.preventDefault();
});
window.addEventListener("dragleave", (e) => {
  if (!carries(e)) return;
  depth = Math.max(0, depth - 1);
  if (depth === 0) drop.hidden = true;
});
window.addEventListener("drop", (e) => {
  if (!carries(e) || !e.dataTransfer) return;
  e.preventDefault();
  depth = 0;
  drop.hidden = true;
  void fromDrop(e.dataTransfer);
});

(document.getElementById("demo-installed-zip") as HTMLButtonElement).addEventListener("click", () => {
  const n = exportInstalls();
  say(n ? `Saved the demo's virtual agent folders (${n} files) as formskills-demo-installed.zip.` : "Nothing installed yet. Open a skill and press Install.");
});
