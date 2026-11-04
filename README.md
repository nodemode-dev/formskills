<p align="center">
  <img src="assets/app-icon/formskills-256.png" width="128" height="128" alt="FormSkills icon: a pink and violet slash on a dark rounded square">
</p>

<h1 align="center">FormSkills</h1>

<p align="center">
  <b>Agent skills; every Form app's released skills in one place.</b><br>
  Read them, download them and keep your own edited copies,<br>
  then install them into Claude Code, Codex or Cursor. Runs on your own computer.
</p>

<p align="center">
  <img alt="version 0.7.6" src="https://img.shields.io/badge/version-0.7.6-eef0f4?style=flat-square">
  <img alt="Rust" src="https://img.shields.io/badge/Rust-stable-B7410E?style=flat-square&logo=rust&logoColor=white">
  <img alt="Tauri 2" src="https://img.shields.io/badge/Tauri-2-24C8DB?style=flat-square">
  <img alt="macOS, Windows, Linux" src="https://img.shields.io/badge/macOS%20%C2%B7%20Windows%20%C2%B7%20Linux-native-2f7bf5?style=flat-square">
  <img alt="License: GPL-3.0-only" src="https://img.shields.io/badge/license-GPL--3.0--only-3a3a3a?style=flat-square">
  <img alt="Status: early" src="https://img.shields.io/badge/status-early-d69e2e?style=flat-square">
</p>

<p align="center">
  <a href="https://formskill.formai.studio/"><b>Download FormSkills on formai.studio</b></a> ·
  <a href="#run-it-from-source">Run it from source</a> ·
  <a href="#the-form-family">All Form apps</a>
</p>

<br>

<p align="center">
  <img src="docs/images/formskills-hero.png" alt="FormSkills reading the layers-and-masks sub-skill of formvis-driving, with the skill's files listed beside the formatted text" width="100%">
  <br>
  <sub>A real skill open in the reader: its sub-skills and references on the left, the formatted SKILL text on the right.</sub>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#everything-in-the-box">In the box</a> ·
  <a href="#built-for-agents">Agents</a> ·
  <a href="#under-the-hood">Under the hood</a> ·
  <a href="#download">Download</a> ·
  <a href="#run-it-from-source">Run from source</a> ·
  <a href="#the-form-family">Form family</a>
</p>

<br>

<table>
  <tr>
    <td width="25%" valign="top"><h3>Released only</h3>Shows what each app's latest signed release carries, with its digest checked. No unreleased work.</td>
    <td width="25%" valign="top"><h3>Your edits stay yours</h3>Edit a copy beside the read-only original. It is flagged when a new release changes the original.</td>
    <td width="25%" valign="top"><h3>Read, never run</h3>Skills are shown as text and never executed. Cards say when a skill holds scripts.</td>
    <td width="25%" valign="top"><h3>Agent-ready</h3>The same engine runs from the window and from a JSON command line, and installs skills into three agents.</td>
  </tr>
</table>

<br>

## Features

<table>
  <tr>
    <td width="50%" valign="top"><img src="docs/images/formskills-library.png" alt="The FormVis app card selected, listing its four released skills with their descriptions" width="100%"><br><sub>One card per app, and every skill it shipped.</sub>
      <h3>A library of skills</h3>Chips for All, each topic and each app. Pin an app to one of its last five releases, or update one app alone.</td>
    <td width="50%" valign="top"><img src="docs/images/formskills-search.png" alt="Search results for the word mask across every app's skills, best match first" width="100%"><br><sub>Search across every app's skills by name, description or text.</sub>
      <h3>Find the right skill</h3>Results are ranked and show where the words matched. Narrow by topic or app.</td>
  </tr>
  <tr>
    <td width="50%" valign="top"><img src="docs/images/formskills-check.png" alt="A format check reporting that formvis-driving passes, with name and description lengths" width="100%"><br><sub>The SKILL.md format check on a released skill.</sub>
      <h3>Checked against the format</h3>Every skill shows its licence and whether it passes the open Agent Skills format plus Claude's own rules.</td>
    <td width="50%" valign="top"><img src="docs/images/formskills-editor.webp" alt="An edited copy of formmcp-harness with the Markdown source on the left and a live preview on the right" width="100%"><br><sub>Your copy, with a live preview and the original one click away.</sub>
      <h3>Edit a copy</h3>Saved as you type in FormSkills' own folder. Download your copy as a zip whenever you like.</td>
  </tr>
