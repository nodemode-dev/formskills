import list from "../../core/data/apps.json";
import type { Files, Tree } from "./model";

type Vocab = { nouns: [string, string, string]; verbs: [string, string, string]; goal: string };

const VOCAB: Record<string, Vocab> = {
  formmd: { nouns: ["page", "database view", "backlink"], verbs: ["write a page", "link pages", "build a database view"], goal: "notes and databases kept as plain Markdown files" },
  format: { nouns: ["conversation", "artifact", "document"], verbs: ["start a chat", "pin an artifact", "draft a document"], goal: "chat and agent work" },
  formcut: { nouns: ["clip", "timeline", "caption"], verbs: ["cut a clip", "grade a shot", "caption a scene"], goal: "video editing" },
  formdesign: { nouns: ["page", "spread", "style"], verbs: ["lay out a page", "apply a style", "publish a PDF"], goal: "page layout" },
  formencoder: { nouns: ["preset", "queue", "export"], verbs: ["pick a preset", "queue a batch", "check an export"], goal: "converting and compressing media" },
  formlit: { nouns: ["photo", "album", "edit"], verbs: ["rate a photo", "build an album", "develop an image"], goal: "a photo library" },
  formmcp: { nouns: ["tool", "server", "connection"], verbs: ["list a tool", "connect a server", "call a tool"], goal: "connecting agents to the apps' tools" },
  formpath: { nouns: ["path", "anchor", "layer"], verbs: ["draw a path", "edit an anchor", "export a layer"], goal: "vector drawing" },
  formpdf: { nouns: ["page", "form field", "signature"], verbs: ["rotate a page", "fill a form field", "merge two files"], goal: "PDF work" },
  formai: { nouns: ["app", "download", "update"], verbs: ["find an app", "install an app", "check an update"], goal: "installing and launching the Form apps" },
  formpromo: { nouns: ["promo", "scene", "caption"], verbs: ["storyboard a promo", "time a scene", "render a cut"], goal: "short promotional videos" },
  formref: { nouns: ["source", "citation", "note"], verbs: ["add a source", "cite a passage", "file a note"], goal: "reference and citations" },
  formsculpt: { nouns: ["mesh", "brush", "layer"], verbs: ["sculpt a mesh", "tune a brush", "bake a layer"], goal: "sculpting" },
  formslide: { nouns: ["slide", "layout", "speaker note"], verbs: ["add a slide", "pick a layout", "write a speaker note"], goal: "slide decks" },
  formsurface: { nouns: ["material", "map", "tile"], verbs: ["author a material", "paint a map", "tile a texture"], goal: "textures and materials" },
  formvfx: { nouns: ["effect", "keyframe", "composition"], verbs: ["add an effect", "set a keyframe", "render a composition"], goal: "motion and effects" },
  formvis: { nouns: ["layer", "mask", "adjustment"], verbs: ["add a layer", "paint a mask", "apply an adjustment"], goal: "image editing" },
  formwav: { nouns: ["track", "clip", "effect"], verbs: ["trim a clip", "mix a track", "export a mix"], goal: "audio editing" },
  formweb: { nouns: ["page", "component", "build"], verbs: ["compose a page", "reuse a component", "preview a build"], goal: "building websites" },
};

const FALLBACK: Vocab = { nouns: ["item", "view", "export"], verbs: ["open an item", "change a view", "export the result"], goal: "this app's work" };

