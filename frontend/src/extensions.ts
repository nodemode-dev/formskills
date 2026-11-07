import { ERR, ExtensionHost, HostError, PERMISSION_WORDS, type ExtensionRecord, type Frame, type Permission, type Theme } from "./formext/host-bridge";
import type { Invoke } from "./engine-bridge";

export type Op = { command: string; args?: unknown };

export type HostContext = {
  invoke?: Invoke;
  tauri: boolean;
  version: string;
  status: (text: string) => void;
  showPane: (pane: "extensions" | "panel" | "") => void;
  paneShown: () => string;
  readDocument: (what?: string) => Promise<unknown>;
  commands: () => { id: string; title: string; args?: Record<string, string> }[];
  apply: (ext: ExtensionRecord, label: string, ops: Op[]) => Promise<{ applied: number; results: unknown[] }>;
  run: (ext: ExtensionRecord, command: string, args: unknown) => Promise<unknown>;
};

type Listing = { root: string; stamp: [number, number]; extensions: ExtensionRecord[] };
type Request = { key: string; id: string; command: string; args?: unknown };

const SOURCES: Record<string, string> = { catalogue: "Catalogue", sideload: "File", development: "Development" };
const PORTAL = "formai://extensions?product=formskills";
const POLL = 2000;
const TOKENS: [string, string][] = [["--bg", "--ground"], ["--panel", "--pane"], ["--text", "--ink"], ["--muted", "--ink-soft"], ["--accent", "--accent"], ["--border", "--edge"], ["--radius", "--radius-s"], ["--float", "--float"], ["--control", "--control"], ["--fault", "--fault"], ["--live", "--live"]];
const FILES_LIMIT = 200 * 1024 * 1024;

let host: ExtensionHost | null = null;
const soon = new Map<string, () => unknown>();
let soonTimer = 0;

export function emit(name: string, data: unknown): void {
  host?.broadcast(name, data);
}

export function emitSoon(name: string, data: () => unknown): void {
  if (!host) return;
  soon.set(name, data);
  if (soonTimer) return;
  soonTimer = window.setTimeout(() => {
    soonTimer = 0;
    const due = [...soon.entries()];
    soon.clear();
    for (const [n, d] of due) host?.broadcast(n, d());
  }, 0);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function button(cls: string, text: string): HTMLButtonElement {
  const b = el("button", cls, text);
  b.type = "button";
  return b;
}

function setText(node: Element, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

function theme(): Theme {
  const style = getComputedStyle(document.documentElement);
  const tokens: Record<string, string> = {};
  for (const [name, from] of TOKENS) {
    const v = style.getPropertyValue(from).trim();
    if (v) tokens[name] = v;
  }
  return { mode: matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark", tokens };
}

function base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ""));
    reader.onerror = () => reject(new HostError(ERR.REFUSED, `${file.name} could not be read`));
    reader.readAsDataURL(file);
  });
}

