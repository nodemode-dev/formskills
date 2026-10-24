# HASHOUT_LOG · core · formskills

Living log for `formskills-core`, `formskills-cli` and `setup/apps.py`. Source files stay comment-free; what they would have said lives here.

Current build version: v0.4.1
Last updated: 2026-10-24 · registered in formcompiler; personal edited copies; no partial download; reading one file and packing downloads; released skills fetched, checked and kept, and the dev mode; the generated list of apps that ship skills

## v0.4.1 · registered in formcompiler {#v0-4-1}

### core/data/apps.json, build_app · the list from formcompiler 0.4.1, and the build formcompiler runs
- refers-to: core/data/apps.json · build_app · build_app.bat
- kind: decision
- logged: v0.4.1 · 2026-10-24

formcompiler 0.4.1 (7c92f91) registers formMCP, whose `.claude/skills` holds `formmcp-harness`, and formskills, which ships no skills; the regenerated list has 18 apps with formMCP among them. `build_app` and `build_app.bat` follow formtray's (check the tools, run `formskills_oc_install`, run the Tauri CLI from the repository root, log to `build_app.log`); formcompiler's `apps/formskills.json` calls `./build_app --no-install` and `call build_app.bat`. Checked: `./build_app --no-install --bundles deb` on Linux made `formskills_0.4.0_amd64.deb` (binary, LICENSE, NOTICE.md, desktop file, icons), and the release binary, run without a dev server, opened the window with every card and said why it read no skills (no catalogue here).

## v0.4.0 · personal edited copies {#v0-4-0}

### edits.rs · a copy beside the cache, never the original
- refers-to: core/src/edits.rs :: start, read, write, acknowledge, discard, download, list, describe, Record, Edit · core/src/pack.rs :: zip_skills
- kind: decision
- logged: v0.4.0 · 2026-10-24

A copy lives in `edits/<app>/<skill folder>/` under formskills' data folder, with `edits/<app>/<folder>.edit.json` beside it (outside the folder, so the index and zips never include it). `start` copies every file of the original skill into a hidden `.part` folder and renames it into place, and records the base (`release X` or `checkout`) and a SHA-256 of each original file; starting again returns the existing copy. Nothing ever writes to the release cache or to a checkout: the original stays as released, and pruning old releases cannot touch a copy. `write` replaces one existing file of the copy (plain path parts only, resolved inside the copy, at most 2 MB of text), written beside and renamed, and stamps `updated`; new files are not created in v0.4.0. `describe` reports `edited` (copy files that differ from the recorded originals) and `original_changed` (original files whose digest differs from the record, or added or removed): the "original updated" flag. `acknowledge` (Mark as seen) records the original's current digests and base and leaves the copy's text alone. `discard` deletes the copy and its record. `download` zips the copy as `<folder>-edited.zip` through `pack::zip_skills`, which `archive` now also uses.

Checked with the CLI against a scratch copy of formcut's skills used as a checkout: start (11 files, nothing edited), start again (same copy), write (SKILL.md edited; the original's last line unchanged), an upstream change to the original (flagged as SKILL.md), seen (flag clear, copy text kept), `../x`, a new file name, `../formvis` as a skill, `/etc/passwd` and `../../formvis/x` refused, download (11 files, the edit inside), a new process with the checkout gone (copy listed, original "not available" with the reason), discard (copy and record gone).

## v0.3.1 · no partial download {#v0-3-1}

### pack.rs · write beside, then rename
- refers-to: core/src/pack.rs :: archive
- kind: fix
- logged: v0.3.1 · 2026-10-24

v0.3.0 wrote the zip straight to its final name, so a write that failed (the disk filled during the release check) left a broken `formcut-skills-checkout.zip` in the downloads folder, and the next download became `(2)`. The zip is now written to a hidden `.<name>.zip.part-<pid>` in the same folder and renamed into place only when complete; on any failure the part is removed and the error names the target. Checked on a 20 KB tmpfs: the download fails with "No space left on device" and the folder stays empty; a normal download gets the plain name.

## v0.3.0 · read and download {#v0-3-0}

### library.rs · read_text stays inside the skills folder
- refers-to: core/src/library.rs :: read_text, FileText
- kind: decision
- logged: v0.3.0 · 2026-10-24

