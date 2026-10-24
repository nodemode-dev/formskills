# NOTICE

formskills
Copyright 2026 NodeAgentc, Inc.

Licensed under the GNU General Public License v3.0 (SPDX `GPL-3.0-only`). See `LICENSE`. The third-party work listed below keeps its own licence; all of it is compatible with GPL-3.0.

## Dependencies

formskills' own code and art (the icon in `assets/`, `frontend/public/` and `src-tauri/icons/`) are the owner's. The list of apps in `core/data/apps.json` is generated from formcompiler's registry (`nodemode-ai/formcompiler`, GPL-3.0-only, the same owner). The window's design tokens and layer scale come from FormTray by way of formMCP (`nodemode-ai/formtray`, `nodemode-ai/formMCP`, GPL-3.0-only, the same owner). The skills formskills shows belong to the Form apps that ship them, under each app's own licence; formskills shows them as released and never changes them.

Its dependencies are MIT, Apache-2.0 or dual MIT and Apache-2.0, with some BSD-3-Clause, ISC, Zlib and Unicode-3.0 crates, as their manifests declare (checked with `cargo metadata` against `Cargo.lock`, 408 packages at v0.1.0). The main ones:

| Package | Used for |
| --- | --- |
| serde, serde_json | the app list (`core`, `cli`) |
| tauri 2, tauri-build | the desktop shell |
| Vite, TypeScript, @tauri-apps/cli, @types/node (build only) | building the window and the app; not shipped |

Every new dependency, binary, font or data file gets a row here before it is used.

## Desktop shell: crates under other licences

Tauri links these crates unedited (no `[patch]` and no vendored copy):

| Crate | Licence | Why it is there |
| --- | --- | --- |
| cssparser, cssparser-macros, selectors, dtoa-short, option-ext | MPL-2.0 | Tauri's HTML handling and its folder lookups; used unmodified, source at crates.io |
| r-efi | MIT OR Apache-2.0 OR LGPL-2.1-or-later | used under MIT |

The Linux AppImage also carries the build machine's WebKitGTK, GTK and GLib (LGPL-2.1-or-later) as separate shared libraries.

## Trademarks

The names of the Form apps belong to their owner. Claude Code, Codex and Cursor are named only as the agent tools the skills are written for; formskills is not affiliated with or endorsed by Anthropic, OpenAI or Anysphere.
