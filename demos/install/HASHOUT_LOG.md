# HASHOUT_LOG · demos/install · formskills

Living log for demo 3. Source files stay comment-free; what they would have said lives here.

Current build version: v0.13.0
Last updated: 2026-11-20 · Antigravity named where the page lists the agent programs; 2026-11-07 · the install demo

## v0.13.0 · Antigravity {#v0-13-0}

### index.html, src/install.ts · Antigravity is named, not offered
- refers-to: index.html :: #install-hint, #guide, .demo-hero-sub · src/install.ts :: NOTES.install
- kind: decision
- logged: v0.13.0 · 2026-11-20

The page carries the window's markup by hand, so it takes the window's two sentences of 0.12.0 as they are: the install hint says Antigravity is not a choice because it reads no skills and gets an app's MCP server only, and the format page adds that Antigravity reads no skills. The opening text and the Install more step note say the same in a few words. The checkboxes, the stand-in's targets and `AGENTS` in src/inspect.ts are install targets and stay at three. `assets/` is rebuilt by the two commands of README.md, so the bundle also carries the window's tokens and the version of this release.

## v0.8.3 · the install demo {#v0-8-3}

### src/entry.ts, ../../demo/src · reuse by path
- refers-to: src/entry.ts · vite.config.mjs
- kind: decision
- logged: v0.8.3 · 2026-11-07

Same approach as the author demo: demo 1's shim, model, store, zip, importer and look are imported by path and left alone, the config lives here with `emptyOutDir` false, and `media/` is a byte copy of demo 1's.

### src/seed.ts · own storage key and five installs
- refers-to: src/seed.ts :: mapKey, record, seeded
- kind: decision
- logged: v0.8.3 · 2026-11-07

The store key is rewritten to `formskills-demo-install-1` before the shim loads, with a memory fallback. The first visit installs, from the embedded release text, formportal-harness and formportal-skillset at the earlier release (0.54.3) for Claude Code, formportal-harness for Codex, formvis-driving for Claude Code in a project folder, and formwav-harness for Cursor. FormPortal is the one app with two releases whose skills differ, so the update, the diff and the pin are all real.

### src/inspect.ts, diff.ts, sha.ts · what an update changes
- refers-to: src/inspect.ts :: plan, draw · src/diff.ts :: lineDiff, hunks · src/sha.ts :: sha256
- kind: decision
- logged: v0.8.3 · 2026-11-07

The window lists installs and says "Newer release X" but not what changes. The demo adds a section under the list that reads the same stored state, compares each installed file with the release the app is following (the pin counts, as in the shim), and shows per-file status, line counts and a line diff. Common head and tail lines are trimmed before an LCS, and the view shows hunks with two lines of context, capped at 360 lines. SHA-256 is a small synchronous implementation, since `crypto.subtle` is not guaranteed on `file://`. The section is redrawn by an observer on the window's installed list after the window rewrites it, and the select and file list are keyed so an unchanged state repaints nothing. The page says the digests are computed from embedded text and the signed catalogue is not read.

### src/install.ts · the opening state and the steps
- refers-to: src/install.ts :: run, openInstalled
- kind: decision
- logged: v0.8.3 · 2026-11-07

As in the author demo, `booting` is put back in the window's own task and removed once the Installed pane and the file list are filled, so the first painted frame is the finished state. The five steps click the window's own buttons (Installed, a card, Install all, Trust); the note beside them is static text per step. The Trust step's note states that the demo verifies nothing.

### src/install.css · the bench row, the inspect section
- refers-to: src/install.css
- kind: decision
- logged: v0.8.3 · 2026-11-07

Tokens only, no z-index. The inspect body is a fixed 230 px so the diff view never changes the pane's height; rows of the installed list are tightened for this demo so the diff shows on the first screen.
