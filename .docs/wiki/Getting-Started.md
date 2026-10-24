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
