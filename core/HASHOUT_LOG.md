# HASHOUT_LOG · core · formskills

Living log for `formskills-core`, `formskills-cli` and `setup/apps.py`. Source files stay comment-free; what they would have said lives here.

Current build version: v0.8.2
Last updated: 2026-11-02 · the catalogue from the public download store; 2026-10-26 · the test suite; installing into Claude Code, Codex and Cursor; pins, one-app update, your own skills, script counts; search, the format check, licences and topics; registered in formcompiler; personal edited copies; no partial download; reading one file and packing downloads; released skills fetched, checked and kept, and the dev mode; the generated list of apps that ship skills

## v0.7.4 · the catalogue from the public download store {#v0-7-4}

### catalog.rs, setup/apps.py · dl.formai.studio
- refers-to: core/src/catalog.rs :: DEFAULT_CATALOG · setup/apps.py :: TOPICS, build, main · core/data/apps.json · core/tests/catalog_default.rs
- kind: decision
- logged: v0.7.4 · 2026-11-02

`DEFAULT_CATALOG` was the `catalog` release on formcompiler's own GitHub page, a private repository that never serves the public. formcompiler's feed now copies the signed catalogue to its download store (formcompiler `docs/GO_PUBLIC.md` section 4), so the default is `https://dl.formai.studio/catalog/apps.json`, the address FormPortal reads. The signature is still `<url>.sig` (`catalog/apps.json.sig` in the store), and the skills archives the catalogue names already carry the store's addresses once formcompiler publishes there. `FORMSKILLS_CATALOG`, loopback http, files, `FORMSKILLS_OFFLINE` and FormPortal's kept copy are unchanged. The repositories moved to the `nodemode-dev` organisation: the generator's `source.repository` and the docs say so, and `apps.json` was regenerated from formcompiler 0.6.1 (f0e3201): the new repository addresses, FormPromo (19 apps), the registry's current licences and `released` flags. FormPromo's kind `promo` had no topic, which stopped the generator; it joins Media. `catalog_default.rs` pins the default and its signature address.

### catalog_keys.txt · the production catalogue key
- refers-to: core/catalog_keys.txt · core/src/catalog.rs :: keys, verify · core/tests/catalog_keys.rs
- kind: decision
- logged: v0.7.4 · 2026-11-02

formcompiler's production catalogue key pair now exists (`scripts/catalog.py keygen`; the private seed is the formcompiler secret `FORMCOMPILER_CATALOG_KEY`). Its public half, `P3Cgp37EmB2jOBtTWRNFtO8xMq8hsb+Ii3U5+UrYNtY=`, is the one key line in `catalog_keys.txt`, the same line as FormPortal's and the other family readers', so a catalogue signed by formcompiler verifies and is used; before, every catalogue was refused with "this build trusts no catalogue key yet". `FORMAI_CATALOG_PUBKEY` still adds keys at run time. `catalog_keys.rs` checks that `keys()` holds it and that it is a valid Ed25519 point, and, with a test key from a fixed seed, that the compiled-in list plus that key verifies a signed body, that the production key alone refuses the test key's signature, and that a changed byte is refused. No production signature is in the tree, and the private half is never used.

## Unreleased · resilience {#unreleased}

### install.rs, pins.rs · an unreadable record is never overwritten
- refers-to: core/src/install.rs :: load, install, uninstall, update, list · core/src/pins.rs :: read, load, set · cli/tests/resilience.rs
- kind: fix
- logged: unreleased · 2026-10-28

`installed.json` and `pins.json` were read with any failure taken as empty, so one truncated or hand-broken file made the next install or pin write a list holding only that entry: every earlier install lost its record, and formskills then refused to update or remove those folders as someone else's. A file that exists but does not parse now stops install, uninstall, update and pin with the path and the reason; a missing file is still empty. Listing still shows what it can.

### durable.rs · written to disk before the rename
- refers-to: core/src/durable.rs :: replace_file · core/src/edits.rs :: write_atomic · core/src/install.rs :: save · core/src/pins.rs :: set · core/src/pack.rs :: zip_skills · core/tests/durable.rs
- kind: fix
- logged: unreleased · 2026-10-28

Every write beside and rename (a personal edit, `installed.json`, `pins.json`, a download) wrote the part with `fs::write` and renamed it at once. The rename can reach the disk before the data, so a power cut or crash right after a save could leave the person's edited file, or the install records, empty. `replace_file` now syncs the part before renaming it and removes the part on any failure; the old file stays whole until the new one is.

### durable.rs, fetch.rs, install.rs · the old folder moves aside, not away
- refers-to: core/src/durable.rs :: replace_dir · core/src/fetch.rs :: ensure · core/src/install.rs :: install · core/tests/durable.rs · cli/tests/resilience.rs
- kind: fix
- logged: unreleased · 2026-10-28

Fetching a kept release again and installing over an earlier install both deleted the old folder and then renamed the new one in. If the rename failed (a file held open on Windows, a crash between the two), the kept release that offline use falls back on, or the agent's installed skill, was gone with nothing in its place. `replace_dir` renames the old folder to a hidden `.<name>.old-<pid>` (`.formskills-old-<pid>` in an agent folder) beside it, renames the new one in, puts the old one back if that fails, and deletes it only after. `ensure` also removes its part folder when writing `asset.json` or the rename fails; it used to leave it.