A file is asked for by its path in the set (`<skill folder>/<path>`). The path must be made only of plain parts (no `..`, no root, no drive), and after resolving links it must still be a file under the skills folder, so a link inside a checkout cannot point the window at the rest of the disk. Files over 2 MB, or that are not UTF-8 or hold a zero byte, come back with a note instead of text. Checked: `..`, a `../` hidden in the middle, an absolute path and a link to `/etc/passwd` placed in a scratch skill are all refused; SKILL.md reads as text.

### pack.rs · downloads shaped like the release asset
- refers-to: core/src/pack.rs :: archive, free_name, label · core/src/places.rs :: downloads_dir
- kind: decision
- logged: v0.3.0 · 2026-10-24

A download is a zip of whole skill folders (`<folder>/<path>`), entries in index order, every date set to 1980-01-01 and every mode to 0644, as formcompiler's `agents.py` writes its asset; one skill is `<folder>.zip`, an app's set `<app>-skills-v<version>.zip` (`-checkout` in dev mode). It goes to `FORMSKILLS_DOWNLOADS`, else the Downloads folder, else home, and never replaces a file: the next free name is `<name> (2).zip`. Checked: the formvis set from its checkout holds the same 42 files, byte for byte, as formcompiler's `formvis-skills-v1.97.1.zip`, and `testzip` finds no error.

## v0.2.0 · fetch {#v0-2-0}

### catalog.rs · the same trust as FormPortal and formMCP
- refers-to: core/src/catalog.rs :: load, verify, keys, get, released · core/catalog_keys.txt
- kind: decision
- logged: v0.2.0 · 2026-10-24

