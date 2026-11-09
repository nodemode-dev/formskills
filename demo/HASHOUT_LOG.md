# HASHOUT_LOG · demo · formskills

Living log for the browser demo. Source files stay comment-free; what they would have said lives here.

Current build version: v0.10.0
Last updated: 2026-11-07 · real skills, icons and screenshots; the demo

## v0.10.0 · opened inside the app {#v0-10-0}

### src/shim.ts, src/store.ts · the stand-in only, storage optional
- refers-to: src/shim.ts :: window.__TAURI__ · src/store.ts :: stored, memory, load, save · ../frontend/src/demos.ts
- kind: decision
- logged: v0.10.0 · 2026-11-09

The app now opens all three demos in a sandboxed frame (see the frontend log, v0.10.0). The shim defines `__TAURI__` with `Object.defineProperty` and throws if the value the page sees is not its own, so a webview that injected a fixed global stops the demo instead of letting the window call the real engine. An opaque-origin frame throws on `localStorage` itself, so the author and install seeds were lost and those demos opened empty; `store.ts` now keeps the last saved state in memory and reads it back when storage throws. In a browser nothing changes.

## v0.8.1 · real media {#v0-8-1}

### demo/src/family.ts, shim.ts, ../frontend/vite.family-skills.ts · the apps' real skills
- refers-to: src/family.ts :: shipped · src/shim.ts :: currentOf, library, pin · ../frontend/vite.family-skills.ts :: familySkills
- kind: decision
- logged: v0.8.1 · 2026-11-07

The owner found generated samples dull, and the brief for this pass asks for the family's real released skills. CLAUDE.md says an app's skills are never copied into this repository, so no skill file is stored in the tree: a Vite plugin (the virtual module `virtual:family-skills`) runs `git show` on each sibling repository's release tags at build time and the bundle embeds the text read-only, which is the fallback the brief names. The released skills are the latest tag's, not the checkout's, because formskills never follows unreleased work (formpdf and formportal differ between their tag and main). The two newest tags whose skills differ become the two releases (a tag with the same skills as the one after it is skipped), so pinning is real: FormPortal v0.54.3 against v0.60.0 differs in eleven files and flags a copy as changed. The sibling folder is the parent of this repository, or `FORM_FAMILY_DIR`. Apps with no sibling repository are reported as `missing`, the window's own state, and show no skills; nothing is invented for them. `samples.ts` was deleted since nothing uses it.

### demo/src/look.ts, ../media · icons, screenshots, the opening pane
- refers-to: src/look.ts · media/media.css · index.html :: #detail-empty, #demo-shot
- kind: decision
- logged: v0.8.1 · 2026-11-07

The docs hero captures of the sibling repos were used first and then dropped: they show photographs of unverifiable source and licence. The screenshots are now the sibling demos' own verified opening screens (sidecar `demo-screenshot.png`), nine apps; formMCP and formportal captures still showed those old hero images, so those two are icon only. The strip and the app pane figure are 16 by 9 boxes. The eight apps without skills take their icons from the family icon pack in formtray. On app pages the window says a kept release's "latest could not be read", which reads like a fault here; an observer on the "Skills here" line rewrites that clause to "as tagged when this demo was built" and the reason now states that no signature or digest is checked.

Icons are painted by CSS on `.card-head::before` and `#detail-app .detail-head::before`, keyed by the cards' existing `data-app`, so the window's nodes are not touched; apps without an icon keep a quiet square so every card has the same indentation. `media/media.css` is a plain stylesheet outside the Vite build, because Vite would hash and move the images it finds in bundled CSS and `emptyOutDir` would clear them. The screenshot sits in a figure with a fixed 16 by 10 box in the app pane, hidden for apps without one in the same task that shows the pane, so nothing is repainted. The opening pane is static markup: an icon wall whose buttons click the real cards, three screenshots, then the note and the try list.

### demo/src/look.ts · the install line
- refers-to: src/look.ts :: MutationObserver on #install-what
- kind: decision
- logged: v0.8.1 · 2026-11-07

The window says a released skill is "signature and digest checked", which the demo does not do. The window is not edited; a MutationObserver rewrites that phrase in the same microtask as the window's write, before paint, so the false wording is never drawn. The `kept` reason and the catalogue line now say the same.

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

### demo/src/samples.ts · sample skills (replaced in v0.8.1)
- refers-to: src/family.ts · ../frontend/vite.family-skills.ts
- kind: decision
- logged: v0.8.0 · 2026-11-07

v0.8.0 generated its skills because CLAUDE.md forbids carrying an app's skills in this repository. v0.8.1 replaced them (see the v0.8.1 entry) and `samples.ts` is gone.

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
