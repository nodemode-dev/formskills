# HASHOUT_LOG · src-tauri · formskills

Living log for formskills' desktop shell. Source files stay comment-free; what they would have said lives here.

Current build version: v0.1.0
Last updated: 2026-10-24 · the shell

## v0.1.0 · the shell {#v0-1-0}

### lib.rs · check the list, then open the window
- refers-to: src/lib.rs :: run · src/main.rs :: main
- kind: decision
- logged: v0.1.0 · 2026-10-24

`run` reads the bundled list first and exits with the reason if it is not valid, so a broken build never opens an empty window; then it starts Tauri. `main` returns that exit code. No commands yet: the page needs none until v0.2.0 fetches skills.

### tauri.conf.json · one window, no plugins
- refers-to: tauri.conf.json, capabilities/default.json
- kind: rationale
- logged: v0.1.0 · 2026-10-24

One `main` window, 1040 by 720, resizable down to 640 by 480, `backgroundColor` set to the dark ground so the native window never shows white before the page paints. Capability `core:default` only. Identifier `ai.nodemode.formskills` (family plan, Q5); dev URL `localhost:5630`. Bundle resources carry `LICENSE` and `NOTICE.md` (the build stops when either is missing). Icons in `icons/` are generated from `assets/formskills_icon.png` with `npx tauri icon` (desktop sizes kept; the Android and iOS folders it also writes were removed).

Checked: `cargo build --workspace --locked` with no warnings; the debug window under Xvfb against the dev server, alive after 18 seconds, showing the chips, the cards, the empty detail pane and the source line.