</table>

## Everything in the box

<table>
  <tr>
    <td width="33%" valign="top"><h4>19 Form apps</h4>form.md · FormAT · FormCut · FormDesign · FormEncoder · FormLit · formMCP · FormPath · FormPDF · FormPortal · FormPromo · FormRef · FormSculpt · FormSlide · FormSurface · FormVFX · FormVis · FormWav · FormWeb</td>
    <td width="33%" valign="top"><h4>Actions</h4>Read · Search · Check · Download one or a whole set · Pin a release · Edit a copy · Write your own · Install · Update · Remove</td>
    <td width="33%" valign="top"><h4>Agents</h4>Claude Code (<code>~/.claude/skills</code>) · Codex (<code>~/.agents/skills</code>) · Cursor (<code>~/.cursor/skills</code>), for you or for one project</td>
  </tr>
</table>

## Built for agents

Every action in the window is also a `formskills-cli` command that prints JSON, run through the `./formskills cli` launcher.

```sh
./formskills cli search mask                          # every skill holding the word, best first
./formskills cli check formpdf                        # an app's skills against the SKILL.md format (exit 1 on an error)
./formskills cli read formvis formvis-harness/SKILL.md  # one file of a skill, as text
./formskills cli install formvis --to claude,codex    # every formvis skill into Claude Code and Codex
```

`./formskills cli help` lists them all. See [`AGENTS.md`](AGENTS.md).

## Under the hood

- **Engine:** `formskills-core` fetches the signed family catalogue, checks each skills asset's SHA-256, unpacks it safely and keeps it until a newer release.
- **Trust:** the catalogue is verified with the same key model as FormPortal and formMCP, and reads never leave the skills folder.
- **Shell and window:** a Tauri 2 shell around a vanilla TypeScript and Vite window with zero runtime dependencies.
- **Generated list:** the apps that ship skills come from formcompiler's registry (`./formskills apps`).
- **Tested:** 31 Rust tests (catalogue trust, digests, safe unpacking, the format checks, link resolution).

## Download

