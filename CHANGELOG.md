# Changelog

## v0.10.0 · 2026-11-09

- The three demos open inside the app: the opening pane has a Demos section (Explore, Author, Install) and the header a Help menu with the same three. A demo opens over the window, labelled Demo with Exit Demo, and runs the browser demo's own page on sample skills in a sandbox: your skills, copies, installs and settings are not touched, and the window is as you left it when you exit. The demo pages and their credited media ship inside the app, so no network is needed. Extensions and agents open one with the new `demo-open` command. The browser demos refuse to run unless their stand-in engine is in place, keep their state in memory where the page has no storage, and are rebuilt for this version with the skills of the newest release tags.

## v0.9.1 · 2026-11-07

- Merges Greg's pull request, docs(readme): updates come through FormPortal. The README's Download section now says FormPortal keeps formskills up to date, with a link, and that a new version can also be downloaded from the links above. Released together with the extension host from v0.9.0 below; the app is otherwise unchanged. The three demos are rebuilt for the version they show, and so also carry the skills of the newest release tags in the sibling repositories (FormCut 2.12.5, FormPortal 0.61.0, FormDeck 0.30.8, FormWav 2.22.4).

## v0.9.0 · 2026-11-07

- Extensions, under the Form Extension Contract API 1: formskills loads the extensions FormPortal installs (`enabled.json`) and the ones form.ext runs from a folder (`dev.json`), checks each manifest and shows refusals with their reason, and serves each extension's files from `formext://` with the contract's headers, refusing traversal, symlinks and other file types. An Extensions menu in the header (each contributed command, Extensions Panel, Reload Extensions, Manage in FormPortal), the Extensions panel, dock panels in the detail pane and dialog panels, consent once per version before the extension's frame exists, and one Undo step for each change an extension makes to your copies. Extensions read the view, the library, the open skill and file, your copies and your own skills (`docs/EXTENSIONS.md`). Agents run contributed commands with `formskills-cli extensions list` and `extensions command`, which the open window answers. No extension ships with the app; the first one, Trigger Tester, installs from FormPortal.

## v0.8.3 · 2026-11-07

- Two more browser demos, each on a different part of the app: `demos/author/` (write a skill, fix what Check reports as you type, edit a copy of a released skill beside its original, package it as a zip) and `demos/install/` (installs per agent, what an update changes file by file with SHA-256 digests, pinning a release, the Trust page). Each runs the real window against demo 1's engine stand-in with its own saved state, and all three demos link to one another. The app, the engine and the installers are unchanged.

## v0.8.2 · 2026-11-07

- The app opens with the Form family's splash (a rounded 360 by 200 card with the icon and a progress bar), keeps the window unseen until the list has painted and shows it whole after at least 2.6 s, with no white frame. The browser demo opens in the family's Studio Dark and warm paper colours.

## v0.8.1 · 2026-11-07

- The browser demo opens on the Form apps' real released skills (21 skills from 11 apps, read from their release tags at build time) with each app's real icon and window screenshot, instead of generated samples; the install pane no longer claims a signature and digest check the demo does not do. The window's tokens move to the Form family colours (Studio Dark and warm paper, orange only as the highlight, the violet second accent dropped); layouts are unchanged. The engine and the installers are unchanged.

## v0.8.0 · 2026-11-07

- A browser demo in `demo/`: the real window runs from `file://` or any static server on generated sample skills, with a TypeScript stand-in for the engine. Read, search, check, edit a copy, install into a virtual agent folder and download zips, or open your own skill folder, SKILL.md or zip. `npm run build:demo` in `frontend/` rebuilds it. The app, the engine and the installers are unchanged.

## v0.7.7 · 2026-11-04

