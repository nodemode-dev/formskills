# HASHOUT_LOG · demos/author · formskills

Living log for demo 2. Source files stay comment-free; what they would have said lives here.

Current build version: v0.8.3
Last updated: 2026-11-07 · the author demo

## v0.8.3 · the author demo {#v0-8-3}

### src/entry.ts, ../../demo/src · reuse by path
- refers-to: src/entry.ts · vite.config.mjs
- kind: decision
- logged: v0.8.3 · 2026-11-07

The demo imports demo 1's shim, model, store, zip, importer and look by relative path and changes none of them, so the window behaves exactly as in demo 1 and no engine port is duplicated. The config lives in this folder with `root` here and `outDir` `assets` with `emptyOutDir` false, and imports the family plugin from `frontend/`; it exports a plain object because `vite` does not resolve from this folder. `media/` and `formskills.png` are byte copies of demo 1's so the folder opens on its own.

### src/seed.ts · own storage key and the starting state
- refers-to: src/seed.ts :: mapKey, seeded
- kind: decision
- logged: v0.8.3 · 2026-11-07

Demo 1's store reads and writes one `localStorage` key, and `file://` pages share storage. The seed module runs first and rewrites that key to `formskills-demo-author-1` on `Storage.prototype`, with an in-memory fallback when storage throws, so the demos never see each other's state. On a first visit it writes three own skills (release-notes with a sub-skill, a reference and a script; tidy-meeting-notes; commit-message-style) and an edited copy of the released formpdf-harness, built from the embedded release text with two small changes. The draft's name is `release-note` on purpose: Check reports the name against the folder, plus two broken links, so the opening state has something to fix. Own skills get digests of their starting text so only the visitor's edits are marked in the file list.

### src/author.ts · the opening state and the steps
- refers-to: src/author.ts :: openDraft, openCopy, packageIt, advice
- kind: decision
- logged: v0.8.3 · 2026-11-07

The window removes its `booting` class when it has built its nodes. The demo puts the class back in the same task, clicks the real controls (Your skills, the draft, the editor), and removes the class again once the editor is filled and Check has run, so the first painted frame is the finished draft. Waits poll every 40 ms because a textarea's value is not a DOM mutation. The three steps click the window's own buttons; the note beside them is derived from Check's own summary line by an observer and rewritten in place (single line, fixed height). Names are matched by title prefix because a skill's displayed name changes once the visitor fixes it.

### src/author.css · the bench row and link row
- refers-to: src/author.css
- kind: decision
- logged: v0.8.3 · 2026-11-07

One 48 px row between the filter chips and the split, and a quiet three-link list in the footer. Colours, space and radii come from the window's tokens; there is no z-index and no new token.
