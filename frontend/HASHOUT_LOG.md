# HASHOUT_LOG · frontend · formskills

Living log for formskills' window. Source files stay comment-free; what they would have said lives here.

Current build version: v0.2.0
Last updated: 2026-10-24 · where each app's skills come from; chips, cards and the detail pane

## v0.2.0 · where each app's skills come from {#v0-2-0}

### index.html, main.ts · live values in slots that already have their size
- refers-to: index.html :: .status-row, #status, #refresh, #skill-list · src/main.ts :: shortText, longText, showLibrary, showSkills, load · src/styles/app.css :: .status-row, .btn, .card-where, .skill-list
- kind: decision
- logged: v0.2.0 · 2026-10-24

A status row (40 px, one line with ellipsis and the full text as its title) says whether only released skills are shown or the dev mode is on, how many skills from how many apps, and where the catalogue came from; Refresh beside it (at least 96 px, disabled while it runs) downloads every app's latest release again. Each card's foot line, one line from the first frame ("Checking the latest release"), becomes "4 skills · release 1.97.2", "kept 2.10.1", "checkout" or "No released skills yet" in a fainter colour. The detail pane's "Skills here" says the source in full (digest checked, kept and why, the checkout's path, or why there are none), and below it each skill is a card with its name, file, sub-skill and reference counts, and description; the list is rebuilt only when the chosen app or its skill count changes, inside the pane's own scroll. The count line was left as it is so its column never changes width. Measured in Chromium at 4x CPU and a slow network with a stub bridge returning real dev-mode data (library after 900 ms, refresh after 1500 ms), dark, light and 640 by 480, choosing FormVis before the data arrived, then Refresh and the FormWeb chip: no partial first frame, CLS 0, no page error. In a browser without the bridge the status and cards say to open the app: CLS 0.

## v0.1.0 · chips, cards and the detail pane {#v0-1-0}

### main.ts · built once, before the first frame
- refers-to: index.html :: html.booting, #chips, #cards, #detail · src/main.ts :: chip, card, choose, apply · src/styles/app.css :: html.booting body
- kind: decision
- logged: v0.1.0 · 2026-10-24

The list is imported from `core/data/apps.json` at build time. `main.ts` creates the All chip and one chip per app, one card per app, the version and the source line, applies the All filter, and only then removes `booting` (which kept the body hidden), so the first visible frame is the whole window. The layout follows format's Customize view (family plan): chips led by All, a card list, a detail pane.

### main.ts · changes touch only what changed
- refers-to: src/main.ts :: apply, choose, setText
- kind: rationale
- logged: v0.1.0 · 2026-10-24

A chip toggles `hidden` on existing cards (only when it changes) and rewrites the count line; choosing a per-app chip also shows that app in the detail pane. A card is a button with `aria-pressed`; choosing it writes the detail pane's fixed fields with `setText` (only when the text differs) and swaps the empty state for the app view. The detail pane is a grid cell whose size the layout sets, so nothing outside it moves. In v0.1.0 the pane says where the skills live (folder, repository, release state) and that they have not been read yet; v0.3.0 fills it with the skills themselves.

### app.css · fixed sizes for everything that changes
- refers-to: src/styles/app.css :: .chips, .count, .split, .card-hit, .detail
- kind: decision
- logged: v0.1.0 · 2026-10-24

The chip row is 36 px high and scrolls sideways instead of wrapping, so 18 chips (more as apps are added) never change its height. The count has a minimum width and aligns right. The split is two grid columns (2 to 3), one column of two rows below 760 px; both the list and the pane scroll inside themselves. Tokens and the layer scale are formMCP's (FormTray's family tokens, orange and violet accents to match the icon).

Measured in Chromium at 4x CPU and a slow network (150 ms latency, 200 kB/s), dark and light, and at 640 by 480: the first visible frame already has 17 cards and 18 chips, no visible frame was partial; choosing FormVis, the FormCut chip and All: CLS 0, no page error, no sideways scroll.
