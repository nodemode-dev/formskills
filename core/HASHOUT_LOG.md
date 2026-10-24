# HASHOUT_LOG · core · formskills

Living log for `formskills-core`, `formskills-cli` and `setup/apps.py`. Source files stay comment-free; what they would have said lives here.

Current build version: v0.1.0
Last updated: 2026-10-24 · the generated list of apps that ship skills

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

`apps` (with `source` and `count`), `app <id>` and `version`; an unknown app or command exits 1 with the reason. Checked: `formskills-cli version` prints 0.1.0, `app formvis` prints FormVis with `.claude/skills`, `app nope` exits 1 naming `apps`.
