# HASHOUT_LOG · frontend · formskills

Living log for formskills' window. Source files stay comment-free; what they would have said lives here.

Current build version: v0.7.0
Last updated: 2026-10-25 · the Install and Installed pages; Your skills, the Release row, Trust; search, topics, the format page and Check; editing your own copy; the reader and downloads; where each app's skills come from; chips, cards and the detail pane

## v0.7.0 · the Install and Installed pages {#v0-7-0}

### index.html, main.ts, app.css · Install
- refers-to: index.html :: #install, #install-app, #install-skill, .install-group, #install-path, #install-where, #install-go, #install-hint, #install-result · src/main.ts :: Overlay, setOverlay, openInstall, showInstallWhere, runInstall, chosenAgents, projectScope, AGENT_DIRS, returnTo, install-back handler, installAppButton · src/styles/app.css :: .install-group, .install-option, .install-path, #install-where, .install-actions, .install-result, .install-row
- kind: decision
- logged: v0.7.0 · 2026-10-25

Install is a fourth overlay, static HTML like Trust, so opening it moves nothing else; the "where it goes" line keeps two lines of room and the result list grows only inside the pane, which scrolls. Install on a skill saves an open edit first and installs the copy when editing (the released skill otherwise); Back reopens what was open (the skill, editing again if it was, your own skill, or the app). Install all follows Download all's enabled state. A refusal that names force adds one button, Install anyway, replacing your changes there, which runs the same install with force. The agent folders in the page mirror `install.rs`; change both together. The groups first had a top rule, but WebKitGTK draws a fieldset's rule beside the legend rather than above it (seen in the real window), so they are plain.

### main.ts, app.css · Installed
- refers-to: index.html :: #installed, #installed-open, #installed-list · src/main.ts :: showInstalled, originText, Installed · src/styles/app.css :: .installed-row, .installed-head, .installed-where, .installed-info, .bar
- kind: decision
- logged: v0.7.0 · 2026-10-25

Each row: the skill folder over where and from what (both clipped, full path as a tooltip), then the state (as installed, changed there with the files, missing, or a newer release), Update and Remove. The state was first last on one clipped line and fell off at 1040 wide; it now has its own column, and below 760 px its own row. Update is off for a changed install (it would need force; the tooltip says how) and for a release that is already newest; Remove takes a second click within four seconds, and reads Remove, losing changes when the folder was changed there. The header gained Installed, so the bar has six columns. Checked at 4x CPU and network throttling, dark 1040 by 720 and light 640 by 520: CLS 0, no errors, no sideways scroll.

## v0.6.0 · Your skills, the Release row, Trust {#v0-6-0}

### index.html, main.ts · Your skills
- refers-to: index.html :: .card-own, #own-card, #detail-own, #own-form, #own-name, #own-description, #own-create, #own-note, #own-list · src/main.ts :: OWN, loadOwn, showOwn, stageOwn, openOwn, nameProblem, choose, updateControls, renderReport, discard handler
- kind: decision
- logged: v0.6.0 · 2026-10-25

The Your skills card is static HTML at the top of the list, so it is in the first frame and the generated cards append after it; it is not one of `cards`, so topic and app filters leave it shown (and leave it chosen: `apply` no longer treats `yours` as an app that left the list, found in the real window). Your own skills open straight in the editor: there is no released original, so Show original is hidden, the Original tab says so, Download reads Download skill and the check panel says "Your skill". The library map gets a `yours` entry (re-added after every library load) so the reader's code finds the skill.

The first throttled run measured CLS 0.26: after New skill, the own pane switched to the full-width editor only after three engine calls, well past the half second that counts as following the click. `stageOwn` now lays out the editor on the click itself (reader shown, editing classes set, editor empty and disabled, "Opening") and the calls fill it in; a failure puts the pane back. CLS 0 after.

