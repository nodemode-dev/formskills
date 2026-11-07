# FormSkills demo 3: install

Installing and managing skills in FormSkills: install into Claude Code, Codex and Cursor targets, see what an update changes file by file, pin an app to an earlier release, and read what the Trust page promises. The window is FormSkills' real one (`frontend/src/main.ts` with its own tokens, layers and styles) running against the same TypeScript stand-in for the engine as demo 1.

## Open it

Double-click `index.html` (it works from `file://`), or serve the repository with any static server:

```
python3 -m http.server 8080
```

and open `/demos/install/`. No backend, no Tauri, no network and no CDN.

## What it shows

- Installed: five installs in virtual agent folders (Claude Code and Codex for you, Cursor for you, Claude Code in a project folder). Both formportal skills were installed from an earlier release, so the list offers Update.
- What an update changes: under the list, pick an install and a file and read the diff between what is installed and the release you follow, with a status per file (changed, new, removed, same), line counts and SHA-256 digests. Press Update in the list and the install settles to "all files match the release".
- Pin a release: on FormPortal's page choose Keep 0.54.3; installs and updates then follow that release, and the page says the newer one is not taken.
- Install more: Install all on any app, tick Claude Code, Codex and Cursor, choose you or a project folder, and read the path each skill lands in before pressing Install. Installed saves the virtual folders as a real zip.
- Trust: the real Trust page, with a header note on what this demo does and does not verify.

## What is sample and what is real

- The window, the install paths per agent and the pin rules are the app's real code or ports of its engine, shared with demo 1 by path (`../../demo/src`). The diffs and digests come from the two real FormPortal releases embedded at build time.
- Installs go to a virtual folder in this browser, never to disk, under their own storage key separate from demo 1's. The demo has no modified-in-place or missing states and does not read the signed catalogue or check a signature; the page says so.

## Rebuild

The build output in `assets/` is committed so the demo needs no install. To rebuild it, from this folder:

```
node ../../frontend/node_modules/vite/bin/vite.js build --config ./vite.config.mjs
node ../../frontend/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

It writes `assets/demo.js` and `assets/demo.css` only and never clears the folder. The sibling app repositories must sit beside this one with their release tags, or `FORM_FAMILY_DIR` must name their parent folder.

The other demos: `../../demo/index.html` (explore) and `../author/index.html` (author).
