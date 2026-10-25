# Changelog

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
