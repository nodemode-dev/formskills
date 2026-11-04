# HASHOUT_LOG · src-tauri · formskills

Living log for formskills' desktop shell. Source files stay comment-free; what they would have said lives here.

Current build version: v0.7.5
Last updated: 2026-11-03 · v0.7.5 the bundle names the publisher and the licence; 2026-10-25 · the install commands; one app at a time, pins, your own skills; search and the check commands; the edit commands; read_file and download; library and refresh; the shell

## v0.7.5 · the publisher and the licence in the bundle {#publisher}

### tauri.conf.json, Cargo.toml · publisher, copyright, license, licenseFile, authors
- refers-to: src-tauri/tauri.conf.json :: bundle.publisher, bundle.copyright, bundle.license, bundle.licenseFile; Cargo.toml :: workspace.package.authors
- kind: decision
- logged: v0.7.5 · 2026-11-03

The launch punch list (2026-11-03): the About of a downloaded app says NodeAgentc, Inc., not nodemode-ai, and lists the licence. formskills has no About of its own: on macOS the application menu's About panel reads the bundle's copyright, and Tauri's default About metadata takes its authors from `bundle.publisher`; tauri-build writes `CompanyName` from `bundle.publisher` into the Windows version resource, and the .deb's Maintainer is the crate's `authors`. The bundle now names the publisher, `licenseFile` points at the LICENSE at the root (`../LICENSE` from `src-tauri`) beside the `license` (GPL-3.0-only) it already named, and `authors` is the company. Checked here: the JSON parses; no build was run.

## v0.7.0 · the install commands {#v0-7-0}

### lib.rs · install_skills, installed, install_update, install_remove
- refers-to: src-tauri/src/lib.rs :: install_skills, installed, install_update, install_remove
- kind: decision
- logged: v0.7.0 · 2026-10-25

The page sends an app id (or `yours`), a skill folder or none, the agent names, an optional project path and the copy and force flags; the shell passes the library it holds to `install::install_many` and returns the typed outcomes, so the batch logic and its JSON shape live in core (the shell has no serde_json). Update and remove build a `Target` from the agent and project, which checks both. Checked in the real window: Install all for formcut into Claude Code wrote both skills into the scratch home's `.claude/skills`, and Installed listed them.

## v0.6.0 · one app at a time, pins, your own skills {#v0-6-0}

### lib.rs · read_one, refresh_app, pin, own_list, own_new
- refers-to: src-tauri/src/lib.rs :: read_one, refresh_app, pin, own_list, own_new
- kind: decision
- logged: v0.6.0 · 2026-10-25

`read_one` loads a single app (with or without a fresh download) and puts it into the library the shell holds, then returns the whole library, so the page's one render path stays the same. `pin` refuses a version the app's current releases list does not hold before writing `pins.json`. Your own skills need no root in the library: they are read and written through the edit commands with the app name `yours`. Checked in the real window: a pin chosen in the Release row wrote `pins.json` and downloaded 1.97.1 from the signed loopback catalogue.

## v0.5.0 · search and the check commands {#v0-5-0}

### lib.rs · search, check_skill, edit_check
- refers-to: src-tauri/src/lib.rs :: search, check_skill, edit_check
- kind: decision
- logged: v0.5.0 · 2026-10-25

`search` runs over the library the shell already holds (the last `library` or `refresh`), so it never reads the catalogue or the network; before the first read it says so. `check_skill` takes an app id and a skill folder, refuses a folder the app's index does not list, and checks inside the app's skills folder. `edit_check` checks your copy through `edits::validate`, which applies the same plain-name check as every edit command. All three run off the main thread and send no path to the page.

## v0.4.0 · the edit commands {#v0-4-0}

### lib.rs · edits, edit_start, edit_read, edit_write, edit_seen, edit_discard, edit_download
- refers-to: src/lib.rs :: original, library_apps, edits, edit_start, edit_read, edit_write, edit_seen, edit_discard, edit_download
- kind: decision
- logged: v0.4.0 · 2026-10-24

Each passes an app id, a skill folder and, for files, a path in the skill to `edits.rs`, off the main thread; the original (for the flag) comes from the managed library, so the page never names a folder. `edit_start` and `edit_seen` need the original read; the others work without it. Checked in the real window under Xvfb driven with xdotool: FormCut, a skill, Edit a copy, typing (saved to the copy on disk; the original file unchanged); the app quit, the original changed on disk, the app started again: the skill card reads "Your copy · original updated".

## v0.3.0 · read_file and download {#v0-3-0}

### lib.rs · the window asks by app id and path, never by folder
- refers-to: src/lib.rs :: Shown, read, entry, read_file, download, run
- kind: decision
- logged: v0.3.0 · 2026-10-24

The last library read is kept in managed state (`Shown`), with each app's skills folder, which is never sent to the page. `read_file` takes an app id and a path in the set and reads it through `library::read_text` in that folder; `download` packs one skill or the app's set through `pack::archive` into the Downloads folder and returns the saved path. Both run off the main thread. So the page cannot name a folder on disk, only a file the library already listed. Checked in the real window under Xvfb, driven with xdotool: the FormCut chip, Download all (the zip appeared in the downloads folder), and opening a skill.

## v0.2.0 · library and refresh {#v0-2-0}

### lib.rs · two commands, off the main thread
- refers-to: src/lib.rs :: read, library, refresh, run
- kind: decision
- logged: v0.2.0 · 2026-10-24

`library` returns the engine's `Library` (the catalogue's note, the dev mode and its folders, and for each app its source and skills); `refresh` is the same with every asset downloaded again. Both run in `spawn_blocking`, because the catalogue may wait 8 s and each asset up to 60 s. Checked in the real window under Xvfb in dev mode against 17 checkouts: the status line and every card show the real counts and sources. This file was rewritten whole for v0.2.0 instead of edited by region (it was 15 lines); recorded in the sidecar's BUILD_NOTES.

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
