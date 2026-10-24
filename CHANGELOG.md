# Changelog

## v0.4.0 · 2026-10-24

- Make your own copy of any skill and edit it: a text editor with a live preview, and the original read-only beside it. Your copy is saved as you type and kept after you close formskills; the original is never changed.
- When a newer release changes the original, the skill and your copy say so and list the changed files; Mark as seen records the new original without touching your text.
- Download your copy as a zip, or discard it (after a second click).
- `./formskills cli edits` and `./formskills cli edit ...` do the same on the command line.

## v0.3.1 · 2026-10-24

- A download that fails part way (a full disk, for example) no longer leaves a broken zip in your Downloads folder.

## v0.3.0 · 2026-10-24

- Open a skill to read it: its SKILL.md as formatted text, with its sub-skills, references and other files listed beside it, and links between them followed.
- Download one skill, or all of an app's skills, as a zip shaped like the release asset; it is saved to your Downloads folder and never replaces a file.
- `./formskills cli read` and `./formskills cli download` do the same on the command line.
- The chip row keeps its scrollbar below the chips, and the mouse wheel scrolls it sideways; on a narrow window the reader takes the whole area.

## v0.2.0 · 2026-10-24

- formskills reads the signed family catalogue (checked against the same keys FormPortal and formMCP trust) and downloads each app's latest released skills, checks each file against the catalogue's digest, and keeps them on this computer until a new release changes them.
- When the catalogue or a download cannot be read, the skills kept from an earlier check are shown with the reason.
- `./formskills dev` reads Form app checkouts beside this one instead, for working on the apps.
- The window shows each app's skill count and where it came from, the chosen app's skills with their descriptions, and a Refresh button; the command line has `skills`, `fetch`, `catalog` and `where`.

## v0.1.0 · 2026-10-24

- First version: the list of the Form apps that ship skills, generated from formcompiler's registry; the command line (`./formskills cli apps`, `app`, `version`); the window with All and one chip per app, a card per app and a detail pane showing where each app's skills come from.
