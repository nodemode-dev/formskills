# Changelog

## v0.2.0 · 2026-10-24

- formskills reads the signed family catalogue (checked against the same keys FormPortal and formMCP trust) and downloads each app's latest released skills, checks each file against the catalogue's digest, and keeps them on this computer until a new release changes them.
- When the catalogue or a download cannot be read, the skills kept from an earlier check are shown with the reason.
- `./formskills dev` reads Form app checkouts beside this one instead, for working on the apps.
- The window shows each app's skill count and where it came from, the chosen app's skills with their descriptions, and a Refresh button; the command line has `skills`, `fetch`, `catalog` and `where`.

## v0.1.0 · 2026-10-24

- First version: the list of the Form apps that ship skills, generated from formcompiler's registry; the command line (`./formskills cli apps`, `app`, `version`); the window with All and one chip per app, a card per app and a detail pane showing where each app's skills come from.
