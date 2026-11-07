# Extensions

formskills 0.9.0 hosts extensions under the Form Extension Contract, API 1. An extension is a small web page with a manifest; FormPortal installs it, form.ext runs it from a folder while you make it, and formskills loads it in a sandbox.

## Using one

- **Extensions** in the header opens the menu: one item per command an extension adds (`Name: Title`), then Extensions Panel, Reload Extensions and Manage in FormPortal.
- **Extensions Panel** shows every extension FormPortal or form.ext listed for formskills: its name, version, source (Catalogue, File or Development), the permissions it asks for, and its state. Ready runs; Needs Permission asks you first; Refused says why (made for another app, a newer API, a newer formskills, a broken manifest). Open shows its panel. A development extension shows its folder.
- **Panels** open in the detail pane, titled with the extension's name, and stay alive while you look at something else; Close ends them. Dialog panels open over the window.
- **Permissions**: the first time a version runs, formskills lists what it asks for (read and change the open document, open files you choose, save files where you choose) and you choose Allow or Not Now. Forget permission on its row makes it ask again.
- **Undo**: when an extension changes your copies or your own skills, the status line names the change with an Undo button. One step is kept.

Released skills are never changed by an extension: it writes only your edited copies and your own skills, as the window does.

## Where they come from

FormPortal's folder (`FORMPORTAL_ROOT`, or the platform's FormPortal data folder) holds `extensions/formskills/enabled.json` (installed) and `extensions/formskills/dev.json` (form.ext's Run in App). formskills reads both at start, every 2 s while its window has focus, and on Reload Extensions; a change updates only the rows that changed.

## For agents

```sh
./formskills cli extensions list
./formskills cli extensions command <id> <command> ['{"key":"value"}']
```

The command runs in the open window with the same consent as the menu.

## For extension authors

The document snapshot, the commands, the events and the testing recipe are in `docs/EXTENSIONS.md` in the repository.