const FENCE = "```";

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function cap(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

export type Flavor = "latest" | "earlier";

function driving(app: { id: string; name: string; licence: string; kind: string }, v: Vocab, index: number, flavor: Flavor): Files {
  const files: Files = new Map();
  const folder = `${app.id}-driving`;
  const [a, b] = [slug(v.nouns[0]), slug(v.nouns[1])];
  const later = flavor === "latest";
  files.set(
    "SKILL.md",
    [
      "---",
      `name: ${folder}`,
      `description: "Works ${app.name} through its own tools to ${v.verbs[0]}, ${v.verbs[1]} and ${v.verbs[2]}${later ? "" : " (older wording)"}. Use when the person asks for ${v.goal} and ${app.name} is open or its tools are available."`,
      `license: ${app.licence}`,
      "---",
      "",
      `# ${app.name}, driving`,
      "",
      `Demo sample: this skill was generated for the formskills demo to show how a released skill reads. It is not the text ${app.name} ships.`,
      "",
      `${app.name} is for ${v.goal}. This skill routes a request to the part that handles it.`,
      "",
      "## Before you start",
      "",
      `- Ask which ${v.nouns[0]} the person means before changing anything.`,
      later ? `- Read the current state of the ${v.nouns[1]} first, then change it.` : `- Change the ${v.nouns[1]}, then read it back.`,
      `- Report what changed in one sentence per ${v.nouns[2]}.`,
      "",
      "## Routes",
      "",
      "| The person wants | Read |",
      "| --- | --- |",
      `| to work with a ${v.nouns[0]} | [${cap(a)}](sub-skills/${a}/SUB-SKILL.md) |`,
      ...(later ? [`| to work with a ${v.nouns[1]} | [${cap(b)}](sub-skills/${b}/SUB-SKILL.md) |`] : []),
      `| the words this app uses | [Vocabulary](references/vocabulary.md) |`,
      `| what it cannot do | [Limits](references/limits.md) |`,
      "",
      "## Steps",
      "",
      `1. Find the ${v.nouns[0]} and confirm it with the person.`,
      `2. Pick the route above and follow it.`,
      `3. Check the result by looking at it, not by trusting the tool's reply.`,
      "",
    ].join("\n"),
  );
  files.set(
    `sub-skills/${a}/SUB-SKILL.md`,
    [
      "---",
      `name: ${a}`,
      `description: "How to ${v.verbs[0]} in ${app.name}."`,
      "---",
      "",
      `# ${cap(v.nouns[0])}`,
      "",
      `Use this when the request is about a ${v.nouns[0]}.`,
      "",
      `1. Open the ${v.nouns[0]} and note its name.`,
      `2. ${cap(v.verbs[0])}.`,
      `3. Compare the ${v.nouns[0]} with how it was; say what is different.`,
      "",
      "Back to the [card](../../SKILL.md).",
      "",
    ].join("\n"),
  );
  if (later) {
    files.set(
      `sub-skills/${b}/SUB-SKILL.md`,
      [
        "---",
        `name: ${b}`,
        `description: "How to ${v.verbs[1]} in ${app.name}."`,
        "---",
        "",
        `# ${cap(v.nouns[1])}`,
        "",
        `Use this when the request is about a ${v.nouns[1]}.`,
        "",
        `1. Find the ${v.nouns[1]} the person means.`,
        `2. ${cap(v.verbs[1])}.`,
        `3. Look at the ${v.nouns[2]} it leads to, and say what you see.`,
        "",
        "See also [limits](../../references/limits.md).",
        "",
      ].join("\n"),
    );
  }
  files.set(
    "references/vocabulary.md",
    ["# Vocabulary", "", `The words ${app.name} uses, as this sample uses them.`, "", "| Word | Meaning |", "| --- | --- |", ...v.nouns.map((n) => `| ${n} | a ${n} in ${app.name}, as the person sees it |`), ""].join("\n"),
  );
  files.set(
    "references/limits.md",
    ["# Limits", "", `What an agent should not promise with ${app.name}.`, "", `- It cannot undo work outside ${app.name}.`, `- A ${v.nouns[2]} is only as good as its input.`, ...(later ? [`- Ask before a change that touches every ${v.nouns[0]}.`] : []), ""].join("\n"),
  );
  if (index % 4 === 0) {
    files.set(
      "scripts/inspect.py",
      ["import sys", "", "def main(path):", "    with open(path, 'rb') as handle:", "        data = handle.read()", "    print(len(data), 'bytes')", "", "if __name__ == '__main__':", "    main(sys.argv[1])", ""].join("\n"),
    );
  }
  return files;
}

function conventions(app: { id: string; name: string; licence: string }, v: Vocab, index: number): Files {
  const files: Files = new Map();
  const broken = app.id === "formpdf" || app.id === "formvfx";
  files.set(
    "SKILL.md",
    [
      "---",
      `name: ${app.id}-conventions`,
      `description: "How to name, save and hand over ${v.nouns[0]} work from ${app.name}, so the next person finds it. Use when finishing a job in ${app.name}."`,
      `license: ${app.licence}`,
      `compatibility: "Any agent that reads the Agent Skills format."`,
      "---",
      "",
      `# ${app.name}, conventions`,
      "",
      `Demo sample: generated for the formskills demo.`,
      "",
      "## Naming",
      "",
      `- Name a ${v.nouns[0]} for what it holds, not for the day it was made.`,
      `- Keep one ${v.nouns[2]} per purpose.`,
      "",
      "## Hand over",
      "",
      `Walk through the [checklist](references/checklist.md) before you say a job is done.`,
      ...(broken ? ["", `The longer story is in [the style notes](references/style-notes.md).`] : []),
      "",
      "## Example",
      "",
      FENCE,
      `${slug(v.nouns[0])}-${index + 1}-final`,
      FENCE,
      "",
    ].join("\n"),
  );
  files.set(
    "references/checklist.md",
    ["# Checklist", "", `- [ ] The ${v.nouns[0]} has a plain name.`, `- [ ] The ${v.nouns[2]} opens on a fresh start.`, "- [ ] The person knows where the result was saved.", ""].join("\n"),
  );
  return files;
}

export function sampleTree(flavor: Flavor): Map<string, Tree> {
  const out = new Map<string, Tree>();
  list.apps.forEach((app, index) => {
    const v = VOCAB[app.id] ?? FALLBACK;
    const tree: Tree = new Map();
    tree.set(`${app.id}-driving`, driving(app, v, index, flavor));
    tree.set(`${app.id}-conventions`, conventions(app, v, index));
    out.set(app.id, tree);
  });
  return out;
}

export function releases(index: number): [string, string] {
  return [`0.${4 + (index % 5)}.${index % 3}`, `0.${3 + (index % 5)}.${index % 3}`];
}