### index.html, main.ts, app.css · Release row and Trust
- refers-to: index.html :: .release-row, #release-pick, #update-app, #release-note, #trust, #trust-open, #trust-close · src/main.ts :: showRelease, setOverlay, shortText, longText · src/styles/app.css :: .release-row, .facts dd[data-f="here"], .bar
- kind: fix
- logged: v0.6.0 · 2026-10-25

The Release row is a fixed row of the app detail: a select (Latest, then Keep for each earlier release with skills) and Update this app, with a one-line note that never wraps. Pinning measured CLS 0.002 at first: the Skills here line grew by a sentence and pushed the skill list down; the pin wording moved to the note and that line keeps room for three lines. The Trust page is static HTML like the format page, opened as a third overlay. Adding its button gave the header five items for four grid columns, which pushed the version onto its own line; the bar now has five columns.

## v0.5.0 · search, topics, the format page and Check {#v0-5-0}

### index.html, main.ts · results and the format page live in the detail pane
- refers-to: index.html :: #search, #results, #results-title, #results-note, #hits, #results-clear, #guide, #guide-open, #guide-close · src/main.ts :: setOverlay, renderHits, runSearch, clearSearch, inFilter, apply, overlay, hits
- kind: decision
- logged: v0.5.0 · 2026-10-25

The app list is the one thing the first frame builds complete, so search never replaces it: results and the format page are two more articles in the detail pane, shown in place of the empty state, the app detail or the reader (`setOverlay`). Typing searches after 180 ms (Enter at once, Escape clears); two characters at least. The chips filter results in place (`inFilter`: All, a topic, or one app) and say how many more are under All. Opening a result chooses its app, scrolls its card into view in the list, and opens the reader at the file that matched; All skills goes back to the results while the query stands. The topic chips are built from the list's `topics` in the first frame, before a thin separator and the app chips, so the row's height never changes. The format page is static HTML in `index.html`, there from the first frame and hidden.

### main.ts, app.css · Check and live findings
- refers-to: index.html :: #check-skill, #findings, #findings-sum, #findings-fields, #findings-list · src/main.ts :: renderReport, runCheck, checkText, licenceText, updateControls, saveNow, enterEdit · src/styles/app.css :: .findings, .finding, .skill-meta
- kind: fix
- logged: v0.5.0 · 2026-10-25

The findings panel is a fourth row of the reader, between its head and the edit bar. In edit mode it is always shown and runs `edit_check` after every save; reading, Check toggles it. The first throttled run measured CLS 0.012: the panel grew when the report arrived (400 ms after the edit started) and pushed the edit bar and editor down. The panel now has a fixed height (84 px, 52 px in windows under 600 px tall) and scrolls inside, so a report of any length moves nothing: CLS 0 after. The pass line is in ink, not the green `--live`, which the light theme does not redefine and would be faint on white. Skill cards gained a meta line (licence, then the check summary, in the fault colour when there is an error); the memo key that decides whether to rebuild the list now includes each skill's check and licence.

## v0.4.0 · editing your own copy {#v0-4-0}

### index.html, main.ts · edit mode inside the reader
- refers-to: index.html :: #edit-toggle, #edit-bar, #save-state, #flag, #seen, #download-copy, #discard, #editor-wrap, #editor, #side, #tab-preview, #tab-original, #preview, #original · src/main.ts :: editMark, updateControls, markEdited, saveNow, renderPreview, loadOriginal, openEditFile, enterEdit, leaveEdit, loadEdits, selectTab, renderInto
- kind: decision
- logged: v0.4.0 · 2026-10-24

The reader's head has one edit button whose label says the state: "Edit a copy" (none yet: makes one), "Edit your copy", "Your copy (original updated)", or "Show original" while editing. Edit mode adds a 40 px bar (save state; the flag naming the changed original files with Mark as seen; Download your copy; Discard copy) and turns the body into the copy's files (a violet dot on files you changed, an orange one on files the original changed), a plain-text editor, and a side column with Preview and Original tabs; the original is read-only there and comes from the same release or checkout as the reader. Typing re-renders the preview after 150 ms and saves 800 ms after the last key (Ctrl or Cmd+S at once); changing file, showing the original, leaving the skill, downloading and closing the window save first. A failed save keeps the text and says why. Discard needs a second click within 4 s and says so on the button; there is no browser dialog. Skill cards show "Your copy" or "Your copy · original updated". While editing, the editor takes the whole width (the app list steps aside) and the original's Download skill is hidden; below 760 px the editor and side stack and the bar wraps. `renderInto` is the one renderer for the reader, the preview and the original.