The signed family catalogue (formcompiler's `catalog` release, or `FORMSKILLS_CATALOG`: https, loopback http or a file) is read with its `.sig`, checked against the compiled-in keys plus `FORMAI_CATALOG_PUBKEY`, the same contract as FormPortal and formMCP; FormPortal's kept copy is used when the network fails, or only that with `FORMSKILLS_OFFLINE`; `FORMSKILLS_ALLOW_UNSIGNED` admits an unsigned one for development. From each product it takes the stable channel (the beta channel only when there is no stable) and that release's `agents.skills` asset: `file`, `url`, `bytes`, `sha256`, as formcompiler's `catalog.py` writes it. Released versions only: unreleased `main` is never read here.

### fetch.rs · download, check, unpack, keep
- refers-to: core/src/fetch.rs :: ensure, kept, unpack, Record · core/src/places.rs :: data_dir, cache_dir
- kind: decision
- logged: v0.2.0 · 2026-10-24

Kept in `released/<app>/<version>/` under formskills' data folder (`FORMSKILLS_HOME`, else Application Support `ai.nodemode.formskills`, `%LOCALAPPDATA%\formskills`, or `~/.local/share/formskills`): the unpacked `skills/` tree and `asset.json` (the catalogue's asset record and when it was fetched). A version already kept with the same digest is reused without a download; `fetch` (and the window's Refresh) downloads again. A download is refused unless its address is https (or loopback), it is at most 64 MB, and its SHA-256 equals the catalogue's. Unpacking refuses an entry that leaves the folder (`enclosed_name`) or is a link, more than 10 000 entries, or more than 256 MB unpacked; it goes into a hidden `.part` folder that is renamed into place only when complete, and then other versions of that app are removed (personal edits, v0.4.0, will live elsewhere). App ids and versions must be plain names before they become folder names. When the catalogue or a download fails, the newest kept version is shown with the reason (`kept`).

### library.rs · where each app's skills come from
- refers-to: core/src/library.rs :: load, checkout, from_release, Source · core/src/places.rs :: dev_mode, dev_roots
- kind: decision
- logged: v0.2.0 · 2026-10-24

Each app gets one source: `release` (the latest released asset, `downloaded` when it was fetched now), `kept` (an earlier release, with why the latest could not be read), `dev` or `missing` (with the reason: no release yet, a release without a skills asset, an untrusted catalogue, a bad digest). The dev mode is opt-in (`FORMSKILLS_DEV=1`; `./formskills dev` sets it with the folder that holds this checkout as `FORMSKILLS_DEV_ROOTS`), so released-only stays the default the owner set: in it, `<root>/<app>/<skills folder>` is read when present and releases are used for the rest. The catalogue is not read when every chosen app came from a checkout.

### skills.rs · the same index formcompiler builds
- refers-to: core/src/skills.rs :: index, front_matter, walk, kind_of
- kind: rationale
- logged: v0.2.0 · 2026-10-24

A skill is a top-level folder with a `SKILL.md`; its name and description come from the front matter, with formcompiler's rules (folded and literal blocks joined, quotes trimmed, the folder name when there is no name). Files skip `__pycache__`, `node_modules`, `.git`, `.DS_Store`, `Thumbs.db`, `*.pyc` and links, and are sorted; each is marked `skill` (the top `SKILL.md`), `sub-skill` (`SUB-SKILL.md` or a nested `SKILL.md`), `reference` (other Markdown) or `file`, for the v0.3.0 viewer. Checked: formvis 1.97.1's asset built by formcompiler's `agents.py` and the formvis checkout index to the same skills, names, descriptions, files and sizes (4 skills, 42 files); all 17 checkouts in dev mode give 35 skills.

### Checked end to end
- kind: decision
- logged: v0.2.0 · 2026-10-24

With a key pair from formcompiler's `catalog.py keygen`, a catalogue signed with its `sign`, and real assets from `agents.py build` served on loopback: no trusted key, a wrong key and an unsigned file are refused with the reason (and a kept copy shown when there is one); unsigned is admitted with `FORMSKILLS_ALLOW_UNSIGNED`; formvis downloads once, is reused on the next run, downloads again with `fetch`, and a newer version replaces the older folder; a wrong digest is refused naming both digests; an asset with `../escape.txt` is refused and nothing is written outside; a release without an asset and an app without a release say so; with the server stopped every app shows its kept version; `FORMSKILLS_OFFLINE` with FormPortal's kept copy uses it. The real catalogue address fails TLS in this sandbox (its proxy's certificate authority) and falls back with the reason.

## v0.1.0 · the list {#v0-1-0}

### setup/apps.py · only apps that name a skills folder
- refers-to: setup/apps.py :: build, main
- kind: decision
- logged: v0.1.0 · 2026-10-24

The family plan forbids hand-kept copies, so the list is generated from formcompiler's registry: for each `apps/<app>.json` whose `agents.skills` names a folder (formcompiler 0.4.0 added the block), the catalogue id, name, kind and summary, the repository, that folder, `state`, and `enabled` (written as `released`). Apps without a skills folder are left out: formskills has nothing to show for them. Sorted by display name, since that is the order a person scans the chips in. It records formcompiler's version and commit; `--check` exits non-zero while the file differs. Generated from formcompiler 0.4.0 (30943ac): 17 apps. formMCP and formskills themselves are not in the registry yet (family plan, Phase 5), so formMCP's own skill appears once it is registered.

### apps.rs · compiled in, format checked
- refers-to: core/src/apps.rs :: App, Apps::bundled, get, describe_source
- kind: rationale
- logged: v0.1.0 · 2026-10-24

The list is compiled in with `include_str!`, so the command line and the window read the same bytes and nothing is fetched in v0.1.0. `bundled` refuses a file whose `format` is not `formskills-apps`. `get` matches the catalogue id, the repository name or the display name, ignoring case, so `formvis`, `FormVis` and `formdeck` (FormSlide's repository) all work. From v0.2.0 this list is the fallback under the signed catalogue, the way formMCP's is.

### cli · three commands
- refers-to: cli/src/main.rs :: main, HELP
- kind: rationale
- logged: v0.1.0 · 2026-10-24

`apps` (with `source` and `count`), `app <id>` and `version`; an unknown app or command exits 1 with the reason. From v0.2.0 also `skills [id]`, `fetch [id]`, `catalog` and `where`; from v0.3.0 `read <id> <path>` and `download <id> [skill] [--to DIR]`; from v0.4.0 `edits` and `edit start|read|write|seen|download|discard`. Checked: `formskills-cli version` prints 0.1.0, `app formvis` prints FormVis with `.claude/skills`, `app nope` exits 1 naming `apps`.
