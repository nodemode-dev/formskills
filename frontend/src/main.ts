import list from "../../core/data/apps.json";

type App = (typeof list.apps)[number];

declare const __APP_VERSION__: string;

const STATES: Record<string, string> = { live: "Live", public: "Public", prelaunch: "Coming" };
const HERE = "Not read yet. formskills will fetch them from the app's latest release.";

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
  foot.append(el("span", "card-where", app.skills), el("span", `state state-${app.state}`, STATES[app.state] ?? app.state));
  button.append(head, el("span", "card-summary", app.summary), foot);
  li.append(button);
  return li;
}

const chipsBox = document.getElementById("chips") as HTMLDivElement;
const cardsBox = document.getElementById("cards") as HTMLUListElement;
const count = document.getElementById("count") as HTMLParagraphElement;
const empty = document.getElementById("detail-empty") as HTMLElement;
const detail = document.getElementById("detail-app") as HTMLElement;

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
  setText(field("here"), HERE);
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

document.documentElement.classList.remove("booting");
