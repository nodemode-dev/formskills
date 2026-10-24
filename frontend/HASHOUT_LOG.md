# HASHOUT_LOG · frontend · formskills

Living log for formskills' window. Source files stay comment-free; what they would have said lives here.

Current build version: v0.1.0
Last updated: 2026-10-24 · chips, cards and the detail pane

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