## v0.7.3 · the test suite {#v0-7-3}

### cli/tests · released skills through the command line
- refers-to: cli/tests/support/mod.rs, cli/tests/released_skills.rs :: Sandbox, Server, write_catalogue, asset, product, older, zip_of, zip_with_link
- kind: decision
- logged: v0.7.3 · 2026-10-26

FAMILY_TEST_PLAN v0.3.0 P1. Each test runs the built `formskills-cli` with a cleared environment: HOME, FORMSKILLS_HOME, FORMSKILLS_DOWNLOADS and FORMPORTAL_ROOT point into a fresh temporary folder, so nothing reads or writes the person's data. The catalogue is a file (`FORMSKILLS_CATALOG`) signed by a key made from a fixed seed and trusted through `FORMAI_CATALOG_PUBKEY`; skill sets are served by a loopback HTTP server inside the test, which `catalog::allowed_url` accepts, and the server counts requests so a test can say a set was not fetched again. Covered: only apps the signed catalogue releases list skills; a checkout is read only with FORMSKILLS_DEV; unsigned and wrongly signed catalogues list nothing; a set whose SHA-256 differs is refused and nothing is kept; a matching set is kept once and `download` gives back the released files; entries that leave the folder or are links are refused; a pin takes only releases the catalogue lists; offline uses FormPortal's kept copy under the same signature check.

### core/tests · the format check and reading
- refers-to: core/tests/skill_format.rs :: check::validate, skills::index, library::read_text
- kind: decision
- logged: v0.7.3 · 2026-10-26

The gates `check.rs` enforces, each at its limit and one past it: name 64 characters, description 1024, XML tags in either, the reserved words, lowercase letters, digits and single hyphens, the name matching its folder, a missing card, front matter, name or description. Links from SKILL.md to sub-skills and references resolve, and a broken or escaping link is named. The index sorts files into skill, sub-skill and reference, counts scripts and skips caches. `read_text` refuses `..`, absolute paths and a link out of the folder. The plan also names emoji, em dash and file and size ceilings as upload gates; `check.rs` has none of them, so they are not tested and wait on the owner.

### core/tests/family_contract.rs · F4 and F9
- refers-to: core/tests/family_contract.rs :: VERSION_SITES, STRIP_EXEMPT
- kind: decision
- logged: v0.7.3 · 2026-10-26

The family template: the five version sites agree with the crate and keep a one-digit patch, and no Cargo.toml release profile strips.

## v0.7.0 · installing into agents {#v0-7-0}

### install.rs · where each agent reads skills
- refers-to: core/src/install.rs :: AGENTS, agent_label, agent_dir, Target::new, Target::root, Target::describe
- kind: decision
- logged: v0.7.0 · 2026-10-25

The folders come from each agent's own docs, read 2026-10-25: Claude Code `~/.claude/skills` and `.claude/skills`, Codex `~/.agents/skills` and `.agents/skills`, Cursor `~/.cursor/skills` and `.cursor/skills` (Cursor also reads the Claude Code and Codex folders, which the window says). A project path must be a folder and is canonicalised; the home folder itself is treated as the user scope so one folder never has two records. Whether a running agent then loads the skill was not tried (it needs a signed-in agent); recheck the docs before changing these.

### install.rs · only folders formskills made, and changes kept
- refers-to: core/src/install.rs :: Record, Origin, State, install, uninstall, update, list, install_many, Outcome · data_dir/installed.json
- kind: decision
- logged: v0.7.0 · 2026-10-25

Every install is recorded with its target, folder, origin (release and version, edited copy, own skill or checkout) and a SHA-256 per file. A folder of that name with no record is someone else's and is refused, as is a symlink. A recorded folder whose files differ is "modified": installing again or removing it needs force, and the error says so (the window keys its Install anyway button on "with force"). Each install copies into `.<folder>.formskills-part-<pid>` beside the target and renames it into place, replacing the old folder only after the copy is whole. `list` compares records with the disk and the library and names a newer release; `update` installs the current source again under the same rules. `install_many` returns one Outcome per skill and agent instead of stopping at the first refusal, so an app's set installs everywhere it can and reports the rest; the CLI fails only when every one was refused.

Checked in a scratch home with the signed loopback catalogue: user and project installs for all three agents, a foreign folder and a symlink refused, a modified install refused then forced, install from pinned 1.97.1 then update to 1.97.2 after unpinning, copy and own-skill installs, uninstall plain and forced.

## v0.6.0 · pins, one-app update, your own skills, script counts {#v0-6-0}

### catalog.rs, library.rs, pins.rs · an earlier release, checked the same way
- refers-to: core/src/catalog.rs :: Older, Released.history, Earlier · core/src/library.rs :: from_release, load, Source::Release.pinned, Source::Release.latest, AppSkills.releases, AppSkills.pin · core/src/pins.rs :: load, set, path
- kind: decision
- logged: v0.6.0 · 2026-10-25