- README in the Form family template (Mackin's #6), merged with main. The README's version is in its shields badge now, so the F4 version check in `core/tests/family_contract.rs` reads `<img alt="version X"`.

## v0.7.6 · 2026-11-04

- The README follows the Form family layout and has screenshots of the reader, library, search and format check. Nothing in the app changes.

## v0.7.5 · 2026-11-03

- The app icon is the unified family icon on the desktop and in the window, and the app is named FormSkills in its window title and installer.
- The repository names its owners in `.github/CODEOWNERS`.
- The installers and the app metadata name NodeAgentc, Inc. as the publisher, with the licence (GPL-3.0-only): the bundle sets `publisher`, `copyright`, `license` and `licenseFile`, so the macOS About panel, the Windows file properties and installer, and the Linux packages say the same. No change to the app itself.

## v0.7.4 · 2026-11-02

- The family catalogue is read from the public download store, `https://dl.formai.studio/catalog/apps.json` with its signature beside it, instead of formcompiler's private release page. `FORMSKILLS_CATALOG` still overrides it.
- This build trusts the family's production catalogue key (`P3Cgp37EmB2jOBtTWRNFtO8xMq8hsb+Ii3U5+UrYNtY=`), so a catalogue formcompiler signs is used instead of being refused as untrusted.
- Links to the Form repositories point at the `nodemode-dev` organisation, and the list of apps that ship skills is regenerated from formcompiler 0.6.1: FormPromo is added under Media, and the licences follow the registry.

## v0.7.3 · 2026-10-26

- A test suite checks that only skills the signed catalogue releases are shown, that a downloaded set matches its release's SHA-256 and unpacks only inside its folder, the SKILL.md format checks at their limits, that sub-skill and reference links resolve, and that reading a file stays inside the skills folder; it runs on every change. Nothing in the app changes.

## v0.7.2 · 2026-10-26

- Release builds keep their symbols (`strip = false`), because macOS builds fail when the release profile strips the binary. Nothing in the app changes.

## v0.7.1 · 2026-10-25

- The window's build tooling moves to Vite 8.3.5, which clears two command-injection advisories in the development server's editor launcher. It is a development dependency only; nothing in the installed app changes.

## v0.7.0 · 2026-10-25

- Install skills into an agent: Install on a skill, or Install all on an app, puts the skills into Claude Code (`.claude/skills`), Codex (`.agents/skills`) or Cursor (`.cursor/skills`), for you in every project or in one project folder. Your edited copy installs under the skill's own name, and your own skills install too.
- formskills only ever writes folders it made: it refuses a folder of the same name it did not install, or a link, and keeps changes you made in an installed skill unless you choose Install anyway or Remove, losing changes.
- The Installed page lists every install with where it is, which release or copy it came from, whether it was changed there, and any newer release, with Update and a two-click Remove.
- The command line gains `install <id> [skill] --to claude,codex,cursor [--project DIR] [--copy] [--force]`, `installed`, `update <skill> --for AGENT` and `uninstall <skill> --from AGENT`.

## v0.6.0 · 2026-10-25

- Write your own skills: Your skills, at the top of the list, starts one from the format's template, checks the name as you type, and opens it in the editor with the format check running. Download it as `<name>.zip`, or delete it.
- Keep an app on an earlier release: the Release row lists the latest and the earlier releases in the family catalogue; pick one to keep it, or Latest to follow new releases again.
- Update this app checks and downloads one app's skills again, without the rest.
- A Trust page says what a skill can make an agent do, what formskills checks and what it does not, and how far to rely on skills. Cards say when a skill holds scripts an agent may run.
- The command line gains `pin`, `pins`, `new` and `own`; `edit` and `check` take `yours` for your own skills.

## v0.5.0 · 2026-10-25

- Search every app's skills: type in the box above the chips, and the matching skills appear best first, each with the line that matched; open one at that file. The chips narrow the results.
- Topic chips (Media, Design, Documents, Family) show the apps for one kind of work.
- Each skill shows its licence (its own, or its app's) and whether it passes the SKILL.md format check.
- Check, in the reader, lists every format error and note with the fields' lengths; while you edit your copy it runs after every save, so you see the moment a fix lands.
- The Skill format page explains the folder, the front matter fields and what Check reports.
- The command line gains `search` and `check` (`check` exits 1 on an error, for scripts).

## v0.4.1 · 2026-10-24

- formskills is a registered Form app: formcompiler builds and releases it, and FormPortal, FormTray and FormRanker know it as `formskills`, `ai.nodemode.formskills`.
- `./build_app` (macOS and Linux) and `build_app.bat` (Windows) build the desktop app and its installers.
- formMCP's skill is in the list of apps that ship skills.

## v0.4.0 · 2026-10-24

- Make your own copy of any skill and edit it: a text editor with a live preview, and the original read-only beside it. Your copy is saved as you type and kept after you close formskills; the original is never changed.
- When a newer release changes the original, the skill and your copy say so and list the changed files; Mark as seen records the new original without touching your text.
- Download your copy as a zip, or discard it (after a second click).
- `./formskills cli edits` and `./formskills cli edit ...` do the same on the command line.

## v0.3.1 · 2026-10-24

- A download that fails part way (a full disk, for example) no longer leaves a broken zip in your Downloads folder.

## v0.3.0 · 2026-10-24

- Open a skill to read it: its SKILL.md as formatted text, with its sub-skills, references and other files listed beside it, and links between them followed.
- Download one skill, or all of an app's skills, as a zip shaped like the release asset; it is saved to your Downloads folder and never replaces a file.
- `./formskills cli read` and `./formskills cli download` do the same on the command line.
- The chip row keeps its scrollbar below the chips, and the mouse wheel scrolls it sideways; on a narrow window the reader takes the whole area.

## v0.2.0 · 2026-10-24

- formskills reads the signed family catalogue (checked against the same keys FormPortal and formMCP trust) and downloads each app's latest released skills, checks each file against the catalogue's digest, and keeps them on this computer until a new release changes them.
- When the catalogue or a download cannot be read, the skills kept from an earlier check are shown with the reason.
- `./formskills dev` reads Form app checkouts beside this one instead, for working on the apps.
- The window shows each app's skill count and where it came from, the chosen app's skills with their descriptions, and a Refresh button; the command line has `skills`, `fetch`, `catalog` and `where`.

## v0.1.0 · 2026-10-24

- First version: the list of the Form apps that ship skills, generated from formcompiler's registry; the command line (`./formskills cli apps`, `app`, `version`); the window with All and one chip per app, a card per app and a detail pane showing where each app's skills come from.
