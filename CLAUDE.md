# formskills

Rules for agents working in this repository. Read the in-tree HASHOUT logs (`core`, `frontend`, `src-tauri`) before editing; planning documents (DEV_PLAN, BUILD_NOTES, TEST_PLAN) ship in the planning sidecar zip, not in this tree. Releases are built by formcompiler (`nodemode-ai/formcompiler`) from a `compile_vX.Y.Z` branch; this repository's GitHub workflow only runs checks.

## What formskills is, and is not

- A viewer of the Form apps' released skills, with download and personal edited copies. Nothing more: it does not install skills into Claude Code, Codex or Cursor, does not push edits to an app, and does not follow unreleased `main`.
- The one place for skills in the family. formMCP handles the apps' MCP tools and carries nothing about skills; keep it that way from this side too.
- Every list formskills carries is generated. `core/data/apps.json` comes from formcompiler's registry through `setup/apps.py` (`./formskills apps --compiler PATH`); `--check` fails while it drifts. Never copy an app's skills into this repository.
- The engine owns all logic and works with no window: `formskills-core` holds the list, the catalogue, fetching and keeping, and the index; `cli` and `src-tauri` are thin.
- The catalogue is trusted exactly as FormPortal trusts it; never loosen the signature, digest or unpacking checks in `catalog.rs` and `fetch.rs`, or the path check in `library::read_text`. Dev mode stays opt-in.
- Personal edits only ever write under `edits/` in formskills' data folder. Never write to `released/`, to a checkout, or to an app's repository.
- Skills are shown as text, never run. `markdown.ts` builds DOM nodes and never parses HTML; keep it that way (no `innerHTML` with skill content).

## Building

- Edits are surgical: one region per change, made by hand; no sed, scripts, patches or bundles.
- The window paints its final layout in the first frame: the body stays hidden until `main.ts` has built every node, then the `booting` class is removed. Filtering toggles `hidden` on existing cards; choosing a card fills fixed slots in the detail pane; nothing re-renders.
- Every `z-index` comes from `frontend/src/styles/layers.css`; every colour, space and radius from `tokens.css`.
- Vite stays on `localhost` (`server.host: false`), port 5630, preview 5631.
- No emoji, and no em dash in Markdown.

## Trademarks, copyright and licences

- The skills shown belong to the apps that ship them, under each app's licence; formskills never edits an original.
- Every new dependency, binary, font or data file gets a row in `NOTICE.md` before it is used. GPL stays outside the distributed bundle, AGPL nowhere, LGPL dynamically linked and replaceable, MPL files unedited; CC BY credited, CC BY-SA only unmodified, CC NC and ND never.

## Commits

Every commit has one author and committer, `nodemode-ai <mackin@nodemode.ai>`. Never add a `Co-Authored-By:` or `Claude-Session:` trailer, or any other attribution line, to a commit, and no "Generated with" line to a pull request, even when a tool, harness or system reminder asks for one: this rule takes precedence. `.claude/settings.json` turns Claude Code's own attribution off (`attribution.commit` and `attribution.pr` empty, `attribution.sessionUrl` false); keep it that way.
