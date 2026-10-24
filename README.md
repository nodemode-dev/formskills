<p align="center"><img src="assets/formskills_icon.png" width="160" alt="formskills icon" /></p>

<h1 align="center">formskills</h1>

<p align="center"><b>Every Form app's released skills in one place: read them, download them, keep your own edited copies.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v0.2.0-f97316" alt="version v0.2.0" />
  <img src="https://img.shields.io/badge/skills-released%20only-8b5cf6" alt="released skills only" />
  <img src="https://img.shields.io/badge/Tauri-2-24C8DB" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Rust-stable-B7410E" alt="Rust stable" />
  <img src="https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 20.19+" />
  <img src="https://img.shields.io/badge/license-GPL--3.0-555555" alt="license GPL 3.0" />
</p>

formskills is where the skills of the Form family of desktop apps (image, video, audio, layout, vector, notes, slides and the rest, by nodemode.ai) are found. Each app ships its agent skills with every release; formskills lists them by app, shows each one as formatted text with its sub-skills and references, lets you download a skill or an app's whole set, and keeps your own edited copies beside the originals. It shows exactly what shipped: no unreleased work, and nothing is ever changed in an app.

**Stack:** Rust (`formskills-core`, `formskills-cli`) · Tauri 2 shell · vanilla TypeScript + Vite window with zero runtime dependencies · **Scale:** 17 Form apps that ship skills, from formcompiler's registry

## Highlights

- **Released skills only.** What formskills shows is what each app's latest release carries: the skills asset named in the signed family catalogue, its digest checked, kept on this computer and reused until a new release changes it. No `main`, no watch step, no copy kept in this repository. A dev mode (`./formskills dev`) reads local checkouts instead, for building the apps.
- **One place for skills.** formMCP gives agents the Form apps' tools; formskills is where their skills live. The two do not overlap.
- **Your edits stay yours.** An edited copy is kept beside the original, which stays read-only and is flagged when a newer release changes it (v0.4.0).
- **Never hand-kept.** The list of apps is generated from formcompiler's registry (`./formskills apps --compiler PATH`) and records the version and commit it came from.
- **A window that does not flicker.** Chips for All and each app, a card per app, a detail pane; painted complete in its first frame.

## Quick start

Requirements: Rust (stable), Node 20.19+, and on Linux WebKitGTK 4.1 for the window (the installer prints the packages).

```bash
./formskills_oc_install     # macOS / Linux
./formskills                # the window on localhost:5630
./formskills cli apps       # the apps that ship skills, as JSON
./formskills cli skills formvis   # its latest released skills and where they came from
./formskills cli fetch      # download every app's latest released skills again
./formskills dev            # the window, reading Form app checkouts beside this one
```

The catalogue is trusted exactly as FormPortal and formMCP trust it (`core/catalog_keys.txt` plus `FORMAI_CATALOG_PUBKEY`); until the family's key exists, formskills shows any skills it kept earlier and says why it could not read the catalogue. The wiki's Getting Started page lists every setting.

On Windows run `formskills_oc_install.bat`, then `formskills.bat`.

## Where things live

| Path | Role |
| --- | --- |
| `core/` | The engine: the list of apps that ship skills (`core/data/apps.json`, generated), the signed catalogue, fetching and keeping released skills, the skills index |
| `cli/` | `formskills-cli apps`, `app`, `skills`, `fetch`, `catalog`, `where`, `version` |
| `src-tauri/` | The shell: the window |
| `frontend/` | The window: tokens, layers, chips, cards and the detail pane |
| `setup/apps.py` | Generates `core/data/apps.json` from formcompiler's registry |
| `assets/` | The owner's icon |
| `.docs/wiki/` | Getting Started, Architecture |

| Port | Service |
| --- | --- |
| 5630 | Vite dev server (localhost only) |
| 5631 | Vite preview (localhost only) |

**Releases.** formskills builds nothing in this repository. After the version bump lands on main, push a branch `compile_vX.Y.Z` cut from that commit; CI runs on it, and formcompiler (`nodemode-ai/formcompiler`) builds the bundles and drafts the release `formskills-vX.Y.Z` once formskills is in its registry.

## Status

v0.2.0: fetch. The signed catalogue read with FormPortal's trust model; each app's latest released skills asset downloaded, its SHA-256 checked, unpacked safely and kept, reused until a new release; the kept copy shown with the reason when the network or catalogue fails; a dev mode for local checkouts; the window shows each app's skill count and source and the chosen app's skills. Checked by hand with real assets built by formcompiler and a signed catalogue on loopback (every trust, digest, unsafe-archive, upgrade and offline case), and all 17 checkouts in dev mode (35 skills); the window at 4x CPU and network throttling (CLS 0) and in the real app.

v0.1.0: the scaffold. The list of the 17 Form apps that ship skills, generated from formcompiler's registry; the command line; the window with All and per-app chips, a card per app and a detail pane, painted complete in its first frame.

Next (family plan, Phase 4): v0.3.0 shows each skill as formatted text with its sub-skills and references, and downloads a skill or an app's set; v0.4.0 keeps your own edited copies.

## License

formskills is licensed under the GNU General Public License v3.0 (`LICENSE`, SPDX `GPL-3.0-only`), as ComfyUI and formpromo are. Copyright 2026 NodeAgentc, Inc. `NOTICE.md` lists the work it includes or depends on.

## Trademarks

The names of the Form apps belong to their owner. Claude Code, Codex and Cursor are named only as the agent tools the skills are written for; formskills is not affiliated with or endorsed by Anthropic, OpenAI or Anysphere.
