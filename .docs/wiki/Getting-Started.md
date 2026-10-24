# Getting Started

## Requirements

- Rust (stable) for the engine, the command line and the shell.
- Node 20.19 or newer for the window.
- On Linux, WebKitGTK 4.1 and its build packages for the window (the installer names them). The command line does not need them.

## From source

```bash
./formskills_oc_install       # checks the tools, installs the window's packages, fetches the crates
./formskills                  # the window: Vite on localhost:5630 and the Tauri shell
./formskills cli apps         # the apps that ship skills, as JSON
./formskills cli app formvis  # one app
```

On Windows: `formskills_oc_install.bat`, then `formskills.bat`, `formskills.bat cli apps`.

## Released skills

```bash
./formskills cli catalog          # can the signed family catalogue be used now, and if not, why
./formskills cli skills           # every app's skills and where they came from
./formskills cli skills formvis   # one app
./formskills cli fetch            # download every app's latest release again
./formskills cli where            # the folder released skills are kept in
./formskills cli read formvis formvis-harness/SKILL.md      # one file, as text
./formskills cli download formvis                           # the app's set as a zip in Downloads
./formskills cli download formvis formvis-harness --to .    # one skill, into this folder
```

A download is shaped like the release asset (`<skill folder>/<files>`, fixed dates) and never replaces a file: the next free name gets ` (2)`. In the window, open an app for Download all, or a skill for Download skill; the status line says where it was saved.

Each app's source is `release` (its latest released skills asset, digest checked), `kept` (an earlier release kept on this computer, with why the latest could not be read), `dev` (a checkout, dev mode only) or `missing` (with the reason). The window shows the same on each card and in the detail pane; Refresh downloads again.

## Your own copies

In the window, open a skill and press Edit a copy. Your copy is saved as you type (or at once with Ctrl or Cmd+S); Preview shows it formatted, Original shows the released file beside it. When a newer release changes the original, the skill card and the button say "original updated", the edit bar names the changed files, and Mark as seen records the new original without touching your text. Download your copy saves `<skill>-edited.zip`; Discard copy deletes it after a second click.

```bash
./formskills cli edits                                       # your copies and their state
./formskills cli edit start formvis formvis-harness          # make a copy
./formskills cli edit read formvis formvis-harness SKILL.md  # one file of your copy
./formskills cli edit write formvis formvis-harness SKILL.md my.md   # replace it with my.md (- for stdin)
./formskills cli edit seen formvis formvis-harness           # follow the original's current version
./formskills cli edit download formvis formvis-harness --to .
./formskills cli edit discard formvis formvis-harness
```

Copies live in `edits/` in formskills' data folder (beside `released/`), one folder per skill with a small record next to it. Only files the skill already has can be edited.

## Dev mode

```bash
./formskills dev                  # the window, reading checkouts in the folder that holds this one
./formskills dev cli skills       # the same on the command line
```

A checkout counts when `<folder>/<app repository name>/<skills folder>` exists (for example `../formvis/.claude/skills`); apps without one still come from their release. Dev mode shows unreleased work, so it is off unless asked for.

## Settings

| Variable | What it does |
| --- | --- |
| `FORMSKILLS_HOME` | formskills' data folder (default: Application Support `ai.nodemode.formskills` on macOS, `%LOCALAPPDATA%\formskills` on Windows, `~/.local/share/formskills` elsewhere) |
| `FORMSKILLS_CATALOG` | the catalogue's address: https, loopback http or a file (default: formcompiler's `catalog` release) |
| `FORMAI_CATALOG_PUBKEY` | extra trusted catalogue keys, comma separated (shared with FormPortal and formMCP) |
| `FORMSKILLS_OFFLINE` | `1`: read only FormPortal's kept copy of the catalogue |
| `FORMPORTAL_ROOT` | where FormPortal keeps its data, for that copy |
| `FORMSKILLS_ALLOW_UNSIGNED` | `1`: accept an unsigned catalogue (development only) |
| `FORMSKILLS_DEV`, `FORMSKILLS_DEV_ROOTS` | dev mode, and the folders holding checkouts (`./formskills dev` sets both) |
| `FORMSKILLS_DOWNLOADS` | where downloads are saved (default: the Downloads folder, else home) |

## Refreshing the list

The list is generated from formcompiler's registry (`apps/<app>.json`: its `catalog` block, and `agents.skills`, the folder an app keeps its skills in; apps without one are left out):

```bash
./formskills apps --compiler ../formcompiler          # writes core/data/apps.json
./formskills apps --compiler ../formcompiler --check  # fails while it drifts
```

The file records the formcompiler version and commit it came from; the window's footer shows it.

## Ports

| Port | Service |
| --- | --- |
| 5630 | Vite dev server (localhost only) |
| 5631 | Vite preview (localhost only) |
