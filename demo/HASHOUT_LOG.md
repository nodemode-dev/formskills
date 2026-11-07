# HASHOUT_LOG · demo · formskills

Living log for the browser demo. Source files stay comment-free; what they would have said lives here.

Current build version: v0.8.0
Last updated: 2026-11-07 · the demo

## v0.8.0 · the demo {#v0-8-0}

### demo/src/shim.ts · the engine stand-in
- refers-to: src/shim.ts :: handle, library, describe, sourceOf, install, installedRows, saved, importOwn, exportInstalls · src/entry.ts
- kind: decision
- logged: v0.8.0 · 2026-11-07

The window already talks to its engine through `window.__TAURI__.core.invoke`, so the demo sets that global before `main.ts` runs (entry.ts imports the shim first, and the bundle keeps import order) and implements each command the window calls. The window itself is not forked or edited. The library reports every app as `kept` with the reason "this demo carries sample skills and reads no network", because `release` would claim a signed, checked catalogue the demo does not have; the status line then names the sample catalogue.

### demo/src/model.ts · ports
- refers-to: src/model.ts :: frontMatter, validate, indexSkills, search, template, readText
- kind: decision
- logged: v0.8.0 · 2026-11-07

Front matter reading, the Check rules and limits, search scoring, the SKILL.md template and the path rule of `read_text` are ported from `core/src/skills.rs`, `check.rs`, `search.rs`, `own.rs` and `library.rs`. Digests use a small synchronous hash, not SHA-256: they only detect change in the demo's own copies, and `crypto.subtle` is not guaranteed on `file://`.

### demo/src/samples.ts · sample skills
- refers-to: src/samples.ts :: sampleTree, releases · core/data/apps.json
- kind: decision
- logged: v0.8.0 · 2026-11-07

Skills are generated, not copied: CLAUDE.md forbids carrying an app's skills in this repository, and the real ones are other apps' text. Two sample releases per app differ in one SKILL.md, one limits reference and one sub-skill, so pinning the earlier release shows the "original changed" flag on a copy and Mark as seen. formpdf and formvfx conventions carry one broken link so Check shows a note on a released skill.

### demo/src/import.ts, zip.ts · opening your own files
- refers-to: src/import.ts :: organise, fromDrop, fromFileList, openFirst · src/zip.ts :: writeZip, readZip
- kind: decision
- logged: v0.8.0 · 2026-11-07

A folder, a SKILL.md or a zip becomes one or more Your skills; a skill root is the shallowest folder holding a SKILL.md. Zips are read with `DecompressionStream("deflate-raw")`, no library, refusing paths that leave the folder, more than 2000 entries or 24 MB. Zips are written stored (not deflated) with CRC-32 and the fixed 1980 stamp the engine uses. Opening a skill clicks the real Your skills card and the new skill's button, so the window runs its own path and nothing is rebuilt.

### index.html, build · page and bundle
- refers-to: index.html · ../frontend/vite.demo.config.ts · tsconfig.json
- kind: decision
- logged: v0.8.0 · 2026-11-07

index.html is the window's markup plus a demo note and the try-this list (static, in the empty detail pane), the import row in the Your skills pane, a save-as-zip button in the Installed pane, and a fixed drop overlay on `--z-overlay`; none of them moves a node already on screen. The bundle is a lib-mode IIFE (`assets/demo.js`, `assets/demo.css`) loaded by a deferred classic script, because Chrome refuses module scripts from `file://`. The config lives in `frontend/` so it resolves Vite from the lockfile; `server.host` is false, ports 5632 and 5633. `demo/tsconfig.json` has the `types` of the window's config emptied and a `typeRoots` pointing at `frontend/node_modules`.