Measured in Chromium at 4x CPU with a bridge that runs the real `formskills-cli` against a scratch checkout of formcut (each call delayed 400 ms, the library 900 ms), dark, light and 640 by 480: open formcut-mcp, Edit a copy, type a section (saved; preview shows it; the Original tab and the file on disk do not), change the original on disk, reload (the copy keeps the text; the flag names SKILL.md), Mark as seen (flag gone), Download your copy (zip saved), Discard twice (copy gone on disk, back to the original): CLS 0, no page error. The v0.2.0 and v0.3.0 runs again: CLS 0.

## v0.3.0 · the reader and downloads {#v0-3-0}

### index.html, main.ts · skill cards, a reader, and the app list never moves
- refers-to: index.html :: .app-actions, #download-app, #reader, #files, #doc · src/main.ts :: showSkills, openSkill, openFile, showFiles, wireLinks, resolve, closeReader, save
- kind: decision
- logged: v0.3.0 · 2026-10-24

The left column stays one card per app, built in the first frame, so skills arriving late never move it. The detail pane shows the chosen app's skills as cards; a card opens the reader in the same pane: a head row (All skills, the skill's name and source, Download skill) and below it the skill's files grouped as Skill, Sub-skills (named by their folder), References (last two path parts) and Other files, beside the open file. SKILL.md opens first. Markdown files show their front matter as a small table and the body rendered; other text in a monospaced block; anything else a note. Requests are numbered so a slow answer for a file no longer chosen is dropped. A Markdown link whose target, resolved against the open file, is a file of this skill becomes a link (click or Enter) to it; links that leave the skill, web addresses and anchors stay inert text with the address as their title. Download all and Download skill write the zip and say where in the status line. Below 760 px wide the app list steps aside while a skill is open. Refresh while reading keeps the open file when it still exists.

### markdown.ts · the family's renderer, adapted
- refers-to: src/markdown.ts :: renderMarkdown, splitFrontMatter, inline
- kind: rationale
- logged: v0.3.0 · 2026-10-24

From formsculpt and formlit (identical copies, GPL-3.0-only, same owner), per the family plan's preference: block Markdown to DOM nodes, never parsing HTML, so a skill cannot inject markup or script (`<b>` in a skill shows as text). Kept: paragraphs, headings, lists, tables, fenced code, rules and inline code, bold, italics and links. Changed: the `fs-md` class names, links carry `data-href`, block quotes added, front matter split out, the streaming class dropped, and a guard so a line no rule takes is still consumed.

### app.css · the chip row leaves room for its own scrollbar
- refers-to: src/styles/app.css :: .chips, .tools, .count, .reader, .files, .doc, .fs-md
- kind: fix
- logged: v0.3.0 · 2026-10-24

The real window under Xvfb showed WebKitGTK's overlay scrollbar drawn over the lower half of the chips on hover, so a click on a chip hit the scrollbar (Chromium did not show it). The chip row is now 48 px with the chips at the top and 16 px below them for the scrollbar, and the mouse wheel scrolls it sideways. Measured after the change in Chromium at 4x CPU and a slow network with a stub bridge that returns real files from the checkouts after 800 ms, dark, light and 640 by 480: open an app, Download all, open formvis-harness (21 files, 4 groups, 7 headings, 3 tables), a sub-skill, Download skill, switch app, back: CLS 0, no page error, no sideways scroll; the v0.2.0 arrival and browser-preview runs: CLS 0. Links checked with a scratch skill: two links to its own guide followed (one with `./` and an anchor), one climbing out of the skill and one web address inert, Enter follows a focused link.

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
