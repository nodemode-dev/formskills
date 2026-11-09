export const DEMOS: Record<string, { title: string; page: string }> = {
  explore: { title: "Explore: read, search and check skills", page: "demo/index.html" },
  author: { title: "Author: write a skill and package it", page: "demos/author/index.html" },
  install: { title: "Install: installs, updates and pins", page: "demos/install/index.html" },
};

const stage = document.getElementById("demo-stage") as HTMLElement | null;
const frame = document.getElementById("demo-frame") as HTMLIFrameElement | null;
const stageTitle = document.getElementById("demo-stage-title") as HTMLElement | null;
const exitButton = document.getElementById("demo-exit") as HTMLButtonElement | null;
const helpOpen = document.getElementById("help-open") as HTMLButtonElement | null;
const helpPop = document.getElementById("help-pop") as HTMLElement | null;
let returnFocus: HTMLElement | null = null;

function setHelp(open: boolean): void {
  if (!helpOpen || !helpPop) return;
  helpPop.hidden = !open;
  helpOpen.setAttribute("aria-expanded", String(open));
}

export function openDemo(id: string): boolean {
  const demo = DEMOS[id];
  if (!demo || !stage || !frame || !stageTitle) return false;
  setHelp(false);
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  stageTitle.textContent = demo.title;
  stage.dataset.demo = id;
  frame.src = new URL(demo.page, document.baseURI).href;
  stage.hidden = false;
  exitButton?.focus();
  return true;
}

export function closeDemo(): void {
  if (!stage || !frame || stage.hidden) return;
  stage.hidden = true;
  delete stage.dataset.demo;
  frame.src = "about:blank";
  returnFocus?.focus();
  returnFocus = null;
}

if (stage && frame) {
  document.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const item = target?.closest<HTMLElement>("[data-demo]");
    if (item && !stage.contains(item)) {
      openDemo(item.dataset.demo ?? "");
      return;
    }
    if (helpPop && !helpPop.hidden && !target?.closest("#help-menu")) setHelp(false);
  });
  helpOpen?.addEventListener("click", () => setHelp(helpPop ? helpPop.hidden !== false : false));
  exitButton?.addEventListener("click", closeDemo);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!stage.hidden) closeDemo();
    else if (helpPop && !helpPop.hidden) {
      setHelp(false);
      helpOpen?.focus();
    }
  });
  document.addEventListener("formskills:demo-open", (e) => {
    openDemo(String((e as CustomEvent<string>).detail ?? ""));
  });
}