**Get the app:** download FormSkills from [formai.studio](https://formskill.formai.studio/). That is the easiest way to install it.

**Latest builds:** [`nodemode-dev/formcompiler` releases](https://github.com/nodemode-dev/formcompiler/releases?q=formskills-v&expanded=true).

**Keep it updated:** [FormPortal](https://github.com/nodemode-dev/formportal) installs, updates and rolls back every Form app from the same signed catalogue.

| Platform | Builds |
|---|---|
| macOS Apple silicon | yes |
| macOS Intel | yes |
| Linux x64 | yes |
| Windows x64 | yes |

All FormSkills builds are compiled and released from [`nodemode-dev/formcompiler`](https://github.com/nodemode-dev/formcompiler/releases), not from this repo. This repo holds the source.

## Run it from source

Want to contribute or try the latest code? Run it straight from this repo.

**Requires:** Rust (stable), Node 20.19+, and on Linux WebKitGTK 4.1 for the window (the installer prints the packages).

```sh
git clone git@github.com:nodemode-dev/formskills.git
cd formskills
./formskills_oc_install   # checks tools, installs the window packages, fetches the Rust crates
./formskills              # starts the interface on localhost:5630 and opens the desktop window
```

The window needs its Tauri shell to read skills; the interface alone in a browser only says so. `./formskills dev` reads Form app checkouts beside this one instead of releases.

On Windows run `formskills_oc_install.bat`, then `formskills.bat`. Ports: 5630 (Vite dev server) and 5631 (preview), localhost only.

> [!IMPORTANT]
> **Status:** early. FormSkills has no tagged release in formcompiler yet, so the Download table lists the platforms it builds for. Agents loading installed skills is taken from each agent's docs, not tried here.

**Contributing:** branch from `main`, keep changes to source here, and leave packaging and releases to formcompiler. See [`.docs/BRANCHING.md`](.docs/BRANCHING.md) and [`AGENTS.md`](AGENTS.md).

## Repository

| Path | What it is |
|---|---|
| `core/` | The engine: apps list, signed catalogue, fetching, search, format check, downloads, edits, installs |
| `cli/` | `formskills-cli`, the JSON command line |
| `src-tauri/` | The Tauri shell that opens the window |
| `frontend/` | The window: chips, cards, detail pane and reader |
| `setup/apps.py` | Generates `core/data/apps.json` from formcompiler's registry |

Docs: [`.docs/wiki`](.docs/wiki) · Agents: [`CLAUDE.md`](CLAUDE.md), [`AGENTS.md`](AGENTS.md) · Contributing: [`.docs/BRANCHING.md`](.docs/BRANCHING.md)

## The Form family

FormSkills is one of the **Form apps**: native creative tools that install, update and roll back through FormPortal and can all be driven by agents.

| | App | What it's for | Download | Code |
|:-:|---|---|---|---|
| <img src=".github/assets/family/form.md.png" alt="" width="32" height="32"> | **form.md** | Documents, databases and realtime editing together | [formai.studio](https://formmd.formai.studio/) | [GitHub](https://github.com/nodemode-dev/form.md) |
| <img src=".github/assets/family/format.png" alt="" width="32" height="32"> | **FormAT** | Chat and agent workspace on your key | [formai.studio](https://format.formai.studio/) | [GitHub](https://github.com/nodemode-dev/format) |
| <img src=".github/assets/family/formCAD.png" alt="" width="32" height="32"> | **FormCAD** | Drafting, parametric parts and NURBS surfaces | | [GitHub](https://github.com/nodemode-dev/formCAD) |
| <img src=".github/assets/family/formcel.png" alt="" width="32" height="32"> | **FormCel** | Spreadsheets agents can read and edit | [formai.studio](https://formcel.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formcel) |
| <img src=".github/assets/family/formcraft.png" alt="" width="32" height="32"> | **FormCraft** | Generate images, video, audio, 3D and worlds | | [GitHub](https://github.com/nodemode-dev/formcraft) |
| <img src=".github/assets/family/formcut.png" alt="" width="32" height="32"> | **FormCut** | Multi-track video editing with no upload | [formai.studio](https://formcut.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formcut) |
| <img src=".github/assets/family/formDAM.png" alt="" width="32" height="32"> | **FormDAM** | Photo library and asset manager | [formai.studio](https://formdam.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formDAM) |
| <img src=".github/assets/family/formdeck.png" alt="" width="32" height="32"> | **FormDeck** | Presentations and pitch decks | [formai.studio](https://formdeck.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formdeck) |
| <img src=".github/assets/family/formdesign.png" alt="" width="32" height="32"> | **FormDesign** | Page layout for print and the web | [formai.studio](https://formdesign.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formdesign) |
| <img src=".github/assets/family/formencoder.png" alt="" width="32" height="32"> | **FormEncoder** | Media encoding queue with presets | [formai.studio](https://formencoder.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formencoder) |
| <img src=".github/assets/family/formfabric.png" alt="" width="32" height="32"> | **FormFabric** | Sewing patterns draped with cloth simulation | | [GitHub](https://github.com/nodemode-dev/formfabric) |
| <img src=".github/assets/family/formlit.png" alt="" width="32" height="32"> | **FormLit** | Photo library and raw development | [formai.studio](https://formlit.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formlit) |
| <img src=".github/assets/family/formmorpheus.png" alt="" width="32" height="32"> | **FormMorpheus** | Frame-by-frame and performed animation | | [GitHub](https://github.com/nodemode-dev/formmorpheus) |
| <img src=".github/assets/family/formNET.png" alt="" width="32" height="32"> | **FormNET** | See what your computer sends online | | [GitHub](https://github.com/nodemode-dev/formNET) |
| <img src=".github/assets/family/formpath.png" alt="" width="32" height="32"> | **FormPath** | Vector illustration with artboards and type | [formai.studio](https://formpath.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formpath) |
| <img src=".github/assets/family/formpdf.png" alt="" width="32" height="32"> | **FormPDF** | Edit, redact, sign and fill PDFs | [formai.studio](https://formpdf.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formpdf) |
| <img src=".github/assets/family/formpromo.png" alt="" width="32" height="32"> | **FormPromo** | Promo films from your own media | [formai.studio](https://formpromo.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formpromo) |
| <img src=".github/assets/family/formref.png" alt="" width="32" height="32"> | **FormRef** | Reference boards for creative work | [formai.studio](https://formref.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formref) |
| <img src=".github/assets/family/formrig.png" alt="" width="32" height="32"> | **FormRig** | Rig, skin and retarget any mesh | | [GitHub](https://github.com/nodemode-dev/formrig) |
| <img src=".github/assets/family/formsculpt.png" alt="" width="32" height="32"> | **FormSculpt** | 3D sculpting, remeshing and painting | [formai.studio](https://formsculpt.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formsculpt) |
| <img src=".github/assets/family/formsurface.png" alt="" width="32" height="32"> | **FormSurface** | Texture painting with PBR export | [formai.studio](https://formsurface.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formsurface) |
| <img src=".github/assets/family/formtools.png" alt="" width="32" height="32"> | **FormTools** | Viewers, batch tools and file utilities | | [GitHub](https://github.com/nodemode-dev/formtools) |
| <img src=".github/assets/family/formtxt.png" alt="" width="32" height="32"> | **FormTxt** | Word processing with .docx round trips | [formai.studio](https://formtxt.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formtxt) |
| <img src=".github/assets/family/formvfx.png" alt="" width="32" height="32"> | **FormVFX** | Motion graphics and VFX compositing | [formai.studio](https://formvfx.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formvfx) |
| <img src=".github/assets/family/formvis.png" alt="" width="32" height="32"> | **FormVis** | Layered image editing with local AI | [formai.studio](https://formvis.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formvis) |
| <img src=".github/assets/family/formwav.png" alt="" width="32" height="32"> | **FormWav** | Multitrack audio editing and mixing | [formai.studio](https://formwav.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formwav) |
| <img src=".github/assets/family/formweb.png" alt="" width="32" height="32"> | **FormWeb** | Visual website building with a CMS | [formai.studio](https://formweb.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formweb) |
| <img src=".github/assets/family/formportal.png" alt="" width="32" height="32"> | **FormPortal** | Install, update and roll back Form apps | [formai.studio](https://formportal.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formportal) |
| <img src=".github/assets/family/formtray.png" alt="" width="32" height="32"> | **FormTray** | One dock icon for every app | [formai.studio](https://formtray.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formtray) |
| <img src=".github/assets/family/formMCP.png" alt="" width="32" height="32"> | **FormMCP** | One MCP connection to the family | [formai.studio](https://formmcp.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formMCP) |
| <img src=".github/assets/family/formskills.png" alt="" width="32" height="32"> | **FormSkills** | Every app's agent skills in one place | [formai.studio](https://formskill.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formskills) |
| <img src=".github/assets/family/formbench.png" alt="" width="32" height="32"> | **FormBench** | Parity, testing and rankings for the family | [formai.studio](https://formranker.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formbench) |
| <img src=".github/assets/family/formslot.png" alt="" width="32" height="32"> | **FormSlot** | Codebase memory for coding agents | | [GitHub](https://github.com/nodemode-dev/formslot) |
| <img src=".github/assets/family/subform.png" alt="" width="32" height="32"> | **SubForm** | Workbench for parallel Claude Code agents | | [GitHub](https://github.com/nodemode-dev/subform) |
| <img src=".github/assets/family/formcompiler.png" alt="" width="32" height="32"> | **FormCompiler** | Builds, signs and releases every app | [formai.studio](https://formcompiler.formai.studio/) | [GitHub](https://github.com/nodemode-dev/formcompiler) |
| <img src=".github/assets/family/formpipe.png" alt="" width="32" height="32"> | **FormPipe** | Release pipeline and update feeds | | [GitHub](https://github.com/nodemode-dev/formpipe) |

<br>

---

## Maintainers

| Maintainer | Role |
|---|---|
| [@nodemode-ai](https://github.com/nodemode-ai) | Owner |
| [@gbarnai](https://github.com/gbarnai) | Co-owner |

Code owners are set in [`.github/CODEOWNERS`](.github/CODEOWNERS).

## License

FormSkills is licensed under the GNU General Public License v3.0 ([`LICENSE`](LICENSE), SPDX `GPL-3.0-only`). Copyright 2026 NodeAgentc, Inc. Third-party notices: [`NOTICE.md`](NOTICE.md).

<sub>Screenshot content: the released skills of the Form apps, read from local checkouts of their repositories.</sub>

Claude Code, Codex and Cursor are named only as the agent tools the skills are written for. FormSkills is an independent project and is not affiliated with or endorsed by Anthropic, OpenAI or Anysphere.
