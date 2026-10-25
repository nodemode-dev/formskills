# formskills

formskills is where the Form family's skills are found: every Form app's released skills, listed by app, to read, download and keep your own edited copies of.

**Current version:** v0.6.0 · **Stack:** Rust (`formskills-core`, `formskills-cli`) · Tauri 2 shell · vanilla TypeScript and Vite window · **Team:** one owner (nodemode-ai)

| Page | What it covers |
| --- | --- |
| [Getting Started](Getting-Started) | install from source, run the window and the command line, refresh the list |
| [Architecture](Architecture) | the engine, the list and where it comes from, the shell, the window |

## What it does

- The list of Form apps that ship skills, generated from formcompiler's registry, with where each app keeps them (v0.1.0).
- A window with All and one chip per app, a card per app and a detail pane (v0.1.0).
- Each app's latest released skills, read from the signed family catalogue, digest checked and kept on this computer, with the kept copy shown when the network fails; a dev mode for local checkouts; each app's skill count and source in the window (v0.2.0).
- Skill cards and a reader: SKILL.md as formatted text, its sub-skills, references and other files beside it, links between them followed; download of one skill or an app's set as a zip shaped like the release asset (v0.3.0).
- Your own edited copies: an editor with live preview and the read-only original beside it, saved as you type, flagged when the original changes in a newer release, downloadable; the original is never changed (v0.4.0).
- Installing skills into Claude Code, Codex and Cursor, for you or one project, with an Installed page to update or remove them (v0.7.0).

## What it does not do

It does not push edits back to an app, show unreleased work, or touch an agent folder it did not write. The Form apps' MCP tools are formMCP's job; skills are only here.

## What comes next

v0.5.0 adds search, topic chips, licences, the format check and the Skill format page; v0.6.0 your own skills, pinning a release, updating one app and the Trust page; v0.7.0 installing into agents. The parity plan's formskills steps are done; what follows comes from the family plan. The owner's first push, `compile_v*` branch and the family's catalogue key pair are still to come.
