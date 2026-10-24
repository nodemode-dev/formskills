# formskills

formskills is where the Form family's skills are found: every Form app's released skills, listed by app, to read, download and keep your own edited copies of.

**Current version:** v0.1.0 · **Stack:** Rust (`formskills-core`, `formskills-cli`) · Tauri 2 shell · vanilla TypeScript and Vite window · **Team:** one owner (nodemode-ai)

| Page | What it covers |
| --- | --- |
| [Getting Started](Getting-Started) | install from source, run the window and the command line, refresh the list |
| [Architecture](Architecture) | the engine, the list and where it comes from, the shell, the window |

## What it does

- The list of Form apps that ship skills, generated from formcompiler's registry, with where each app keeps them (v0.1.0).
- A window with All and one chip per app, a card per app and a detail pane (v0.1.0).

## What it does not do

It does not install skills into an agent tool, push edits back to an app, or show unreleased work. The Form apps' MCP tools are formMCP's job; skills are only here.

## What comes next

Per the family plan (Phase 4): v0.2.0 fetches each app's latest released skills (and reads local checkouts in a dev mode); v0.3.0 shows them as formatted text with download; v0.4.0 keeps personal edited copies.
