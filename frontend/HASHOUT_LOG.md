# HASHOUT_LOG · frontend · formskills

Living log for formskills' window. Source files stay comment-free; what they would have said lives here.

Current build version: v0.10.2
Last updated: 2026-11-10 · the dev engine bridge refuses foreign pages; v0.10.2 version bump only; 2026-10-25 · the Install and Installed pages; Your skills, the Release row, Trust; search, topics, the format page and Check; editing your own copy; the reader and downloads; where each app's skills come from; chips, cards and the detail pane

## v0.10.3 · review fixes {#v0-10-3}

### vite.engine.ts · the dev engine bridge answers only its own page
- refers-to: frontend/vite.engine.ts :: engineBridge
- kind: fix
- logged: v0.10.3 · 2026-11-10

With `FORMSKILLS_ENGINE=1` the dev server ran `formskills-cli` for any POST to `/api/engine/<command>`, and `body()` parsed any content type as JSON. Any web page open in the same browser could send a `text/plain` POST (no preflight) and discard copies and own skills, write copy files or create skills; the answer was unreadable cross-origin but the side effects happened, and `server.host: false` does not help because the browser itself is on localhost. The POST branch now replies 403 unless the Content-Type starts with `application/json` (which makes a cross-site request preflight first, and Vite does not grant it) and the Origin header is absent or is `http://localhost:<server port>`. The window's own `engine-bridge.ts` already sends JSON from that origin. Checked with the dev server up and curl: a foreign Origin with text/plain or JSON and a text/plain POST with no Origin got 403; the own Origin with JSON got the result.

## v0.10.1 · the reader keeps its content inside the pane {#v0-10-1}

### styles/app.css · the reader's one column, the head's buttons wrap, long titles give way
- refers-to: src/styles/app.css :: .reader, .reader-actions, .flag-text, .pane-title
- kind: fix
- logged: v0.10.1 · 2026-11-09

Found in the family sweep after FormMCP's app cards spilled their Tools button and Live pill (FormMCP v0.10.1). `.reader` is a grid with rows but no column template, so its one implicit column grew to the widest line that cannot wrap: the edit bar (save state, the "original changed" flag, Mark as seen, Download your copy, Discard copy) and the reader head's buttons. Every row of the reader then ran past the pane's right edge, where `.detail.is-reading` clips it, so Discard copy, Show original and the Preview and Original tabs were cut off. Measured in Chromium on the demo build with the real window (`vite.demo.config.ts`), in edit mode with the flag showing: with a real flag line ("The original changed in 2.16.1: SKILL.md, references/install.md, references/rollback.md") 24 px at a 900 px window; with a long skill folder name and a long saved-to path 744 px at 900, 544 at 1100 and 464 at 1440 and 1920, in both themes; out of edit mode 7 px at 900. The column is now `minmax(0, 1fr)`, so the head's title and the flag shrink to their ellipsis instead. Inside the flag, the text and Mark as seen shrank together, so the button's label ran 9 to 12 px past its own border at 900 px; the text now takes `flex: 1` (a zero basis), so it alone gives way and the button keeps its width. Out of edit mode the head holds All skills and four buttons (Check, Install, Edit a copy, Download skill), which do not fit on one line in a two-pane window between 761 and 999 px: Download skill ran past the head by 75 px at 761, 51 at 800 and 21 at 850, and the All skills label ran 14 to 37 px past its own border from 761 to 950. The buttons now wrap to a second line, right-aligned, and nothing is cut. The same shrink-together happened in the pane heads: with a long search ("Search: " and the query) the Clear search label ran past its border, so `.pane-title` takes `flex: 1` like the flag's text. Not changed here: in that same range the skill's name and source line get no width at all (the title column is `minmax(0, 1fr)` beside two auto columns), before and after this fix; giving the title a share is a layout decision for the owner. Re-measured at 600, 760, 900, 1100, 1440 and 1920 px in dark and light over the cards, the detail pane, the reader, Check, edit mode with the flag, Install, Installed, search and Your skills: nothing outside any pane, card or bar. Left as is: a long inline code token in a skill's Markdown can be wider than its list item; it stays inside `.doc`, which scrolls.

## v0.10.0 · the demos in the app {#v0-10-0}

### index.html, demos.ts, demos.css, vite.demos.ts · Demos and Help
- refers-to: index.html :: #help-menu, #help-open, #help-pop, .demos, .demo-card, #demo-stage, #demo-frame, #demo-exit · src/demos.ts :: DEMOS, openDemo, closeDemo · src/styles/demos.css · vite.demos.ts :: inAppDemos, DEMOS, SHIPPED · ../src-tauri/tauri.conf.json :: csp frame-src
- kind: decision
- logged: v0.10.0 · 2026-11-09

