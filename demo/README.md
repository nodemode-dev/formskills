# FormSkills demo

An offline, in-browser demo of FormSkills. It runs the app's real window (`frontend/src/main.ts`, its tokens, layers and styles, its Markdown renderer) against a TypeScript stand-in for the engine, so reading, searching, checking, editing, installing and downloading skills all work on real input.

## Open it

Double-click `index.html` (it works from `file://`), or serve the folder with any static server:

```
python3 -m http.server 8080 --directory demo
```

No backend, no Tauri, no network and no CDN: every script, style and sample is in this folder.

## What it shows

- Read: 21 real skills from 11 of the 19 apps, SKILL.md as formatted text, sub-skills and references, links between them followed, with each app's real icon and window screenshot.
- Search: every skill's text, ranked and matched the way the engine does it.
- Check: the Agent Skills format check, run on a released skill and live while you edit a copy.
- Edit a copy: live preview with the original beside it. Choose the earlier release in the Release row and your copy is flagged as changed in the original; Mark as seen follows it.
- Your skills: write one from the template, or open your own skill folder, a SKILL.md or a zip (or drop it anywhere on the page). It opens in the editor with Check running as you type.
- Install: into a virtual Claude Code, Codex or Cursor folder, for you or for a project path. The Installed page lists, updates and removes them (Remove takes two clicks) and saves the virtual folders as a real zip.
- Download: one skill, an app's set, or your copy, each as a real zip.

## What is sample and what is real

- The window is the real one; only the engine behind it is replaced. The stand-in ports the engine's front matter reader, Check rules, search scoring and template from `core/src`.
- The skills are the apps' own. At build time `frontend/vite.family-skills.ts` reads `.claude/skills` from each app repository's latest release tag (and the newest earlier tag whose skills differ) with `git show`, from the folder beside this repository or `FORM_FAMILY_DIR`, and embeds the text read-only in the bundle. Nothing is stored as a skill file in this tree. FormPortal has an earlier release to pin; apps with no repository there show no skills.
- The icons and screenshots in `media/` are the apps' own art; `CREDITS.md` lists each file and its licence.
- The catalogue is not read and nothing is signed or digest checked; the source line and the install pane say so.
- Installs go to a virtual folder in this browser's storage, never to disk. Your edits, pins and installs are kept in `localStorage` when the browser allows it and the demo works without it.

## Rebuild

The build output is committed so the demo needs no install. To rebuild it:

```
cd frontend
npm ci
npm run build:demo
```

This typechecks `demo/src` and writes `demo/assets/demo.js` and `demo/assets/demo.css` (about 2.4 MB together, most of it the skills). The sibling app repositories must be checked out beside this one with their release tags. The page loads them as a classic script because browsers refuse module scripts on `file://`.