export function initExtensions(ctx: HostContext): Promise<void> | null {
  const opener = document.getElementById("ext-open") as HTMLButtonElement | null;
  if (!opener) return null;
  const pop = document.getElementById("ext-pop") as HTMLElement;
  const popCommands = document.getElementById("ext-pop-commands") as HTMLElement;
  const popSep = document.getElementById("ext-pop-sep") as HTMLElement;
  const rows = document.getElementById("ext-rows") as HTMLUListElement;
  const emptyBox = document.getElementById("ext-empty") as HTMLElement;
  const rootNote = document.getElementById("ext-root") as HTMLElement;
  const panels = document.getElementById("ext-panels") as HTMLElement;
  const hiddenBox = document.getElementById("ext-hidden") as HTMLElement;
  const consentBox = document.getElementById("ext-consent") as HTMLDialogElement;
  const saveBox = document.getElementById("ext-save") as HTMLDialogElement;
  const dialogBox = document.getElementById("ext-dialog") as HTMLDialogElement;
  const dialogTitle = document.getElementById("ext-dialog-title") as HTMLElement;
  const dialogBody = document.getElementById("ext-dialog-body") as HTMLElement;

  const records = new Map<string, ExtensionRecord>();
  const signatures = new Map<string, string>();
  const docked = new Map<string, { article: HTMLElement; title: HTMLElement; body: HTMLElement; frame: Frame | null; ext: ExtensionRecord }>();
  let dialogFrame: Frame | null = null;
  let stamp = "";
  let listed = false;
  let asking: Promise<unknown> = Promise.resolve();

  const ask = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = asking.then(fn, fn);
    asking = next.catch(() => undefined);
    return next;
  };

  const consent = (ext: ExtensionRecord): Promise<boolean> =>
    ask(
      () =>
        new Promise<boolean>((resolve) => {
          setText(document.getElementById("ext-consent-title") as HTMLElement, `Allow ${ext.name}?`);
          setText(document.getElementById("ext-consent-from") as HTMLElement, `${ext.name} ${ext.version} · ${SOURCES[ext.source] ?? ext.source}${ext.description ? ` · ${ext.description}` : ""}`);
          (document.getElementById("ext-consent-list") as HTMLElement).replaceChildren(...ext.permissions.map((p) => el("li", "", PERMISSION_WORDS[p as Permission] ?? p)));
          const yes = document.getElementById("ext-consent-yes") as HTMLButtonElement;
          const no = document.getElementById("ext-consent-no") as HTMLButtonElement;
          const done = (ok: boolean) => {
            yes.onclick = null;
            no.onclick = null;
            consentBox.onclose = null;
            if (consentBox.open) consentBox.close();
            resolve(ok);
            refreshRow(ext.id);
          };
          yes.onclick = () => done(true);
          no.onclick = () => done(false);
          consentBox.onclose = () => done(false);
          consentBox.showModal();
          no.focus();
        }),
    );

  const confirmSave = (ext: ExtensionRecord, name: string): Promise<boolean> =>
    ask(
      () =>
        new Promise<boolean>((resolve) => {
          setText(document.getElementById("ext-save-title") as HTMLElement, `Save ${name}?`);
          setText(document.getElementById("ext-save-note") as HTMLElement, ctx.tauri ? `${ext.name} wants to save ${name} in your Downloads folder, where formskills saves its downloads.` : `${ext.name} wants to save ${name}; your browser saves it as a download.`);
          const yes = document.getElementById("ext-save-yes") as HTMLButtonElement;
          const no = document.getElementById("ext-save-no") as HTMLButtonElement;
          const done = (ok: boolean) => {
            yes.onclick = null;
            no.onclick = null;
            saveBox.onclose = null;
            if (saveBox.open) saveBox.close();
            resolve(ok);
          };
          yes.onclick = () => done(true);
          no.onclick = () => done(false);
          saveBox.onclose = () => done(false);
          saveBox.showModal();
          yes.focus();
        }),
    );

  const openFiles = (_ext: ExtensionRecord, accept: string[], multiple: boolean) =>
    new Promise<{ name: string; type: string; size: number; data: string }[]>((resolve, reject) => {
      const input = el("input");
      input.type = "file";
      input.multiple = multiple;
      if (accept.length) input.accept = accept.join(",");
      input.addEventListener("cancel", () => reject(new HostError(ERR.CANCELLED, "no file was chosen")));
      input.addEventListener("change", async () => {
        const files = [...(input.files ?? [])];
        if (!files.length) return reject(new HostError(ERR.CANCELLED, "no file was chosen"));
        if (files.reduce((n, f) => n + f.size, 0) > FILES_LIMIT) return reject(new HostError(ERR.REFUSED, "the files are larger than 200 MB together"));
        try {
          resolve(await Promise.all(files.map(async (f) => ({ name: f.name, type: f.type || "application/octet-stream", size: f.size, data: await base64(f) }))));
        } catch (e) {
          reject(e);
        }
      });
      input.click();
    });

  const saveFile = async (ext: ExtensionRecord, name: string, type: string, data: string) => {
    if (!(await confirmSave(ext, name))) throw new HostError(ERR.CANCELLED, "the save was cancelled");
    if (ctx.tauri && ctx.invoke) {
      try {
        const saved = (await ctx.invoke("extension_save", { name, data })) as { saved: boolean; name: string; path: string };
        ctx.status(`${ext.name}: saved ${saved.name} to ${saved.path}`);
        return { saved: true, name: saved.name };
      } catch (e) {
        throw new HostError(ERR.REFUSED, String(e));
      }
    }
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const a = el("a");
    a.href = url;
    a.download = name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    ctx.status(`${ext.name}: saved ${name} as a download`);
    return { saved: true, name };
  };

  host = new ExtensionHost({
    product: "formskills",
    app: "FormSkills",
    appVersion: ctx.version,
    theme,
    notify: (ext, message) => ctx.status(`${ext.name}: ${message}`),
    setTitle: (ext, frame, title) => {
      for (const d of docked.values()) if (d.frame?.frame === frame) setText(d.title, `${ext.name}: ${title || d.title.dataset.title}`);
      if (dialogFrame?.frame === frame) setText(dialogTitle, `${ext.name}: ${title}`);
    },
    readDocument: (_ext, params) => ctx.readDocument(params.what),
    applyDocument: (ext, label, ops) => ctx.apply(ext, label, ops),
    commands: () => ctx.commands(),
    run: (ext, command, args) => ctx.run(ext, command, args),
    openFiles,
    saveFile,
    consent,
  });

  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => host?.setTheme(theme()));

  const stateText = (ext: ExtensionRecord): [string, string] => {
    if (ext.state === "refused") return [`Refused: ${ext.reason}`, "is-fault"];
    if (!host?.isGranted(ext)) return ["Needs Permission", "is-note"];
    return ["Ready", "is-ready"];
  };

  const signature = (ext: ExtensionRecord): string => JSON.stringify([ext, stateText(ext)[0]]);

  function rowFor(ext: ExtensionRecord): HTMLLIElement {
    const li = el("li", "ext-row");
    li.dataset.ext = ext.id;
    const head = el("span", "ext-head");
    const name = el("span", "skill-name", ext.name);
    name.translate = false;
    head.append(name, el("span", "ext-version", ext.version), el("span", "ext-source", SOURCES[ext.source] ?? ext.source));
    const [state, cls] = stateText(ext);
    const stateNode = el("span", `ext-state ${cls}`, state);
    stateNode.title = state;
    head.append(stateNode);
    li.append(head);
    if (ext.description) li.append(el("p", "ext-desc", ext.description));
    const chips = el("span", "ext-chips");
    for (const p of ext.permissions) {
      const c = el("span", "ext-chip", p);
      c.title = PERMISSION_WORDS[p as Permission] ?? p;
      chips.append(c);
    }
    if (!ext.permissions.length) chips.append(el("span", "ext-chip is-none", "no permissions"));
    const actions = el("span", "ext-actions");
    if (ext.state === "ready") {
      for (const p of ext.panels) {
        const open = button("btn btn-small", ext.panels.length > 1 ? `Open ${p.title}` : "Open");
        open.addEventListener("click", () => void openPanel(ext.id, p.id));
        actions.append(open);
      }
      if (ext.permissions.length && host?.isGranted(ext)) {
        const revoke = button("btn btn-small btn-quiet", "Forget permission");
        revoke.addEventListener("click", () => {
          host?.revoke(ext);
          host?.disposeExtension(ext.id);
          closeDocked(ext.id);
          refreshRow(ext.id);
          ctx.status(`${ext.name} will ask again before it runs.`);
        });
        actions.append(revoke);
      }
    }
    const foot = el("span", "ext-foot");
    foot.append(chips, actions);
    li.append(foot);
    if (ext.source === "development" && ext.path) {
      const path = el("p", "ext-path", ext.path);
      path.translate = false;
      path.title = ext.path;
      li.append(path);
    }
    return li;
  }

  function refreshRow(id: string): void {
    const ext = records.get(id);
    const old = rows.querySelector<HTMLElement>(`[data-ext="${CSS.escape(id)}"]`);
    if (!ext || !old) return;
    const sig = signature(ext);
    if (signatures.get(id) === sig) return;
    signatures.set(id, sig);
    old.replaceWith(rowFor(ext));
  }

  function renderMenu(): void {
    const items: HTMLElement[] = [];
    for (const ext of records.values()) {
      if (ext.state !== "ready") continue;
      for (const c of ext.commands) {
        const item = button("ext-pop-item", `${ext.name}: ${c.title}`);
        item.setAttribute("role", "menuitem");
        item.translate = false;
        item.addEventListener("click", () => {
          closeMenu();
          void runCommand(ext.id, c.id, {}).catch((e) => ctx.status(String((e as Error).message ?? e)));
        });
        items.push(item);
      }
    }
    const key = items.map((i) => i.textContent).join("\n");
    if (popCommands.dataset.key !== key) {
      popCommands.dataset.key = key;
      popCommands.replaceChildren(...items);
    }
    if (popSep.hidden === items.length > 0) popSep.hidden = items.length === 0;
    if (popCommands.hidden === items.length > 0) popCommands.hidden = items.length === 0;
  }

  function apply(listing: Listing): void {
    const next = new Map(listing.extensions.map((e) => [e.id, e]));
    for (const [id, old] of records) {
      const now = next.get(id);
      if (!now || now.version !== old.version || now.base !== old.base || now.state !== old.state || now.entryUi !== old.entryUi) {
        host?.disposeExtension(id);
        closeDocked(id);
        if (dialogFrame?.ext.id === id) dialogBox.close();
      }
    }
    records.clear();
    for (const [id, e] of next) records.set(id, e);
    const order = listing.extensions.map((e) => e.id);
    const present = new Map<string, HTMLElement>();
    for (const li of [...rows.children] as HTMLElement[]) {
      const id = li.dataset.ext ?? "";
      if (!next.has(id)) {
        li.remove();
        signatures.delete(id);
      } else present.set(id, li);
    }
    let before: Element | null = rows.firstElementChild;
    for (const id of order) {
      const ext = next.get(id) as ExtensionRecord;
      const sig = signature(ext);
      let li = present.get(id);
      if (!li || signatures.get(id) !== sig) {
        const made = rowFor(ext);
        if (li) li.replaceWith(made);
        li = made;
        signatures.set(id, sig);
      }
      if (li !== before) rows.insertBefore(li, before);
      before = li.nextElementSibling;
    }
    const none = order.length === 0;
    if (emptyBox.hidden === none) emptyBox.hidden = !none;
    if (rows.hidden === !none) rows.hidden = none;
    setText(rootNote, `Read from ${listing.root}/extensions/formskills (enabled.json from FormPortal, dev.json from form.ext).`);
    rootNote.title = listing.root;
    renderMenu();
  }

  async function reload(say = false): Promise<void> {
    if (!ctx.invoke) {
      if (!listed) {
        listed = true;
        apply({ root: "FormPortal's folder", stamp: [0, 0], extensions: [] });
        setText(rootNote, "Open the formskills app to load extensions.");
      }
      if (say) ctx.status("Open the formskills app to load extensions.");
      return;
    }
    try {
      const listing = (await ctx.invoke("extensions_list")) as Listing;
      stamp = JSON.stringify(listing.stamp);
      listed = true;
      apply(listing);
      if (say) {
        const ready = listing.extensions.filter((e) => e.state === "ready").length;
        ctx.status(`Extensions reloaded: ${ready} ready${listing.extensions.length > ready ? `, ${listing.extensions.length - ready} refused` : ""}.`);
      }
    } catch (e) {
      ctx.status(`Could not read the extensions: ${String(e)}`);
    }
  }

  async function tick(): Promise<void> {
    if (!ctx.invoke) return;
    if (document.hasFocus()) {
      try {
        const now = JSON.stringify(await ctx.invoke("extensions_stamp"));
        if (now !== stamp) await reload();
      } catch {
        return;
      }
    }
    try {
      const asked = (await ctx.invoke("extension_requests")) as Request[];
      for (const r of asked) void answer(r);
    } catch {
      return;
    }
  }

  async function answer(r: Request): Promise<void> {
    let result: unknown = null;
    let error: string | null = null;
    try {
      if (!records.has(r.id)) await reload();
      result = await runCommand(r.id, r.command, r.args ?? {});
    } catch (e) {
      error = String((e as Error).message ?? e);
    }
    try {
      await ctx.invoke?.("extension_answer", { key: r.key, result: result ?? null, error });
    } catch {
      return;
    }
  }

  function closeDocked(id: string): void {
    for (const [key, d] of [...docked]) {
      if (d.ext.id !== id) continue;
      d.frame?.dispose();
      d.article.remove();
      docked.delete(key);
    }
    if (ctx.paneShown() === "panel" && ![...docked.values()].some((d) => !d.article.hidden)) ctx.showPane("");
  }

  function showDocked(key: string): void {
    for (const [k, d] of docked) if (d.article.hidden === (k === key)) d.article.hidden = k !== key;
    ctx.showPane("panel");
  }

  async function openPanel(id: string, panelId: string, command?: string): Promise<null> {
    const ext = records.get(id);
    if (!ext || ext.state !== "ready") throw new HostError(ERR.NOT_FOUND, `${ext?.name ?? id} is not ready`);
    const panel = ext.panels.find((p) => p.id === panelId);
    if (!panel) throw new HostError(ERR.NOT_FOUND, `${ext.name} has no panel ${panelId}`);
    const declined = (): never => {
      refreshRow(id);
      ctx.status(`${ext.name} was not allowed to run.`);
      throw new HostError(ERR.PERMISSION, `${ext.name} was not allowed to run`);
    };
    const activation = command ? { reason: "command" as const, panel: panelId, command } : { reason: "panel" as const, panel: panelId };
    if (panel.location === "dialog") {
      dialogFrame?.dispose();
      dialogFrame = await host!.open(ext, dialogBody, {
        onResize: (h) => {
          if (dialogFrame) dialogFrame.frame.style.height = `${h}px`;
        },
      });
      if (!dialogFrame) return declined();
      refreshRow(id);
      setText(dialogTitle, `${ext.name}: ${panel.title}`);
      dialogBox.onclose = () => {
        dialogFrame?.dispose();
        dialogFrame = null;
      };
      if (!dialogBox.open) dialogBox.showModal();
      await dialogFrame.activate(activation);
      return null;
    }
    const key = `${id}/${panelId}`;
    let d = docked.get(key);
    if (!d) {
      const article = el("article", "guide ext-panel");
      article.hidden = true;
      const head = el("header", "pane-head");
      const title = el("h2", "pane-title", `${ext.name}: ${panel.title}`);
      title.dataset.title = panel.title;
      title.translate = false;
      const close = button("btn btn-quiet", "Close");
      close.addEventListener("click", () => {
        const now = docked.get(key);
        now?.frame?.dispose();
        now?.article.remove();
        docked.delete(key);
        ctx.showPane("");
      });
      head.append(title, close);
      const body = el("div", "ext-panel-body");
      article.append(head, body);
      panels.append(article);
      d = { article, title, body, frame: null, ext };
      docked.set(key, d);
    }
    if (!d.frame) {
      d.frame = await host!.open(ext, d.body);
      if (!d.frame) {
        d.article.remove();
        docked.delete(key);
        return declined();
      }
      refreshRow(id);
      showDocked(key);
      await d.frame.activate({ reason: "panel", panel: panelId });
      if (command) await d.frame.activate(activation);
    } else {
      showDocked(key);
      await d.frame.activate(activation);
    }
    return null;
  }

  async function runCommand(id: string, commandId: string, args: unknown): Promise<unknown> {
    const ext = records.get(id);
    if (!ext) throw new HostError(ERR.NOT_FOUND, `no extension ${id} for formskills`);
    if (ext.state !== "ready") throw new HostError(ERR.REFUSED, `${ext.name} is refused: ${ext.reason}`);
    const command = ext.commands.find((c) => c.id === commandId);
    if (!command) throw new HostError(ERR.NOT_FOUND, `${ext.name} has no command ${commandId}`);
    if (command.panel) return openPanel(id, command.panel, commandId);
    try {
      const out = await host!.runCommand(ext, commandId, args, hiddenBox);
      refreshRow(id);
      return out ?? null;
    } catch (e) {
      refreshRow(id);
      const message = String((e as Error).message ?? e);
      ctx.status(message.startsWith(ext.name) ? message : `${ext.name}: ${message}`);
      throw e;
    }
  }

  const menuItems = (): HTMLButtonElement[] => [...pop.querySelectorAll<HTMLButtonElement>(".ext-pop-item")].filter((b) => !b.closest("[hidden]"));

  function openMenu(): void {
    renderMenu();
    pop.hidden = false;
    opener!.setAttribute("aria-expanded", "true");
    menuItems()[0]?.focus();
  }

  function closeMenu(): void {
    if (pop.hidden) return;
    pop.hidden = true;
    opener!.setAttribute("aria-expanded", "false");
  }

  function managePortal(): void {
    if (ctx.tauri && ctx.invoke) void ctx.invoke("open_portal").catch((e) => ctx.status(String(e)));
    else window.location.href = PORTAL;
  }

  opener.addEventListener("click", () => (pop.hidden ? openMenu() : closeMenu()));
  document.addEventListener("click", (e) => {
    if (!pop.hidden && !(e.target as Element).closest("#ext-menu")) closeMenu();
  });
  pop.addEventListener("keydown", (e) => {
    const items = menuItems();
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      opener.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    }
  });
  (document.getElementById("ext-pop-panel") as HTMLButtonElement).addEventListener("click", () => {
    closeMenu();
    ctx.showPane("extensions");
  });
  (document.getElementById("ext-pop-reload") as HTMLButtonElement).addEventListener("click", () => {
    closeMenu();
    void reload(true);
  });
  (document.getElementById("ext-pop-manage") as HTMLButtonElement).addEventListener("click", () => {
    closeMenu();
    managePortal();
  });
  (document.getElementById("ext-manage") as HTMLButtonElement).addEventListener("click", managePortal);
  (document.getElementById("ext-reload") as HTMLButtonElement).addEventListener("click", () => void reload(true));
  (document.getElementById("extensions-close") as HTMLButtonElement).addEventListener("click", () => ctx.showPane(""));
  (document.getElementById("ext-dialog-close") as HTMLButtonElement).addEventListener("click", () => dialogBox.close());

  window.setInterval(() => void tick(), POLL);
  return reload();
}