The owner's rule is that every Form app opens all of its demos from inside the app. formskills' demos are not documents: each is the real window running against the TypeScript stand-in engine on the apps' released skills (and seeded copies or installs). Rebuilding that state in the real window would mean writing into the person's copies, own skills and installs, which CLAUDE.md and the brief forbid, so the app shows the demo's own page instead: a full-window stage on `--z-overlay` with a Demo badge, the demo's name, a line saying nothing reaches your skills, copies, installs or settings, and Exit Demo (also Escape when focus is in the window). The window underneath is left exactly as it was, so there is nothing unsaved to ask about. The frame is `sandbox="allow-scripts allow-downloads allow-forms"` without `allow-same-origin`: an opaque origin cannot use the app's storage or its engine, and the shim refuses to run unless its stand-in is the `__TAURI__` the page sees. Downloads stay allowed so Download skill still saves a zip.

The pages are the committed browser demo builds, not a copy: `vite.demos.ts` serves them in `npm run dev` and copies only `index.html`, `formskills.png`, `assets/demo.*` and `media/` of `demo/`, `demos/author/` and `demos/install/` into `dist/` at the same paths, so the links between demos still work and the app needs no network. The CSP's `frame-src` gains `'self'`. formskills has no menu bar, so Help is a header button with the Extensions menu's popover (Demos, then Explore Demo, Author Demo, Install Demo); the opening pane gets a Demos section of three cards with inline currentColor SVG previews. `.detail-empty` went from `height` to `min-height: 100%` so the taller pane scrolls instead of centring off the top. Items are found by `data-demo`, never by text. The command catalogue gains `demo-open { demo }`, which `main.ts` passes to `demos.ts` as a `formskills:demo-open` event, since the demo bundles import `main.ts` without the stage.

## v0.9.0 · extensions {#v0-9-0}

### formext/host-bridge.ts, extensions.ts · the host
- refers-to: src/formext/host-bridge.ts · src/extensions.ts :: initExtensions, HostContext, emit, emitSoon, theme, TOKENS, consent, confirmSave, openFiles, saveFile, rowFor, refreshRow, renderMenu, apply, reload, tick, answer, openPanel, runCommand, closeDocked
- kind: decision
- logged: v0.9.0 · 2026-11-07