formcompiler's `catalog.py` gives the stable release a `history` of the next five stable releases, each built by the same `release_entry`, so each carries its own `agents.skills` asset with digest. formskills reads only that list: a pin can name only a release the signed catalogue lists with skills (the CLI and the shell refuse anything else), and the pinned asset goes through `fetch::ensure` like the latest, so the signature, digest and unpacking checks are the same. `ensure` still keeps one version per app, so switching pins downloads again; that keeps the cache small and the code unchanged. When the catalogue drops a pinned release, the library says so and uses the kept copy rather than silently following the latest. Pins live in `pins.json` beside `released/`, written beside and renamed.

Checked against a signed catalogue on loopback (formcompiler's `catalog.sign` with the v0.2.0 test key) with formvis 1.97.2 and 1.97.1 (the older asset given an extra file to tell them apart) and a 1.96.0 without skills: pin 1.97.1 (downloaded, the extra file present, source pinned with 1.97.2 as latest), pin 1.96.0 and 9.9.9 refused with the releases listed, `fetch formvis` re-downloads that app only, unpin returns to 1.97.2, a pin to an unlisted 1.95.0 keeps the kept copy with the reason.

### own.rs, edits.rs · your own skills are copies without an original
- refers-to: core/src/own.rs :: create, list, template, name_problem, OWN, BASE · core/src/edits.rs :: adopt, copy_dir, download
- kind: decision
- logged: v0.6.0 · 2026-10-25

A skill of your own is a folder in `edits/yours/` with the same record as an edited copy (base "your own skill", no digests, no original), so read, write, check, download and discard need no new code; `download` names it `<name>.zip` instead of `-edited`. `yours` is not an app id in the family, so it cannot clash. The template writes the front matter (the description quoted, on one line) and the sections the format suggests; it passes the check as made. Names are refused unless they meet the format's rules (the same ones `check.rs` reports), so a skill can always be installed later under its folder name. Made in a hidden part folder and renamed.

### skills.rs · scripts
- refers-to: core/src/skills.rs :: Skill.scripts, is_script, SCRIPT_ENDINGS
- kind: decision
- logged: v0.6.0 · 2026-10-25

A count of the files a skill carries that an agent could run (by ending: Python, shell, JavaScript and TypeScript, PowerShell, batch, Ruby, Perl), shown on cards as a trust signal. It looks at names only; it does not read or judge the code.

## v0.5.0 · search, the format check, licences and topics {#v0-5-0}

### check.rs · the Agent Skills format plus Claude's rules
- refers-to: core/src/check.rs :: validate, name_findings, link_targets, resolve, has_tag, block_closed, Report, Finding, Field, Summary, SPEC · core/src/skills.rs :: Skill.license, Skill.check, walk_files · core/src/edits.rs :: validate
- kind: decision
- logged: v0.5.0 · 2026-10-25

The rules come from the Agent Skills specification (agentskills.io/specification, read 2026-10-25) and Claude's Agent Skills overview (platform.claude.com, the same day): name 1 to 64 characters of lowercase letters, digits and hyphens, no hyphen at either end or two in a row, equal to the folder; Claude adds no XML tags and no "anthropic" or "claude" (checked without regard to case); description 1 to 1024 characters with no XML tags; compatibility 1 to 500 when set; SKILL.md under 500 lines (a note, not an error). Links are notes only, because a broken link does not stop an agent from loading the skill; they are read outside fenced code and outside inline code spans (formdeck's skills show `![alt](a1)` as script syntax, which the first run reported as six broken links). Unknown front matter keys are not reported: Claude Code and other agents add their own. The index runs the check for every skill so each card can carry a summary; it reads only files already listed and costs little against the 36 skills.

Found in the family: formpdf-harness's description is 1,362 characters, over the 1,024 limit (an error that Claude's upload checks would refuse). Every other skill passes with no notes.

### search.rs · every word, at the start of a word
- refers-to: core/src/search.rs :: search, words, starts, body, snippet, Hit
- kind: decision
- logged: v0.5.0 · 2026-10-25

A skill matches when every word appears at the start of a word in its name or folder, description, or Markdown text (front matter left out). The first version matched inside words, so "lip sync" found "clipping" and "async"; matching at a word start keeps prefixes ("mask" finds "masks") and drops those. Scores: 8 for the name, 4 for the description, the number of places in the text up to 5, per word; ties by name then app; at most 60 results. Nothing is cached: a search over the 36 skills reads their Markdown again and takes about 80 ms in a whole CLI run, so a cache would be complexity for no gain yet.

### setup/apps.py, apps.rs · topic and licence per app
- refers-to: setup/apps.py :: TOPICS, topic_of · core/src/apps.rs :: App.topic, App.licence, Apps.topics · core/data/apps.json
- kind: decision
- logged: v0.5.0 · 2026-10-25

The registry's `kind` is one per app (18 kinds for 18 apps), so it cannot group anything; `TOPICS` in the generator maps kinds to four topics (Media, Design, Documents, Family) and fails on a new kind, so a new app cannot slip in without one. `licence` is the registry's `catalog.licence`, shown when a skill names none. The list's format version is now 2.

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
