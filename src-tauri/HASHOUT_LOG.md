# HASHOUT_LOG · src-tauri · formskills

Living log for formskills' desktop shell. Source files stay comment-free; what they would have said lives here.

Current build version: v0.10.3
Last updated: 2026-11-10 · install_remove for a project folder that is gone; 2026-11-03 · v0.7.5 the bundle names the publisher and the licence; 2026-10-25 · the install commands; one app at a time, pins, your own skills; search and the check commands; the edit commands; read_file and download; library and refresh; the shell

## v0.10.3 · review fixes {#v0-10-3}

### src/lib.rs · install_remove finds the record of a project that is gone
- refers-to: src-tauri/src/lib.rs :: install_remove · core/src/install.rs :: Target::recorded
- kind: fix
- logged: v0.10.3 · 2026-11-10

`install_remove` built its target with `Target::new`, which canonicalizes the project path and fails once the project folder is deleted or moved, so Remove on a "No longer in the folder" row could never clear it. It now uses `Target::recorded`, which falls back to the exact recorded project string (see the core log, v0.10.3). `install_update` keeps `Target::new`, so "Install again" on such a row reports the missing folder instead of recreating it. Not compiled here (the shell needs system WebKit, which this machine lacks); the call has the same signature as `Target::new` and was read twice.

## v0.9.0 · the formext:// protocol and the extension commands {#v0-9-0}

### src/extensions.rs, src/lib.rs, tauri.conf.json · formext://
- refers-to: src-tauri/src/extensions.rs :: SCHEME, base, prefix, split, decode, serve, extensions_list, extensions_stamp, extension_requests, extension_answer, extension_save, open_portal · src-tauri/src/lib.rs :: run · src-tauri/tauri.conf.json :: app.security.csp
- kind: decision
- logged: v0.9.0 · 2026-11-07

formskills has no HTTP server, so extension files are served on an asynchronous URI scheme protocol, `formext`, in the contract's shape `formext://{id}/{version}/{path}`. macOS and Linux webviews keep the id as the host; Windows webviews reach a custom scheme as `http://formext.localhost/{id}/{version}/{path}`, so `split` takes either form and `base` gives the window the one its platform uses. Every answer, 404 included, carries the contract's headers from `extensions::headers_for`; HTML gets the CSP with the extension's own absolute prefix as BASE (`formext://{id}/{version}/`), since a sandboxed frame's opaque origin never matches `'self'`. The list is resolved again for every file, so a reload in FormPortal is seen at once and a refused or removed extension serves nothing. The window CSP adds `frame-src formext: http://formext.localhost`. Each request runs on its own thread so a large file never holds the webview. The commands are thin: `extensions_list` (the listing with this base), `extensions_stamp`, `extension_requests` and `extension_answer` (the command line's queue), `extension_save` (Downloads), `open_portal` (the fixed `formai://extensions?product=formskills` through `open`, `cmd /C start` or `xdg-open`; no other address). Not compiled here (no GTK in the round's machine); read against Tauri 2.12.5's `register_asynchronous_uri_scheme_protocol` and `UriSchemeResponder::respond`.

## v0.8.2 · the splash, the rounded corners and the reveal {#v0-8-2}

### src/reveal.rs, src/lib.rs, tauri.conf.json · splash window, reveal contract
- refers-to: src-tauri/src/reveal.rs :: mark_launch, conceal, app_ready, show_main, set_seen, round_splash · src-tauri/src/lib.rs :: run · src-tauri/tauri.conf.json :: app.windows, app.macOSPrivateApi
- kind: decision
- logged: v0.8.2 · 2026-11-07

The owner asked for every Form desktop app to carry formvis's splash. `reveal.rs` is formvis's file with the traffic-light call dropped (formskills has the native title bar) and the done hook named `formskillsSplashDone`. The splash stays up until the page has painted and 2.6 s have passed since launch, its bar finishes in 220 ms, then the main window appears whole and the splash closes; after 20 s the main window is shown anyway. On macOS the main window is on screen at alpha 0 and lets clicks through until then, because a hidden web view stops its animation frames; elsewhere it is built hidden by the config and shown at once by `setup` (formvis builds it visible there), so it is up while the page paints. `round_splash` makes the splash window non-opaque with a clear background and masks the content layer to a 16 px radius; that needs `macOSPrivateApi` and tauri's `macos-private-api` feature, plus objc2 and objc2-app-kit on macOS only. Both windows are listed in the capability. The page calls `app_ready` through `withGlobalTauri`; the command needs no permission row because `build.rs` declares no app manifest. The splash's inline script runs under the CSP because Tauri adds the hash of an inline script in a frontend HTML file to `script-src` at build. Differences from formvis: the main window comes from the config rather than a builder (the windows have no sidecar to wait for), and its `backgroundColor` is the reveal's `#0a0a0a` instead of the old `#14161b`. Not compiled here: `cargo check` was skipped on the shared machine; the Rust was read line by line against formvis's `reveal.rs` and `main.rs`. The splash page was rendered at 360 by 200 with a transparent page background.

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
