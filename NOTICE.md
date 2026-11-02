# NOTICE

formskills
Copyright 2026 NodeAgentc, Inc.

Licensed under the GNU General Public License v3.0 (SPDX `GPL-3.0-only`). See `LICENSE`. The third-party work listed below keeps its own licence; all of it is compatible with GPL-3.0.

## Dependencies

formskills' own code and art (the icon in `assets/`, `frontend/public/` and `src-tauri/icons/`) are the owner's. The list of apps in `core/data/apps.json` is generated from formcompiler's registry (`nodemode-dev/formcompiler`, GPL-3.0-only, the same owner). The window's Markdown renderer (`frontend/src/markdown.ts`) is adapted from the one in formsculpt and formlit (`nodemode-dev/formsculpt`, `nodemode-dev/formlit`, GPL-3.0-only, the same owner). The window's design tokens and layer scale come from FormTray by way of formMCP (`nodemode-dev/formtray`, `nodemode-dev/formMCP`, GPL-3.0-only, the same owner). The skills formskills shows belong to the Form apps that ship them, under each app's own licence; formskills shows them as released and never changes them.

Its dependencies are MIT, Apache-2.0 or dual MIT and Apache-2.0, with some BSD-3-Clause, ISC, Zlib, Unicode-3.0 and CDLA-Permissive-2.0 crates, as their manifests declare (checked with `cargo metadata` against `Cargo.lock`, 446 packages at v0.2.0). The main ones:

| Package | Used for |
| --- | --- |
| serde, serde_json | the app list, the catalogue and the kept records (`core`, `cli`) |
| ureq 2 (rustls, ring, webpki-roots) | reading the family catalogue and downloading skills assets over https (`core`); ring is Apache-2.0 and ISC, webpki-roots (the root certificates as data) CDLA-Permissive-2.0 |
| ed25519-dalek 2 (curve25519-dalek, subtle), base64 | checking the catalogue's signature (`core`); the dalek crates and subtle are BSD-3-Clause |
| sha2 | checking each skills asset against the catalogue's digest (`core`) |
| zip 2 (flate2, miniz_oxide, crc32fast, zopfli) | unpacking skills assets and writing downloads (`core`); zip is MIT, miniz_oxide MIT, Zlib or Apache-2.0, zopfli Apache-2.0 |
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
