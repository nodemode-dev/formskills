# FormSkills demo 2: author

Writing skills in FormSkills: start from a draft, let Check hold it to the Agent Skills format as you type, put an edited copy of a released skill beside its original, and package the result as a zip. The window is FormSkills' real one (`frontend/src/main.ts` with its own tokens, layers and styles) running against the same TypeScript stand-in for the engine as demo 1.

## Open it

Double-click `index.html` (it works from `file://`), or serve the repository with any static server:

```
python3 -m http.server 8080
```

and open `/demos/author/`. No backend, no Tauri, no network and no CDN.

## What it shows

- Draft: `release-notes` under Your skills opens in the editor with a sub-skill, a reference and a script. Check reports one error (the name does not match the folder) and two notes (links to files the skill does not hold). Fix them in the editor and watch the count fall, with the preview beside the text.
- Copy against original: a copy of the released `formpdf-harness` skill, edited in two files. The files you changed are marked, and the Original tab shows the released text. Check reports a real finding on the released skill: its description is longer than the 1024 characters the format allows.
- Package as a zip: Download skill saves the skill folder, with its sub-skill, reference and script, as a real zip.
- Start your own: Your skills takes a name and a description and writes SKILL.md from the template, or opens a folder, a SKILL.md or a zip (or a drop anywhere on the page).

## What is sample and what is real

- The window, the Check rules, the template and the zip writer are the app's real code or ports of its engine, shared with demo 1 by path (`../../demo/src`).
- The released skills are the apps' own text, read from their release tags when the demo was built and embedded read-only. The three drafts under Your skills are samples written for the demo (`src/seed.ts`); they and your edits live in this browser's storage under their own key, separate from demo 1's.
- No signature or digest is checked; nothing leaves the page.

## Rebuild

The build output in `assets/` is committed so the demo needs no install. To rebuild it, from this folder:

```
node ../../frontend/node_modules/vite/bin/vite.js build --config ./vite.config.mjs
node ../../frontend/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

It writes `assets/demo.js` and `assets/demo.css` only and never clears the folder. The sibling app repositories must sit beside this one with their release tags, or `FORM_FAMILY_DIR` must name their parent folder.

The other demos: `../../demo/index.html` (explore) and `../install/index.html` (install and manage).
