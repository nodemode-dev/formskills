import { inspectKey, pendingKey } from "./inspect";

const root = document.documentElement;
const pick = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const note = pick<HTMLElement>("bench-note");
const steps = [...document.querySelectorAll<HTMLButtonElement>("[data-step]")];
const installed = pick<HTMLElement>("installed");
const list = pick<HTMLElement>("installed-list");

const NOTES: Record<string, string> = {
  installed: "Five installs in virtual agent folders. Both formportal skills were installed from an earlier release, so the list offers Update.",
  update: "Choose an install and a file to read exactly what an update would change. Nothing is replaced until you press Update in the list.",
  pin: "FormPortal has two releases with skills. Choose Keep 0.54.3 in the Release row to hold an app back, or Latest to follow it again.",
  install: "Tick Claude Code, Codex or Cursor, for you or one project folder; the path each skill lands in is written out before you press Install.",
  trust: "What the app checks before it writes a file. This demo reads no catalogue and verifies no signature; it only shows installs matching releases.",
};

function until<T>(find: () => T | null | undefined | false, ms = 4000): Promise<T | null> {
  return new Promise((resolve) => {
    const finish = (value: T | null): void => {
      window.clearInterval(poll);
      window.clearTimeout(timer);
      resolve(value);
    };
    const check = (): void => {
      const found = find();
      if (found) finish(found);
    };
    const poll = window.setInterval(check, 40);
    const timer = window.setTimeout(() => finish(null), ms);
    check();
  });
}

function mark(step: string): void {
  for (const b of steps) b.setAttribute("aria-pressed", String(b.dataset.step === step));
  const text = NOTES[step] ?? "";
  if (note.textContent !== text) note.textContent = text;
}

async function openInstalled(): Promise<void> {
  if (installed.hidden) pick<HTMLButtonElement>("installed-open").click();
  await until(() => list.querySelector(".installed-row") && pick("inspect-files").children.length > 0);
}

async function openApp(id: string): Promise<void> {
  document.querySelector<HTMLElement>(`.card[data-app="${id}"] .card-hit`)?.click();
  await until(() => !pick("detail-app").hidden);
}

async function run(step: string): Promise<void> {
  mark(step);
  if (step === "installed") await openInstalled();
  else if (step === "update") {
    await openInstalled();
    inspectKey(pendingKey());
    pick("inspect").scrollIntoView({ block: "start" });
  } else if (step === "pin") {
    await openApp("formai");
    pick("release-pick").scrollIntoView({ block: "center" });
    pick("release-pick").focus();
  } else if (step === "install") {
    await openApp("formvis");
    pick<HTMLButtonElement>("install-app").click();
  } else if (step === "trust") pick<HTMLButtonElement>("trust-open").click();
}

steps.forEach((button) => button.addEventListener("click", () => void run(button.dataset.step ?? "")));

root.classList.add("booting");
void openInstalled().then(() => {
  inspectKey(pendingKey());
  mark("installed");
  root.classList.remove("booting");
});
