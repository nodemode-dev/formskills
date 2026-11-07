const root = document.documentElement;
const pick = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const note = pick<HTMLElement>("bench-note");
const steps = [...document.querySelectorAll<HTMLButtonElement>("[data-step]")];
const sum = pick<HTMLElement>("findings-sum");
const saveState = pick<HTMLElement>("save-state");
const reader = pick<HTMLElement>("reader");
const readerName = pick<HTMLElement>("reader-name");
const side = pick<HTMLElement>("side");

function until<T>(find: () => T | null | undefined | false, watch: Element, ms = 4000): Promise<T | null> {
  return new Promise((resolve) => {
    const now = find();
    if (now) {
      resolve(now);
      return;
    }
    const done = (value: T | null): void => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.clearInterval(poll);
      resolve(value);
    };
    const check = (): void => {
      const found = find();
      if (found) done(found);
    };
    const observer = new MutationObserver(check);
    const poll = window.setInterval(check, 40);
    const timer = window.setTimeout(() => done(null), ms);
    observer.observe(watch, { childList: true, subtree: true, characterData: true, attributes: true });
  });
}

const body = document.body;

function skillButton(listId: string, title: string): HTMLElement | null {
  return pick<HTMLElement>(listId).querySelector<HTMLElement>(`.skill-hit[title^="${title}"]`);
}

async function openDraft(): Promise<void> {
  pick<HTMLButtonElement>("own-card").click();
  const draft = await until(() => skillButton("own-list", "Edit release-note"), pick("own-list"));
  draft?.click();
  await until(() => !reader.hidden && readerName.textContent === "release-notes" && saveState.textContent === "Saved" && pick("findings-list").children.length > 0, body);
}

async function openCopy(): Promise<void> {
  document.querySelector<HTMLElement>('.card[data-app="formpdf"] .card-hit')?.click();
  const skill = await until(() => skillButton("skill-list", "Read formpdf-harness"), pick("skill-list"));
  skill?.click();
  const toggle = pick<HTMLButtonElement>("edit-toggle");
  await until(() => !reader.hidden && !toggle.hidden && /your copy/i.test(toggle.textContent ?? ""), body);
  toggle.click();
  await until(() => pick<HTMLTextAreaElement>("editor").value.includes("name: formpdf-harness"), body);
  pick<HTMLTextAreaElement>("editor").scrollTop = 0;
  pick<HTMLButtonElement>("tab-original").click();
}

async function packageIt(): Promise<void> {
  const inDraft = !reader.hidden && readerName.textContent === "release-notes";
  if (!inDraft) await openDraft();
  pick<HTMLButtonElement>("download-copy").click();
}

function mark(step: string): void {
  for (const b of steps) b.setAttribute("aria-pressed", String(b.dataset.step === step));
}

steps.forEach((button) => {
  button.addEventListener("click", () => {
    const step = button.dataset.step ?? "";
    mark(step);
    if (step === "draft") void openDraft();
    else if (step === "compare") void openCopy();
    else if (step === "package") void packageIt();
  });
});

function advice(): string {
  const text = sum.textContent ?? "";
  const errors = Number(/(\d+) format error/.exec(text)?.[1] ?? 0);
  const notes = Number(/(\d+) note/.exec(text)?.[1] ?? 0);
  if (!reader.hidden && !side.hidden && readerName.textContent === "formpdf-harness") return "Your copy sits beside the original: switch between Preview and Original, and the files you changed are marked in the list.";
  if (readerName.textContent !== "release-notes" || reader.hidden || !text) return "Open the draft to start. Check runs on every keystroke, in the same rules the engine uses.";
  if (errors) return `Check reports ${errors === 1 ? "an error" : `${errors} errors`}: the name must match the skill's folder, release-notes. Fix it in SKILL.md.`;
  if (notes) return `${notes === 1 ? "One note is" : `${notes} notes are`} left: a link goes to a file the skill does not hold. Click the note's path, then point the link at references/voice.md.`;
  return "Clean. The skill passes the format check; package it with Download skill.";
}

const refresh = (): void => {
  const next = advice();
  if (note.textContent !== next) note.textContent = next;
};
new MutationObserver(refresh).observe(sum, { childList: true, subtree: true, characterData: true });
new MutationObserver(refresh).observe(reader, { attributes: true, attributeFilter: ["hidden"] });
new MutationObserver(refresh).observe(side, { attributes: true, attributeFilter: ["hidden"] });
new MutationObserver(refresh).observe(readerName, { childList: true, characterData: true, subtree: true });

root.classList.add("booting");
void openDraft().then(() => {
  mark("draft");
  refresh();
  root.classList.remove("booting");
});