`formext/host-bridge.ts` is the Form Extension Contract kit's file, copied unchanged (Apache-2.0, NOTICE). `extensions.ts` wraps it: handlers for read, apply, commands and run come from `main.ts`; notify writes the status line, which is where formskills tells the person what happened (it has no toasts); consent and the save question are `<dialog>`s in formskills' style, one at a time; `files.open` is a file input (the system picker in the app, the browser's in a browser), `files.save` goes to Downloads in the app and is a browser download in a browser; `net.fetch` is left out (-32003) because the window never reaches the network. The theme maps Studio Dark onto the contract's names (`--bg` ground, `--panel` pane, `--text` ink, `--muted` soft ink, `--accent`, `--border` edge, `--radius` small radius, plus float, control, fault, live) and is sent again when the system scheme changes. The window does nothing when the page has no `#ext-open` (the demos import `main.ts` with their own HTML).

### index.html, extensions.css, app.css · menu, panel, dialogs, zero flash
- refers-to: index.html :: #ext-menu, #ext-open, #ext-pop, #ext-pop-commands, #ext-pop-sep, #ext-pop-panel, #ext-pop-reload, #ext-pop-manage, #ext-undo, #extensions, #ext-rows, #ext-empty, #ext-root, #ext-panels, #ext-hidden, #ext-consent, #ext-save, #ext-dialog · src/styles/extensions.css · src/styles/app.css :: .bar, .status-row
- kind: decision
- logged: v0.9.0 · 2026-11-07

formskills has no menu bar; the header holds its app-wide commands, so the Extensions menu is a header button with a popover (`--z-overlay`): each contributed command as `Name: Title`, a separator when there is one, then Extensions Panel, Reload Extensions and Manage in FormPortal. The panel is one more detail-pane article like Installed; dock panels are articles in `#ext-panels` titled `Name: Panel`, kept alive (hidden) while another pane shows, closed with Close; dialog panels use the one `#ext-dialog`. Unlike the other overlays, the Extensions panel and dock panels do not close the reader: they hide it (and its reading and editing classes) and Close shows it again, so an extension sees the skill and file the person had open. Everything is in the HTML before the first paint and absolute or in hidden panes, so nothing moves when extensions arrive. `.bar` and `.status-row` became `grid-auto-flow: column` with only the first columns fixed, which lays out the old children exactly as before and gives the Extensions button and Undo a column only while they are shown. Rows are keyed by id with a signature; a reload replaces only rows whose record or state changed and moves none that did not; the menu is rebuilt only when its text changes.

### main.ts · document, commands, one undo step, events, the browser build
- refers-to: src/main.ts :: tauriInvoke, invoke, EXT_COMMANDS, selection, paneShown, viewSnapshot, librarySnapshot, engine, readDocument, syncEditor, runAppCommand, finishStep, applyOps, runOne, undoButton, lastLibrary, Overlay, setOverlay · src/engine-bridge.ts :: engineInvoke · vite.engine.ts :: engineBridge, HANDLERS · vite.config.ts :: ENGINE, __ENGINE_BRIDGE__
- kind: decision
- logged: v0.9.0 · 2026-11-07

The document is what the window already holds: the view, the library, the open skill and file, your copies, your own skills (`docs/EXTENSIONS.md`). The command catalogue is the window's own actions and engine calls; installing, pinning, discarding and marking seen are left to the person. formskills had no undo: each `document.apply` (and each `app.run` of a writing command) collects what it wrote, and the status line's Undo writes the old text back and discards a copy or skill it made, in reverse, one step kept. An extension writing the file open in the editor first saves the person's typing, then the editor takes the new text in place. `document.changed` follows a library read, a save, your skills changing and an Undo; `selection.changed` follows choose, open skill, open file and closing the reader, coalesced to one per turn. The browser build: `FORMSKILLS_ENGINE=1 npm run dev` adds a Vite middleware that answers the window's invoke calls with `formskills-cli` (its JSON commands) and serves `/api/extensions` and `/api/extensions/files/...` through the same Rust resolver, so the window in a plain browser reads real skills and runs real extensions; without the variable the bridge code is compiled out.

### extensions.ts, main.ts, vite.engine.ts · consent before the frame, the menu before the first paint
- refers-to: src/extensions.ts :: initExtensions, openPanel · src/main.ts :: EXTENSIONS_WAIT_MS, reveal · vite.engine.ts :: HANDLERS.app_ready
- kind: fix
- logged: v0.9.0 · 2026-11-07

Panels open through the kit's `open()`, which asks for consent and only then creates the frame; a dock article made for a declined panel is removed again. `initExtensions` returns the first listing's promise (or `null` when the page has no `#ext-open`, so the demos still reveal at once), and `main.ts` keeps the `booting` class until that listing has filled the menu and rows, at most 2 s, so the Extensions menu opened right after start already holds the contributed commands. The browser build answers `app_ready` with `null` (it has no splash to reveal) instead of 400, and answers HEAD under `/api/extensions/files/` with the same status and headers as GET and no body, instead of falling through to Vite's index page.

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

### package.json · vite 8.3.5 clears the dev server's launch-editor advisories
- refers-to: frontend/package.json :: devDependencies.vite · frontend/package-lock.json
- kind: fix
- logged: v0.7.1 · 2026-10-25

Family rule from `FAMILY_DEV_PLAN.md` v0.4.x Phase 2b (formai_dev sidecar): every frontend installs with zero `npm audit` findings. Vite 8.3.2 carries a `launch-editor` with two command-injection advisories in the dev server (ledger FB-004); 8.3.5 clears them. Dev dependency only, nothing in the shipped bundle changed. Verified after `npm install`: `npm audit` reports 0 vulnerabilities, `npm run typecheck` passes, `vite build` succeeds (outDir outside the repo), and the dev server answers 200 on `http://localhost:5630/` with no Network address printed.

### public/splash.html, src/main.ts · the splash page and the ready call
- refers-to: frontend/public/splash.html · frontend/src/main.ts :: app_ready call after `booting` is removed
- kind: decision
- logged: v0.8.2 · 2026-11-07

`splash.html` is formvis's card with the app name, `formskills.png` and `formskillsSplashDone`; it lives in `public/` so it reaches `frontend/dist` untouched. `main.ts` invokes `app_ready` two animation frames after the `booting` class is removed, i.e. once the final layout is painted; without the shell (a browser, the demo) there is no `invoke` or the demo's stand-in rejects the command, and the rejection is swallowed.

### styles/tokens.css · the Form family colours
- refers-to: frontend/src/styles/tokens.css :: :root, prefers-color-scheme light
- kind: decision
- logged: v0.8.1 · 2026-11-07

The owner found the cool blue-grey surfaces off the family look, so both themes take the Form family values (`form-redesign-kit/data/family-kit.md`): Studio Dark `#050505` ground, `#111111` panes, `#191919` raised controls, hairlines `#222124` and `#34333a`, ink `#f7f7f7`, `#a4a4a4`, `#717072`, errors `#f87171`; warm paper `#e2e0d8`, `#ecebe6`, `#f9f8f4`, `#d6d2c6`, `#c4bfb1`, ink `#26241d`, `#4c4a40`, `#8b887a`, errors `#c2362f`. Orange `#f97316` stays the highlight (active chip, selected card, focus). The violet second accent is gone: `--accent-2` is formskills' own hue `#ffc069`, used only for its own marks (edited-file dot, found-text mark, quote rule). Controls are solid raised surfaces now, not translucent white or black, so hover and press step through the two hairline tones. No selector or layout changed. Faint ink on the paper `#ecebe6` is the family's `#8b887a` (about 3:1), used only for hints and meta lines.
