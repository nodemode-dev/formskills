# Author demo credits

Everything the demo shows beyond formskills' own code comes from the Form family's own repositories, all by the same owner (NodeAgentc, Inc.), or is sample text written for this demo. The demo adds no photo, video, audio or font from anywhere else. `media/` is a byte-for-byte copy of `../../demo/media/`, and every file in it is credited here exactly as in `../../demo/CREDITS.md`. Each source repository states its own licence in its `LICENSE` file, checked on disk when this demo was built; that licence is the one given here. formskills itself is GPL-3.0-only, which takes Apache-2.0 assets.

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

## Family icon pack (`media/icons/`, eight more)

`format`, `formdesign`, `formpath`, `formpromo`, `formref`, `formsculpt`, `formsurface` and `formweb` are the dark icons from the family icon pack in `formtray/frontend/public/apps/` (commit 646846e, FormTray, Apache-2.0), the owner's own artwork (NodeAgentc, Inc.), resized to 128 by 128 and re-encoded as webp.

## Screenshots (`media/shots/`)

Each file is a demo screenshot of the app, taken from the app's own demo (the app's real window running its demo), resized to 1280 pixels wide and re-encoded as webp. The interface is the app's own work, under the licence in the table. Every photo, clip or recording visible in a capture is credited in that app's own `demo/CREDITS.md`, as Pexels, CC0 or public domain. The author demo's opening page does not show them; the Release and app pages reuse them as demo 1 does.

| File | Source | App licence |
| --- | --- | --- |
| `shots/formcut.webp` | formcut 2.13.1 demo, https://github.com/nodemode-dev/formcut | Apache-2.0 |
| `shots/formlit.webp` | formlit 0.49.1 demo, https://github.com/nodemode-dev/formlit | Apache-2.0 |
| `shots/formwav.webp` | formwav 2.23.1 demo, https://github.com/nodemode-dev/formwav | Apache-2.0 |
| `shots/formpdf.webp` | formpdf 0.58.1 demo, https://github.com/nodemode-dev/formpdf | Apache-2.0 |
| `shots/formdeck.webp` | formdeck 0.31.1 demo, https://github.com/nodemode-dev/formdeck | Apache-2.0 |
| `shots/formvis.webp` | formvis 2.0.0 demo, https://github.com/nodemode-dev/formvis | Apache-2.0 |
| `shots/formvfx.webp` | formvfx 0.53.1 demo, https://github.com/nodemode-dev/formvfx | Apache-2.0 |
| `shots/formencoder.webp` | formencoder 0.6.1 demo, https://github.com/nodemode-dev/formencoder | Apache-2.0 |
| `shots/form.md.webp` | form.md demo, https://github.com/nodemode-dev/form.md | Apache-2.0 |

## Skills (built into `assets/demo.js`)

The skills of the apps are not files in this folder. `frontend/vite.family-skills.ts` reads them at build time with `git show` from each app repository's latest release tag (and the newest earlier tag whose skills differ) under `.claude/skills`, and the build embeds them read-only in `assets/demo.js`. They are the apps' own text, unedited, shown as text and never run; see `../../demo/CREDITS.md` for the tag and licence of each. The one exception is the copy of `formpdf-harness` under Your skills, which starts as the released text (Apache-2.0, formpdf) with two lines changed by `src/seed.ts` at start-up, the way a visitor's own edit would. The original is never altered.

## Sample drafts (`src/seed.ts`)

`release-notes`, `tidy-meeting-notes` and `commit-message-style` are sample skills written for this demo by the formskills project, GPL-3.0-only, like the rest of the repository. They contain no third-party text.
