# Demo credits

Everything the demo shows beyond formskills' own code comes from the Form family's own repositories, all by the same owner (NodeAgentc, Inc.). No third-party photo, video, audio or font is used. Each source repository states its own licence in its `LICENSE` file; that licence is the one given here.

## App icons (`media/icons/`)

Each is the app's icon from `assets/app-icon/<name>-256.png` in the app's repository, resized to 128 by 128 and re-encoded as webp. Nothing else was changed.

| File | App | Source | Licence |
| --- | --- | --- | --- |
| `form.md.webp` | Form.md | https://github.com/nodemode-dev/form.md | Apache-2.0 |
| `formMCP.webp` | formMCP | https://github.com/nodemode-dev/formMCP | GPL-3.0-only |
| `formcut.webp` | formcut | https://github.com/nodemode-dev/formcut | Apache-2.0 |
| `formdeck.webp` | formdeck | https://github.com/nodemode-dev/formdeck | Apache-2.0 |
| `formencoder.webp` | formencoder | https://github.com/nodemode-dev/formencoder | Apache-2.0 |
| `formlit.webp` | formlit | https://github.com/nodemode-dev/formlit | Apache-2.0 |
| `formpdf.webp` | formpdf | https://github.com/nodemode-dev/formpdf | Apache-2.0 |
| `formportal.webp` | formportal | https://github.com/nodemode-dev/formportal | GPL-3.0-only |
| `formvfx.webp` | formvfx | https://github.com/nodemode-dev/formvfx | Apache-2.0 |
| `formvis.webp` | formvis | https://github.com/nodemode-dev/formvis | Apache-2.0 |
| `formwav.webp` | formwav | https://github.com/nodemode-dev/formwav | Apache-2.0 |

`formskills.png` in this folder is formskills' own icon (`frontend/public/formskills.png`).

## Screenshots (`media/shots/`)

Each is the app's hero screenshot from `docs/images/<name>-hero.*` in the app's repository (the app's own window), resized to 1280 pixels wide and re-encoded as webp. The files are named like the icons above (`<repository>.webp`) and carry the same source and licence as the matching row.

## Skills (built into `assets/demo.js`)

The skills the demo lists are not files in this folder. `frontend/vite.family-skills.ts` reads them at build time with `git show` from each app repository's latest release tag (and the one before it, where an earlier tag carries skills) under `.claude/skills`, and the build embeds them read-only in `assets/demo.js`. They are the apps' own text, unedited, shown as text and never run. The repository's CLAUDE.md says an app's skills are never copied into formskills' tree; the demo keeps to that for the source tree (no skill file is stored as a file here) and renders them only at build time into the bundle, as the demo brief allows.

| App | Repository | Release tag shown | Earlier tag | Licence |
| --- | --- | --- | --- | --- |
| Form.md | form.md | v0.48.0 | v0.47.7 | Apache-2.0 |
| formMCP | formMCP | v0.7.8 | none | GPL-3.0-only |
| formcut | formcut | v2.12.1 | none | Apache-2.0 |
| formdeck (FormSlide) | formdeck | v0.30.7 | none | Apache-2.0 |
| formencoder | formencoder | v0.5.5 | none | Apache-2.0 |
| formlit | formlit | v0.48.0 | none | Apache-2.0 |
| formpdf | formpdf | v0.57.3 | none | Apache-2.0 |
| formportal (FormPortal) | formportal | v0.60.0 | v0.59.0 | GPL-3.0-only |
| formvfx | formvfx | v0.52.8 | none | Apache-2.0 |
| formvis | formvis | v1.99.7 | none | Apache-2.0 |
| formwav | formwav | v2.22.3 | none | Apache-2.0 |

Apps with no repository beside formskills at build time (Format, FormDesign, FormPath, FormPromo, FormRef, FormSculpt, FormSurface, FormWeb) show no skills.
