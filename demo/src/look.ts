const SHOTS: Record<string, string> = {
  formmd: "form.md",
  formcut: "formcut",
  formslide: "formdeck",
  formencoder: "formencoder",
  formlit: "formlit",
  formpdf: "formpdf",
  formvfx: "formvfx",
  formvis: "formvis",
  formwav: "formwav",
};

const CHECKED = "signature and digest checked";
const HONEST = "as it stood at the app's latest release tag when this demo was built; nothing here is signature or digest checked";

const cards = document.getElementById("cards") as HTMLElement;
const detail = document.getElementById("detail-app") as HTMLElement;
const shot = document.getElementById("demo-shot") as HTMLElement;
const shotImg = shot.querySelector("img") as HTMLImageElement;
const what = document.getElementById("install-what") as HTMLElement;
const here = detail.querySelector('[data-f="here"]') as HTMLElement;
const KEPT_LINE = "kept from an earlier check. The latest could not be read: ";
const TAGGED_LINE = "as tagged when this demo was built. ";

cards.addEventListener("click", (event) => {
  const card = (event.target as Element).closest<HTMLElement>(".card[data-app]");
  const id = card?.dataset.app ?? "";
  const file = SHOTS[id];
  detail.dataset.app = id;
  if (file) {
    const src = `media/shots/${file}.webp`;
    if (!shotImg.src.endsWith(src)) shotImg.src = src;
    shotImg.alt = `${card?.querySelector(".card-name")?.textContent ?? "The app"}, a window of the app`;
  }
  shot.hidden = !file;
});

document.querySelectorAll<HTMLElement>("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector<HTMLElement>(`.card[data-app="${button.dataset.open}"] .card-hit`)?.click();
  });
});

new MutationObserver(() => {
  const line = here.textContent ?? "";
  if (line.includes(KEPT_LINE)) here.textContent = line.replace(KEPT_LINE, TAGGED_LINE);
}).observe(here, { childList: true, characterData: true, subtree: true });

new MutationObserver(() => {
  const text = what.textContent ?? "";
  if (text.includes(CHECKED)) what.textContent = text.replace(CHECKED, HONEST);
}).observe(what, { childList: true, characterData: true, subtree: true });
