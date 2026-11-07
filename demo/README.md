# FormSkills demo

An offline, in-browser demo of FormSkills. It runs the app's real window (`frontend/src/main.ts`, its tokens, layers and styles, its Markdown renderer) against a TypeScript stand-in for the engine, so reading, searching, checking, editing, installing and downloading skills all work on real input.

## Open it

Double-click `index.html` (it works from `file://`), or serve the folder with any static server:

```
python3 -m http.server 8080 --directory demo
```

No backend, no Tauri, no network and no CDN: every script, style and sample is in this folder.

## What it shows

- Read: 19 apps, 38 sample skills, SKILL.md as formatted text, sub-skills and references, links between them followed.
- Search: every skill's text, ranked and matched the way the engine does it.
- Check: the Agent Skills format check, run on a released skill and live while you edit a copy.
- Edit a copy: live preview with the original beside it. Choose the earlier release in the Release row and your copy is flagged as changed in the original; Mark as seen follows it.
- Your skills: write one from the template, or open your own skill folder, a SKILL.md or a zip (or drop it anywhere on the page). It opens in the editor with Check running as you type.
- Install: into a virtual Claude Code, Codex or Cursor folder, for you or for a project path. The Installed page lists, updates and removes them (Remove takes two clicks) and saves the virtual folders as a real zip.
- Download: one skill, an app's set, or your copy, each as a real zip.

## What is sample and what is real

- The window is the real one; only the engine behind it is replaced. The stand-in ports the engine's front matter reader, Check rules, search scoring and template from `core/src`.
- The skills are generated in `demo/src/samples.ts` from the app list in `core/data/apps.json`. They are written for the demo, say so in their first paragraph, and are not the text any Form app ships. Each app has a latest and an earlier sample release.
- The catalogue is not read and nothing is signed or digest checked; the source line says so.
- Installs go to a virtual folder in this browser's storage, never to disk. Your edits, pins and installs are kept in `localStorage` when the browser allows it and the demo works without it.

## Rebuild

The build output is committed so the demo needs no install. To rebuild it:

```
cd frontend
npm ci
npm run build:demo
```

This typechecks `demo/src` and writes `demo/assets/demo.js` and `demo/assets/demo.css` (about 95 KB together). The page loads them as a classic script because browsers refuse module scripts on `file://`.
