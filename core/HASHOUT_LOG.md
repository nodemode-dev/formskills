# HASHOUT_LOG · core · formskills

Living log for `formskills-core`, `formskills-cli` and `setup/apps.py`. Source files stay comment-free; what they would have said lives here.

Current build version: v0.13.0
Last updated: 2026-11-20 · v0.13.0 version bump only; v0.12.0 version bump only; 2026-11-19 · the list of apps comes from the family spec, public apps only, and carries no registry version; the generator keeps the copy of the spec; 2026-11-11 · read and edit read fail on a file that is not text; setup/apps.py's bytecode cache is ignored; 2026-11-10 · edit read notes a non-text file; removing a project install whose folder is gone; formskills.bat forwards every argument; backslashes in a new skill's description; FormPortal's macOS folder for the kept catalogue; front matter comments, nested maps and lists, and quotes as YAML reads them; a changed install without SKILL.md or with extra entries needs force; plain multi-line front matter values, quotes off the joined value, formskills.bat cli and apps; 2026-11-02 · the catalogue from the public download store; 2026-10-26 · the test suite; installing into Claude Code, Codex and Cursor; pins, one-app update, your own skills, script counts; search, the format check, licences and topics; registered in formcompiler; personal edited copies; no partial download; reading one file and packing downloads; released skills fetched, checked and kept, and the dev mode; the generated list of apps that ship skills

## v0.11.0 · family update {#v0-11-0}

### setup/apps.py, apps.rs, main.ts · the list comes from the family spec
- refers-to: setup/apps.py :: TOPICS, FALLBACK_TOPIC, topic_of, load_family, build, main · core/src/apps.rs :: Source, Apps::describe_source · frontend/src/main.ts (the footer line) · core/data/apps.json
- kind: change
- logged: v0.11.0 · 2026-11-19

`--compiler PATH` is gone; `--family PATH` takes formadaptor's `family.json` (format `formai-family`, version 1). Without `--check` it writes `core/data/apps.json`; with it nothing is written, the exit code is 0 when the file equals what would be written and 1 when it does not, and the output names `core/data/apps.json`. A spec that cannot be read or is not that format exits 2, so a bad input is never mistaken for drift. It needs no network and no git, uses the standard library only and runs as `python3 -I`. Only entries with `public: true` are read and the old rule stays: an app is listed only when `agents.skills` names a folder. `released` is now whether the spec carries a release for the app (the spec holds enabled entries only, so the old `enabled` value would be true for every row); the window's "not released yet" in the detail pane is the only user. The source block is `{repository, version}` with the registry version of the spec; the commit is dropped because formcompiler's HEAD made `--check` fail on every registry commit, and `Source.commit` with its two uses (the `apps` command's source line and the window's footer) went with it. Old files with a commit still load, since serde ignores the extra key.

Every kind has a topic. `TOPICS` gained `extensions` and `utility` under Family; a kind in no row is listed under `FALLBACK_TOPIC` (Family, the group for anything that is not a creative area) and a line on stderr names the kind, so a new kind in the spec can no longer stop the generator or the nightly proposal. Checked with a spec whose FormTxt has kind `hologram`: the line was printed and the exit code was 1 for drift, not a failure.

Regenerated from the 0.16.0 sample spec, with the three entries the spec marks non-public held back so the change that removes them is its own commit: added FormCel, FormTxt, FormTools and form.ext (their registry entries now name a skills folder); FormDeck's catalogue name is FormDeck, no longer FormSlide (id `formslide` unchanged); source is registry 0.16.0 without a commit. Run only through setup/apps.py. Tests (added after the list and the loader were run: `formskills-cli apps` under a fresh HOME printed "bundled list from nodemode-dev/formcompiler 0.16.0" and 23 apps): `core/tests/bundled_apps.rs` checks the source has a version and no commit, ids are unique, every app has a skills folder and a topic from the topic list.

### apps.json, setup/family.spec.json · three non-public apps are no longer listed
- refers-to: core/data/apps.json · setup/family.spec.json
- kind: change
- logged: v0.11.0 · 2026-11-19

The spec marks FormPromo, FormSculpt and FormSurface `public: false` (it carries only their id), so the list stops naming them: their names, summaries and repositories were in a public file. Nothing else in the list changed in this commit. `demo/`, `demos/` and the media icons still carry these three apps from before; they are built assets and were not touched. `setup/family.spec.json` is a byte copy (made with `cp`, sha256 3c1781c6...82ce3, content_sha256 2553862c... checked) of the 0.16.0 sample spec the list is now generated from. It is input, never edited by hand: `setup/apps.py` replaces it itself when a given spec changes the list (see "the generator keeps the spec copy" below). The generator reads neither `generated` nor `content_sha256` from it.


### ci.yml · the list is checked against the committed spec
- refers-to: .github/workflows/ci.yml (scripts job) · setup/family.spec.json
- kind: change
- logged: v0.11.0 · 2026-11-19

The `scripts` job runs `python3 -I setup/apps.py --family setup/family.spec.json --check` beside the compile check, with no network and no new action (the job's only actions stay as pinned in the file). Run here against the committed copy: exit 0, "apps: in step"; with one value of apps.json changed: exit 1, "apps: drifted: core/data/apps.json". The gap this step had (the copy not moving with the list on formadaptor's pull request) is closed by the generator keeping the copy; formadaptor's `targets.json` entry for formskills must list `setup/family.spec.json` among its `files` for that pull request to be accepted.

### README.md, demo/README.md · stated counts
- refers-to: README.md ("Everything in the box", "Tested") · demo/README.md ("What it shows")
- kind: fix
- logged: v0.11.0 · 2026-11-19

README said "19 Form apps", which was the stale list (the registry had 24 apps with skills when the survey was made; today's list is 20 public ones). The box now says "Every public Form app" and no number, so the next spec cannot make it wrong; the demo README no longer says "of the 19 apps" either. "31 Rust tests" is now 34, counted with `git grep -c '#\[test\]' -- core cli` (8 + 5 + 2 + 1 + 2 + 4 + 3 + 9 across eight test files, the two new ones in `core/tests/bundled_apps.rs`) and confirmed by `cargo test` (34 passed). "Three agents" was checked against `agent_dir` in `core/src/install.rs` (claude, codex, cursor). The demo README's "21 real skills" was left out: the built demo cannot be re-counted without the sibling checkouts it was built from. No skills, CLAUDE.md or AGENTS.md line states a count. Not changed: the screenshot alt text in README that says "four released skills", which describes the image, and the "18 kinds for 18 apps" line in this log's history.

### setup/apps.py · the generator keeps the copy of the spec
- refers-to: setup/apps.py :: main, KEPT · setup/family.spec.json · core/tests/bundled_apps.rs :: the_committed_list_is_in_step_with_the_committed_spec_copy, the_generator_keeps_the_spec_copy_only_when_the_list_changes · README.md, CLAUDE.md, CONTRIBUTING.md, .docs/wiki/Getting-Started.md
- kind: change
- logged: v0.11.0 · 2026-11-18

A family decision: the generator, not a person, keeps the copy. `setup/apps.py --family PATH` writes `core/data/apps.json` and, only when that output differs from what is committed, copies the given spec byte for byte to `setup/family.spec.json`; when the output is unchanged it leaves the copy alone. `--check` is unchanged and writes nothing, so CI still checks the list against the committed copy with no network. If the spec given is the kept copy itself (the path resolves to it) nothing is copied. A newer spec that gives the same list therefore never moves the copy, which is why the copy can lag the registry on `generated`, `content_sha256` and any field the list does not use (the entry's `site`, `repo`, `launcher`, `manifest` and everything in `release` but its presence); it is the spec the committed list was built from, not the latest spec. The success lines now name `core/data/apps.json` and `setup/family.spec.json` the same way on every system (the first used the path's own separators). Edge, left as it is: if the copy is missing and the list is unchanged, nothing is written; CI would then fail on the missing file until a spec that changes the list is given.

Run in a clone of this branch under /tmp, outside the tree, with `git status --porcelain` after each: a spec that changes one summary of a listed app wrote both files (`M core/data/apps.json`, `M setup/family.spec.json`, the copy equal to the spec); a spec that differs only in `generated`, every entry's `launcher` and every release's `published` printed "core/data/apps.json unchanged" and git status was empty (the copy stayed); the same spec again after that was empty too; `--check` against the kept copy exited 0; `--check` with a spec that would change the list exited 1 and git status was empty; giving the kept copy as the spec after a hand edit of apps.json rewrote only apps.json (restored the committed one) and printed that the copy is the spec given. Tests, written after those runs: `core/tests/bundled_apps.rs` now checks `--check` against the real copy exits 0, and builds a tree under the temp folder with the three files to run the cases (unused fields, `--check` writing nothing, a change keeping its spec, the same spec again, a newer spec with the same list). They need `python3`; a machine without it skips them. 36 tests pass (`cargo test -p formskills-core -p formskills-cli`), README says 36. formadaptor's `propose.py` (working tree) runs `--check`, then the writer, and requires the copy to equal the spec it passed; this generator satisfies that, and formadaptor's `targets.json` entry for formskills lists only `core/data/apps.json` today, so it needs `setup/family.spec.json` in `files` (and as `spec_copy`).

### apps.rs, main.ts · the list's source is read as a repository only
- refers-to: core/src/apps.rs :: Source, Apps::describe_source · frontend/src/main.ts (the footer line) · core/tests/bundled_apps.rs :: the_bundled_list_names_its_repository_and_no_commit
- kind: change
- logged: v0.11.0 · 2026-11-19

First half of taking the registry version out of the list (the generator and the regenerated file are the next entry). `Source` is `{repository}`; `version` is gone, with its two readers: `describe_source` (the `apps` command's `source` line) now always says "bundled list from nodemode-dev/formcompiler", and the window's footer says "List from nodemode-dev/formcompiler". The version is dropped from both, not read from `setup/family.spec.json` at build time: the kept copy only moves when the list changes, so its registry version lags the registry by design and would read as a stale number to a person, and it tells them nothing the list itself does not. What built the list is still on record, in the kept copy. This lands before the generator change so every commit builds: serde ignores a field the struct does not name, so the committed file, which still carries `version` at this commit, loads. This supersedes "The source block is `{repository, version}`" in the first entry of this section.

Run: `formskills-cli apps` under a fresh HOME against the committed list printed `"source": "bundled list from nodemode-dev/formcompiler"` and 20 apps. The test that asserted a non-empty version now asserts the exact source line (changed because the field it read no longer exists). The window was not opened and `tsc` was not run (no `node_modules` here); the frontend change removes one read of a JSON field and adds none.

### setup/apps.py, apps.json · the list carries no registry version
- refers-to: setup/apps.py :: build · core/data/apps.json · core/tests/bundled_apps.rs :: the_bundled_list_names_its_repository_and_no_commit, the_generator_keeps_the_spec_copy_only_when_the_list_changes · CLAUDE.md, .docs/wiki/Architecture.md, .docs/wiki/Getting-Started.md
- kind: fix
- logged: v0.11.0 · 2026-11-19

The fault: `build` put the spec's `source.registry_version` into the output as `source.version`. The registry version moves with every release of the compiler repository, also when nothing the installer shows moves (0.16.0 to 0.16.1 registered one private app). So `--check` against a newer spec said "drifted", and the family's automation would have proposed a change here, and a formskills release, on every compiler release. Seen first: in a clone of the branch before this change, `--check` against a 0.16.1 spec with the same public apps exited 1.

The rule now: the generated list changes only when something the installer uses changes. `source` is exactly `{"repository": "nodemode-dev/formcompiler"}` (the spec's `source.repository`, with that default); `format_version` stays 2, since the only readers are this repository's engine and window, built from the same commit as the file. What built the list is on record in the kept copy, `setup/family.spec.json`, whose `source.registry_version` is the version of the spec that last changed the list. `load_family` still requires `source.registry_version`, so a file kept as the copy always says which registry it came from.

Regenerated only through `setup/apps.py --family setup/family.spec.json`: the one difference is the `version` line gone; the kept copy was the spec given and stayed as it is.

Run in a copy of the tree under /tmp: `--check` against the kept copy exited 0; against the 0.16.1 sample (one more private id, same public apps) `--check` exited 0 and write mode printed "unchanged", with the digests of the list and the kept copy the same before and after; a spec that differs from the kept copy only in the registry version checked in step; against the sample with FormCut's name changed `--check` exited 1 and wrote nothing, and write mode changed the list (the name line) and made the kept copy byte-equal to that spec (registry 0.16.1). Tests, changed after those runs: the first test asserts the exact `source` value; the temp-tree test gained the case of a later registry version with one more private app (`--check` exits 0 "in step", write mode changes neither file). 36 tests pass, the same count.

## v0.10.4 · QA fixes {#v0-10-4}

### cli/src/main.rs · reading a file that is not text exits non-zero
- refers-to: cli/src/main.rs :: main (edit read yours, edit read, read)
- kind: fix
- logged: v0.10.4 · 2026-11-11

Since 0.10.3 `edit read yours <skill> <file>` printed the reason a file is not shown ("not text" or "too large") on stderr, but exited 0, so a script could not tell it from an empty file. The same was true of `edit read <app> <skill> <file>` and `read <app> <path>`. All three now return the reason as the command's error: it is printed as `formskills: <path>: <reason>` and the exit code is 1. Text files print as before. Tested in `cli/tests/resilience.rs :: reading_a_file_that_is_not_text_fails`, which fails on 0.10.3 at each of the three commands.

### .gitignore · __pycache__
- refers-to: .gitignore
- kind: fix
- logged: v0.10.4 · 2026-11-11

CI's `python3 -m py_compile setup/apps.py` leaves `setup/__pycache__/` beside the script, which showed as untracked after a local CI run. Every `__pycache__/` is ignored.

## v0.10.3 · review fixes {#v0-10-3}

### install.rs · a changed install is never removed or replaced without force
- refers-to: core/src/install.rs :: extras_of, state_of, install, uninstall
- kind: fix
- logged: v0.10.3 · 2026-11-10

`state_of` called an install "missing" whenever its SKILL.md was gone, so a folder whose SKILL.md was deleted or moved but which still held the person's files was removed by `uninstall` (and the window's Remove) without force, and "Install again" moved it aside and deleted it. The change check also compared only what the skill walker lists, so a `.git`, `node_modules` or a link made in the folder read "ok" and went with it. An install is now "missing" only when nothing is at its path; otherwise the digests are compared (a gone SKILL.md shows as changed), and `extras_of` walks the folder raw and adds every entry that the record does not hold and is not a folder of recorded files (directories such as `.git` are named once, links are never followed). `__pycache__`, `.pyc`, `.DS_Store` and `Thumbs.db` are left out, as the walker leaves them out, so running a skill's Python or opening it in Finder does not lock the install. Both cases now read "modified", which `install` and `uninstall` already refuse without force. Checked with formskills-cli in a temporary HOME: SKILL.md removed plus notes.txt refused without --force (notes.txt kept); `.git` and a link refused for uninstall and install; a `__pycache__` alone still "ok" and removed.

### skills.rs · front_matter leaves comments and nested collections out of a plain value and reads quotes as YAML does
- refers-to: core/src/skills.rs :: scalar, front_matter
- kind: fix
- logged: v0.10.3 · 2026-11-10

Since 0.10.2 a plain value kept its key open and every later line that was not a key was glued on, so `name: my-skill` then `# a note` gave the name `my-skill # a note` (Check then reported name errors on a valid card), and `metadata:` or `allowed-tools:` followed by an indented map or list became one string. Quotes were also cut with `trim_matches`, which stripped unpaired and repeated quotes (`Explains the "why"` lost its closing quote), kept `\"` and `''` and kept a trailing `# comment`. A continuation line now joins a plain value only when it is indented and is not a comment, and a key with no value whose next line is a `- ` item or a `key:` pair is a nested collection, so its key is closed and stays empty. `scalar` reads the joined value: a matching double-quoted pair is dropped and `\"` and `\\` unescaped, a matching single-quoted pair is dropped and `''` becomes `'`, and a plain value is cut at its first ` #`. It is not a YAML parser: other escapes and flow collections stay as written, and `>` and `|` blocks are unchanged. Checked with a scratch crate outside the repo on the reviewers' cases (comment after a name, nested metadata and allowed-tools, the four quote cases, a quoted name with a comment, quoted and plain two-line values, a folded block, a value starting on the next line, a non-ASCII value starting with a quote) and the existing tests.

### places.rs · FormPortal's kept catalogue on macOS is read from studio.formai.portal
- refers-to: core/src/places.rs :: portal_root · core/src/catalog.rs :: read_source
- kind: fix
- logged: v0.10.3 · 2026-11-10

FormPortal's data folder on macOS is `studio.formai.portal` (its tauri.conf.json identifier; its `moved_root` moves the old `dev.formai.portal` there), but `places::portal_root` still named the old folder, so with the catalogue address unreachable or `FORMSKILLS_OFFLINE=1` a fresh FormPortal's signed copy was not found and no release could be shown, while `extensions::portal_root` already read the new folder. The macOS branch now follows the same rule as `extensions::portal_root`: `studio.formai.portal`, or `dev.formai.portal` only when that is a folder and the new one does not exist. Windows and Linux are unchanged. `cfg!` is a runtime test, so the branch is compiled on Linux; it was not run on macOS.

### own.rs · a new skill's description is valid YAML with backslashes in it
- refers-to: core/src/own.rs :: one_line, template
- kind: fix
- logged: v0.10.3 · 2026-11-10

`template` writes the description as a double-quoted YAML scalar, and `one_line` only swapped `"` for `'`, so `new paths Fixes C:\docs and \Users paths` wrote `\d` and `\U`, which are not valid YAML escapes: the agents' YAML readers refused the card while formskills' own Check passed it. `one_line` now doubles every backslash before the quote swap, and `skills::scalar` turns `\\` back into one, so formskills and the agents read the same text. Checked with formskills-cli `new` in a temporary data folder: SKILL.md holds `"Fixes C:\\docs and \\Users paths"`, PyYAML reads `Fixes C:\docs and \Users paths`, and `own` lists the same text.

### formskills.bat · cli and apps forward every argument
- refers-to: formskills.bat :: cli, apps, collect, more, run
- kind: fix
- logged: v0.10.3 · 2026-11-10

`%*` ignores `shift`, so the 0.10.2 labels forwarded a fixed `%1` to `%9`, and `formskills.bat cli new tidy-notes` with a long description, or a long `cli search`, silently lost every word past the ninth. Each label now sets `RUN` to its program and jumps to one shared loop that appends `%1` to `ARGS` and shifts until `%~1` is empty, then runs `%RUN%%ARGS%` and returns its errorlevel. The loop lines sit outside any parenthesised block, so each `%1` and `%errorlevel%` is expanded after the line before it ran; `set ARGS=%ARGS% %1` is unquoted so a quoted argument holding `&` stays inside its quotes. Limits: an empty quoted argument (`""`) ends the list, and cmd itself splits unquoted `=`, `,` and `;` (as it did for `%1` to `%9`). CRLF line endings kept (checked with `git ls-files --eol`). Not run on Windows (traced against cmd's parsing rules).

### install.rs, cli/src/main.rs · a project install can be removed after its folder is gone
- refers-to: core/src/install.rs :: Target::recorded, Target::new · cli/src/main.rs :: uninstall · src-tauri/src/lib.rs :: install_remove
- kind: fix
- logged: v0.10.3 · 2026-11-10

`Target::new` canonicalizes a project path, which fails once the folder is deleted or moved, so the record in `installed.json` could never be removed and Installed kept a "No longer in the folder" row for good. `Target::recorded` tries `Target::new` first and, when that fails, accepts the project string exactly as given if a record holds that agent and project (records store the canonical path, which is what the window passes back). Only removal uses it (`uninstall` in the command line, `install_remove` in the shell); update and install keep `Target::new`, so they never recreate a project folder the person deleted, and a path no record holds still fails as before. Checked with formskills-cli in a temporary HOME: install into a project, delete the project, `installed` shows missing, `update` fails without creating the folder, `uninstall --project <path>` removes the record, and an unrecorded missing path still fails.

### cli/src/main.rs · edit read says when a file is not text
- refers-to: cli/src/main.rs :: edit read (yours and copies) · frontend/vite.engine.ts :: text
- kind: fix
- logged: v0.10.3 · 2026-11-10

Both `edit read` branches printed the text when there was some and nothing at all otherwise, so a binary file in a copy (an image in `assets/`) gave empty output and exit 0. The browser build's bridge took that as an empty text file, the editor opened on an empty buffer, and the first keystroke's autosave wrote text over the binary file. Both branches now print `formskills: <path>: <note>` on stderr when the file is not text, as `read` does; the bridge's `text()` already turns that into `text: null` with the note, and the window then disables the editor. Exit code stays 0, as for `read`. Checked with formskills-cli: `edit read yours <skill> assets/a.png` on an 8-byte binary printed the note on stderr, and SKILL.md still printed its text.

## v0.10.2 · plain multi-line front matter values {#v0-10-2}

### skills.rs · front_matter joins continuation lines of every key
- refers-to: core/src/skills.rs :: front_matter
- kind: bugfix
- logged: v0.10.2 · 2026-11-10

Continuation lines were only joined while the key had used a `>` or `|` indicator, so a plain multi-line value (`description: first line` then an indented `second line`) was cut to its first line. The reader's `splitFrontMatter` in `frontend/src/markdown.ts` already joined them, so the card, the Check report (description length, XML tags) and the reader disagreed. A plain value now keeps its key as the open one, so indented lines that follow append with a space; a following top-level key still starts a new value, and the `>` and `|` behaviour is unchanged.

### skills.rs · quotes come off the joined plain value
- refers-to: core/src/skills.rs :: front_matter
- kind: bugfix
- logged: v0.10.2 · 2026-11-10

Quotes were trimmed from the first line before continuation lines were joined, so `description: "first` then `  second"` gave `first second"`. A plain value now keeps its raw text as it accumulates and the stored value is that raw text with the surrounding quotes trimmed after each join, giving `first second`. Folded and literal blocks (`>` and `|`) keep their content untouched. Note: `splitFrontMatter` in `frontend/src/markdown.ts` strips quotes from the first line only, so for a quoted two-line value it still shows `first second"`; the engine is now the one that is right, and the reader is left for a later frontend change.

### formskills.bat · cli and apps run outside any parenthesised block
- refers-to: formskills.bat :: cli, apps
- kind: bugfix
- logged: v0.10.2 · 2026-11-10

cmd expands `%1` to `%9` and `%errorlevel%` when it parses a whole parenthesised block, before the `shift` inside the block runs. In the old `cli` and `apps` blocks `formskills.bat cli list` therefore passed `cli list` to the command line, and `exit /b %errorlevel%` returned the errorlevel from before the block ran. Those two `if` lines now `goto cli` and `goto apps`, and the bodies sit below the main flow as labels, whose lines are parsed one at a time after `shift`. The main flow ends with `exit /b %errorlevel%` so it cannot fall into the labels. The `dev` block keeps its `shift`: the next `if` line is parsed after the block ends. Found by reading the file against cmd's parsing rules; not run on Windows (traced).

## v0.9.0 · the extension host's resolver, the request queue and the command line {#v0-9-0}

### extensions.rs · a line-for-line port of formext_host.py
- refers-to: core/src/extensions.rs :: portal_root, version_tuple, Extension, Extension::public, check, resolve, stamp, csp_for, file_for, headers_for, TYPES, PERMISSIONS, id_re, local_re, version_re · core/src/lib.rs
- kind: decision
- logged: v0.9.0 · 2026-11-07

The Form Extension Contract (API 1) kit's `host/python/formext_host.py`, ported function for function with its refusal messages word for word, so FormPortal, form.ext and every app say the same thing about the same manifest. Python's loose readings are kept on purpose: `str()` of a missing value is `None`, `!r` quotes with single quotes, `format_version: true` passes because `True == 1`, `or` treats an empty value as missing, and a refused row keeps the name read before the refusal. Python's regular expressions are hand matchers (no regex crate): the same character classes and lengths; Python's `$` would also take a trailing newline, which no real id holds. `portal_root` is the contract's (macOS prefers `studio.formai.portal`), not `places::portal_root`, which FormPortal's kept catalogue copy still uses. `file_for` refuses the extension folder itself being a symlink, as the Python does (it checks every ancestor that resolves to the root). It follows the kit as revised during the round: a development row takes its manifest's x.y.z version before the id and product checks (so a refused one shows its real version), a non-text `entry.ui` (null included) is refused as "not a path inside the package", and a non-object `entry` or `contributes` counts as empty. Checked against the Python on 34 manifests and 13 file paths (`/home/claude/ext/work/host-formskills/parity.py` in the round's scratch): identical lists and identical 200/404 answers. The app version is `CORE_VERSION`, so an extension with `minimum_app` 0.9.0 is refused until the round's bump.

### extensions.rs · request queue, save
- refers-to: core/src/extensions.rs :: requests_dir, ask, take, answer, save_download, save_name, SAVE_LIMIT
- kind: decision
- logged: v0.9.0 · 2026-11-07

formskills has no MCP server and no route into its window, and an extension only runs as a page in the window. So `extensions command` writes `extension-requests/<ms>-<pid>.json` under the data folder; the window takes it (rename to `.taken`) on its 2 s tick, runs the command with the same consent as its menu, and writes `.answer` (written as `.part` and renamed). The asker gives up after 10 s untaken ("the formskills window is not open") or 130 s unanswered, just over the contract's 120 s headless limit, and removes its own files. `save_download` is how `files.save` lands: Downloads (or `FORMSKILLS_DOWNLOADS`), a plain file name only, "name (2).ext" when taken, written through `durable::replace_file`, at most 200 MB.

### cli/src/main.rs · extensions
- refers-to: cli/src/main.rs :: run_extensions, read_input, HELP
- kind: decision
- logged: v0.9.0 · 2026-11-07

`extensions list` (the default) prints the listing with `stamp`, the root and each extension's public record; `--base` sets the files prefix (default `/api/extensions/files`, the own-origin shape). `extensions command <id> <command> [args-json]` checks the id, state and command first, then asks the window. `stamp`, `file`, `requests` and `answer` are for the browser build's Vite bridge (`frontend/vite.engine.ts`); `file` prints the resolved path, type and headers or fails with "not found" and nothing else. It runs before `Apps::bundled` because it needs no app list.

## v0.7.4 · the catalogue from the public download store {#v0-7-4}

### catalog.rs, setup/apps.py · dl.formai.studio
- refers-to: core/src/catalog.rs :: DEFAULT_CATALOG · setup/apps.py :: TOPICS, build, main · core/data/apps.json · core/tests/catalog_default.rs
- kind: decision
- logged: v0.7.4 · 2026-11-02

`DEFAULT_CATALOG` was the `catalog` release on formcompiler's own GitHub page, a private repository that never serves the public. formcompiler's feed now copies the signed catalogue to its download store (formcompiler `docs/GO_PUBLIC.md` section 4), so the default is `https://dl.formai.studio/catalog/apps.json`, the address FormPortal reads. The signature is still `<url>.sig` (`catalog/apps.json.sig` in the store), and the skills archives the catalogue names already carry the store's addresses once formcompiler publishes there. `FORMSKILLS_CATALOG`, loopback http, files, `FORMSKILLS_OFFLINE` and FormPortal's kept copy are unchanged. The repositories moved to the `nodemode-dev` organisation: the generator's `source.repository` and the docs say so, and `apps.json` was regenerated from formcompiler 0.6.1 (f0e3201): the new repository addresses, FormPromo (19 apps), the registry's current licences and `released` flags. FormPromo's kind `promo` had no topic, which stopped the generator; it joins Media. `catalog_default.rs` pins the default and its signature address.

### catalog_keys.txt · the production catalogue key
- refers-to: core/catalog_keys.txt · core/src/catalog.rs :: keys, verify · core/tests/catalog_keys.rs
- kind: decision
- logged: v0.7.4 · 2026-11-02

formcompiler's production catalogue key pair now exists (`scripts/catalog.py keygen`; the private seed is the formcompiler secret `FORMCOMPILER_CATALOG_KEY`). Its public half, `P3Cgp37EmB2jOBtTWRNFtO8xMq8hsb+Ii3U5+UrYNtY=`, is the one key line in `catalog_keys.txt`, the same line as FormPortal's and the other family readers', so a catalogue signed by formcompiler verifies and is used; before, every catalogue was refused with "this build trusts no catalogue key yet". `FORMAI_CATALOG_PUBKEY` still adds keys at run time. `catalog_keys.rs` checks that `keys()` holds it and that it is a valid Ed25519 point, and, with a test key from a fixed seed, that the compiled-in list plus that key verifies a signed body, that the production key alone refuses the test key's signature, and that a changed byte is refused. No production signature is in the tree, and the private half is never used.

## Unreleased · resilience {#unreleased}

### install.rs, pins.rs · an unreadable record is never overwritten
- refers-to: core/src/install.rs :: load, install, uninstall, update, list · core/src/pins.rs :: read, load, set · cli/tests/resilience.rs
- kind: fix
- logged: unreleased · 2026-10-28

`installed.json` and `pins.json` were read with any failure taken as empty, so one truncated or hand-broken file made the next install or pin write a list holding only that entry: every earlier install lost its record, and formskills then refused to update or remove those folders as someone else's. A file that exists but does not parse now stops install, uninstall, update and pin with the path and the reason; a missing file is still empty. Listing still shows what it can.

### durable.rs · written to disk before the rename
- refers-to: core/src/durable.rs :: replace_file · core/src/edits.rs :: write_atomic · core/src/install.rs :: save · core/src/pins.rs :: set · core/src/pack.rs :: zip_skills · core/tests/durable.rs
- kind: fix
- logged: unreleased · 2026-10-28

Every write beside and rename (a personal edit, `installed.json`, `pins.json`, a download) wrote the part with `fs::write` and renamed it at once. The rename can reach the disk before the data, so a power cut or crash right after a save could leave the person's edited file, or the install records, empty. `replace_file` now syncs the part before renaming it and removes the part on any failure; the old file stays whole until the new one is.

### durable.rs, fetch.rs, install.rs · the old folder moves aside, not away
- refers-to: core/src/durable.rs :: replace_dir · core/src/fetch.rs :: ensure · core/src/install.rs :: install · core/tests/durable.rs · cli/tests/resilience.rs
- kind: fix
- logged: unreleased · 2026-10-28

Fetching a kept release again and installing over an earlier install both deleted the old folder and then renamed the new one in. If the rename failed (a file held open on Windows, a crash between the two), the kept release that offline use falls back on, or the agent's installed skill, was gone with nothing in its place. `replace_dir` renames the old folder to a hidden `.<name>.old-<pid>` (`.formskills-old-<pid>` in an agent folder) beside it, renames the new one in, puts the old one back if that fails, and deletes it only after. `ensure` also removes its part folder when writing `asset.json` or the rename fails; it used to leave it.

## v0.7.3 · the test suite {#v0-7-3}

### cli/tests · released skills through the command line
- refers-to: cli/tests/support/mod.rs, cli/tests/released_skills.rs :: Sandbox, Server, write_catalogue, asset, product, older, zip_of, zip_with_link
- kind: decision
- logged: v0.7.3 · 2026-10-26

FAMILY_TEST_PLAN v0.3.0 P1. Each test runs the built `formskills-cli` with a cleared environment: HOME, FORMSKILLS_HOME, FORMSKILLS_DOWNLOADS and FORMPORTAL_ROOT point into a fresh temporary folder, so nothing reads or writes the person's data. The catalogue is a file (`FORMSKILLS_CATALOG`) signed by a key made from a fixed seed and trusted through `FORMAI_CATALOG_PUBKEY`; skill sets are served by a loopback HTTP server inside the test, which `catalog::allowed_url` accepts, and the server counts requests so a test can say a set was not fetched again. Covered: only apps the signed catalogue releases list skills; a checkout is read only with FORMSKILLS_DEV; unsigned and wrongly signed catalogues list nothing; a set whose SHA-256 differs is refused and nothing is kept; a matching set is kept once and `download` gives back the released files; entries that leave the folder or are links are refused; a pin takes only releases the catalogue lists; offline uses FormPortal's kept copy under the same signature check.

### core/tests · the format check and reading
- refers-to: core/tests/skill_format.rs :: check::validate, skills::index, library::read_text
- kind: decision
- logged: v0.7.3 · 2026-10-26

The gates `check.rs` enforces, each at its limit and one past it: name 64 characters, description 1024, XML tags in either, the reserved words, lowercase letters, digits and single hyphens, the name matching its folder, a missing card, front matter, name or description. Links from SKILL.md to sub-skills and references resolve, and a broken or escaping link is named. The index sorts files into skill, sub-skill and reference, counts scripts and skips caches. `read_text` refuses `..`, absolute paths and a link out of the folder. The plan also names emoji, em dash and file and size ceilings as upload gates; `check.rs` has none of them, so they are not tested and wait on the owner.

### core/tests/family_contract.rs · F4 and F9
- refers-to: core/tests/family_contract.rs :: VERSION_SITES, STRIP_EXEMPT
- kind: decision
- logged: v0.7.3 · 2026-10-26

The family template: the five version sites agree with the crate and keep a one-digit patch, and no Cargo.toml release profile strips.

## v0.7.0 · installing into agents {#v0-7-0}

### install.rs · where each agent reads skills
- refers-to: core/src/install.rs :: AGENTS, agent_label, agent_dir, Target::new, Target::root, Target::describe
- kind: decision
- logged: v0.7.0 · 2026-10-25

The folders come from each agent's own docs, read 2026-10-25: Claude Code `~/.claude/skills` and `.claude/skills`, Codex `~/.agents/skills` and `.agents/skills`, Cursor `~/.cursor/skills` and `.cursor/skills` (Cursor also reads the Claude Code and Codex folders, which the window says). A project path must be a folder and is canonicalised; the home folder itself is treated as the user scope so one folder never has two records. Whether a running agent then loads the skill was not tried (it needs a signed-in agent); recheck the docs before changing these.

### install.rs · only folders formskills made, and changes kept
- refers-to: core/src/install.rs :: Record, Origin, State, install, uninstall, update, list, install_many, Outcome · data_dir/installed.json
- kind: decision
- logged: v0.7.0 · 2026-10-25

Every install is recorded with its target, folder, origin (release and version, edited copy, own skill or checkout) and a SHA-256 per file. A folder of that name with no record is someone else's and is refused, as is a symlink. A recorded folder whose files differ is "modified": installing again or removing it needs force, and the error says so (the window keys its Install anyway button on "with force"). Each install copies into `.<folder>.formskills-part-<pid>` beside the target and renames it into place, replacing the old folder only after the copy is whole. `list` compares records with the disk and the library and names a newer release; `update` installs the current source again under the same rules. `install_many` returns one Outcome per skill and agent instead of stopping at the first refusal, so an app's set installs everywhere it can and reports the rest; the CLI fails only when every one was refused.

Checked in a scratch home with the signed loopback catalogue: user and project installs for all three agents, a foreign folder and a symlink refused, a modified install refused then forced, install from pinned 1.97.1 then update to 1.97.2 after unpinning, copy and own-skill installs, uninstall plain and forced.

## v0.6.0 · pins, one-app update, your own skills, script counts {#v0-6-0}

### catalog.rs, library.rs, pins.rs · an earlier release, checked the same way
- refers-to: core/src/catalog.rs :: Older, Released.history, Earlier · core/src/library.rs :: from_release, load, Source::Release.pinned, Source::Release.latest, AppSkills.releases, AppSkills.pin · core/src/pins.rs :: load, set, path
- kind: decision
- logged: v0.6.0 · 2026-10-25

formcompiler's `catalog.py` gives the stable release a `history` of the next five stable releases, each built by the same `release_entry`, so each carries its own `agents.skills` asset with digest. formskills reads only that list: a pin can name only a release the signed catalogue lists with skills (the CLI and the shell refuse anything else), and the pinned asset goes through `fetch::ensure` like the latest, so the signature, digest and unpacking checks are the same. `ensure` still keeps one version per app, so switching pins downloads again; that keeps the cache small and the code unchanged. When the catalogue drops a pinned release, the library says so and uses the kept copy rather than silently following the latest. Pins live in `pins.json` beside `released/`, written beside and renamed.

Checked against a signed catalogue on loopback (formcompiler's `catalog.sign` with the v0.2.0 test key) with formvis 1.97.2 and 1.97.1 (the older asset given an extra file to tell them apart) and a 1.96.0 without skills: pin 1.97.1 (downloaded, the extra file present, source pinned with 1.97.2 as latest), pin 1.96.0 and 9.9.9 refused with the releases listed, `fetch formvis` re-downloads that app only, unpin returns to 1.97.2, a pin to an unlisted 1.95.0 keeps the kept copy with the reason.

### own.rs, edits.rs · your own skills are copies without an original
- refers-to: core/src/own.rs :: create, list, template, name_problem, OWN, BASE · core/src/edits.rs :: adopt, copy_dir, download
- kind: decision
- logged: v0.6.0 · 2026-10-25

A skill of your own is a folder in `edits/yours/` with the same record as an edited copy (base "your own skill", no digests, no original), so read, write, check, download and discard need no new code; `download` names it `<name>.zip` instead of `-edited`. `yours` is not an app id in the family, so it cannot clash. The template writes the front matter (the description quoted, on one line) and the sections the format suggests; it passes the check as made. Names are refused unless they meet the format's rules (the same ones `check.rs` reports), so a skill can always be installed later under its folder name. Made in a hidden part folder and renamed.

### skills.rs · scripts
- refers-to: core/src/skills.rs :: Skill.scripts, is_script, SCRIPT_ENDINGS
- kind: decision
- logged: v0.6.0 · 2026-10-25

A count of the files a skill carries that an agent could run (by ending: Python, shell, JavaScript and TypeScript, PowerShell, batch, Ruby, Perl), shown on cards as a trust signal. It looks at names only; it does not read or judge the code.

## v0.5.0 · search, the format check, licences and topics {#v0-5-0}

### check.rs · the Agent Skills format plus Claude's rules
- refers-to: core/src/check.rs :: validate, name_findings, link_targets, resolve, has_tag, block_closed, Report, Finding, Field, Summary, SPEC · core/src/skills.rs :: Skill.license, Skill.check, walk_files · core/src/edits.rs :: validate
- kind: decision
- logged: v0.5.0 · 2026-10-25

The rules come from the Agent Skills specification (agentskills.io/specification, read 2026-10-25) and Claude's Agent Skills overview (platform.claude.com, the same day): name 1 to 64 characters of lowercase letters, digits and hyphens, no hyphen at either end or two in a row, equal to the folder; Claude adds no XML tags and no "anthropic" or "claude" (checked without regard to case); description 1 to 1024 characters with no XML tags; compatibility 1 to 500 when set; SKILL.md under 500 lines (a note, not an error). Links are notes only, because a broken link does not stop an agent from loading the skill; they are read outside fenced code and outside inline code spans (formdeck's skills show `![alt](a1)` as script syntax, which the first run reported as six broken links). Unknown front matter keys are not reported: Claude Code and other agents add their own. The index runs the check for every skill so each card can carry a summary; it reads only files already listed and costs little against the 36 skills.

Found in the family: formpdf-harness's description is 1,362 characters, over the 1,024 limit (an error that Claude's upload checks would refuse). Every other skill passes with no notes.

### search.rs · every word, at the start of a word
- refers-to: core/src/search.rs :: search, words, starts, body, snippet, Hit
- kind: decision
- logged: v0.5.0 · 2026-10-25

A skill matches when every word appears at the start of a word in its name or folder, description, or Markdown text (front matter left out). The first version matched inside words, so "lip sync" found "clipping" and "async"; matching at a word start keeps prefixes ("mask" finds "masks") and drops those. Scores: 8 for the name, 4 for the description, the number of places in the text up to 5, per word; ties by name then app; at most 60 results. Nothing is cached: a search over the 36 skills reads their Markdown again and takes about 80 ms in a whole CLI run, so a cache would be complexity for no gain yet.

### setup/apps.py, apps.rs · topic and licence per app
- refers-to: setup/apps.py :: TOPICS, topic_of · core/src/apps.rs :: App.topic, App.licence, Apps.topics · core/data/apps.json
- kind: decision
- logged: v0.5.0 · 2026-10-25

The registry's `kind` is one per app (18 kinds for 18 apps), so it cannot group anything; `TOPICS` in the generator maps kinds to four topics (Media, Design, Documents, Family) and fails on a new kind, so a new app cannot slip in without one. `licence` is the registry's `catalog.licence`, shown when a skill names none. The list's format version is now 2.

## v0.4.1 · registered in formcompiler {#v0-4-1}

### core/data/apps.json, build_app · the list from formcompiler 0.4.1, and the build formcompiler runs
- refers-to: core/data/apps.json · build_app · build_app.bat
- kind: decision
- logged: v0.4.1 · 2026-10-24

formcompiler 0.4.1 (7c92f91) registers formMCP, whose `.claude/skills` holds `formmcp-harness`, and formskills, which ships no skills; the regenerated list has 18 apps with formMCP among them. `build_app` and `build_app.bat` follow formtray's (check the tools, run `formskills_oc_install`, run the Tauri CLI from the repository root, log to `build_app.log`); formcompiler's `apps/formskills.json` calls `./build_app --no-install` and `call build_app.bat`. Checked: `./build_app --no-install --bundles deb` on Linux made `formskills_0.4.0_amd64.deb` (binary, LICENSE, NOTICE.md, desktop file, icons), and the release binary, run without a dev server, opened the window with every card and said why it read no skills (no catalogue here).

## v0.4.0 · personal edited copies {#v0-4-0}

### edits.rs · a copy beside the cache, never the original
- refers-to: core/src/edits.rs :: start, read, write, acknowledge, discard, download, list, describe, Record, Edit · core/src/pack.rs :: zip_skills
- kind: decision
- logged: v0.4.0 · 2026-10-24

A copy lives in `edits/<app>/<skill folder>/` under formskills' data folder, with `edits/<app>/<folder>.edit.json` beside it (outside the folder, so the index and zips never include it). `start` copies every file of the original skill into a hidden `.part` folder and renames it into place, and records the base (`release X` or `checkout`) and a SHA-256 of each original file; starting again returns the existing copy. Nothing ever writes to the release cache or to a checkout: the original stays as released, and pruning old releases cannot touch a copy. `write` replaces one existing file of the copy (plain path parts only, resolved inside the copy, at most 2 MB of text), written beside and renamed, and stamps `updated`; new files are not created in v0.4.0. `describe` reports `edited` (copy files that differ from the recorded originals) and `original_changed` (original files whose digest differs from the record, or added or removed): the "original updated" flag. `acknowledge` (Mark as seen) records the original's current digests and base and leaves the copy's text alone. `discard` deletes the copy and its record. `download` zips the copy as `<folder>-edited.zip` through `pack::zip_skills`, which `archive` now also uses.

Checked with the CLI against a scratch copy of formcut's skills used as a checkout: start (11 files, nothing edited), start again (same copy), write (SKILL.md edited; the original's last line unchanged), an upstream change to the original (flagged as SKILL.md), seen (flag clear, copy text kept), `../x`, a new file name, `../formvis` as a skill, `/etc/passwd` and `../../formvis/x` refused, download (11 files, the edit inside), a new process with the checkout gone (copy listed, original "not available" with the reason), discard (copy and record gone).

## v0.3.1 · no partial download {#v0-3-1}

### pack.rs · write beside, then rename
- refers-to: core/src/pack.rs :: archive
- kind: fix
- logged: v0.3.1 · 2026-10-24

v0.3.0 wrote the zip straight to its final name, so a write that failed (the disk filled during the release check) left a broken `formcut-skills-checkout.zip` in the downloads folder, and the next download became `(2)`. The zip is now written to a hidden `.<name>.zip.part-<pid>` in the same folder and renamed into place only when complete; on any failure the part is removed and the error names the target. Checked on a 20 KB tmpfs: the download fails with "No space left on device" and the folder stays empty; a normal download gets the plain name.

## v0.3.0 · read and download {#v0-3-0}

### library.rs · read_text stays inside the skills folder
- refers-to: core/src/library.rs :: read_text, FileText
- kind: decision
- logged: v0.3.0 · 2026-10-24

A file is asked for by its path in the set (`<skill folder>/<path>`). The path must be made only of plain parts (no `..`, no root, no drive), and after resolving links it must still be a file under the skills folder, so a link inside a checkout cannot point the window at the rest of the disk. Files over 2 MB, or that are not UTF-8 or hold a zero byte, come back with a note instead of text. Checked: `..`, a `../` hidden in the middle, an absolute path and a link to `/etc/passwd` placed in a scratch skill are all refused; SKILL.md reads as text.

### pack.rs · downloads shaped like the release asset
- refers-to: core/src/pack.rs :: archive, free_name, label · core/src/places.rs :: downloads_dir
- kind: decision
- logged: v0.3.0 · 2026-10-24

A download is a zip of whole skill folders (`<folder>/<path>`), entries in index order, every date set to 1980-01-01 and every mode to 0644, as formcompiler's `agents.py` writes its asset; one skill is `<folder>.zip`, an app's set `<app>-skills-v<version>.zip` (`-checkout` in dev mode). It goes to `FORMSKILLS_DOWNLOADS`, else the Downloads folder, else home, and never replaces a file: the next free name is `<name> (2).zip`. Checked: the formvis set from its checkout holds the same 42 files, byte for byte, as formcompiler's `formvis-skills-v1.97.1.zip`, and `testzip` finds no error.

## v0.2.0 · fetch {#v0-2-0}

### catalog.rs · the same trust as FormPortal and formMCP
- refers-to: core/src/catalog.rs :: load, verify, keys, get, released · core/catalog_keys.txt
- kind: decision
- logged: v0.2.0 · 2026-10-24

The signed family catalogue (formcompiler's `catalog` release, or `FORMSKILLS_CATALOG`: https, loopback http or a file) is read with its `.sig`, checked against the compiled-in keys plus `FORMAI_CATALOG_PUBKEY`, the same contract as FormPortal and formMCP; FormPortal's kept copy is used when the network fails, or only that with `FORMSKILLS_OFFLINE`; `FORMSKILLS_ALLOW_UNSIGNED` admits an unsigned one for development. From each product it takes the stable channel (the beta channel only when there is no stable) and that release's `agents.skills` asset: `file`, `url`, `bytes`, `sha256`, as formcompiler's `catalog.py` writes it. Released versions only: unreleased `main` is never read here.

### fetch.rs · download, check, unpack, keep
- refers-to: core/src/fetch.rs :: ensure, kept, unpack, Record · core/src/places.rs :: data_dir, cache_dir
- kind: decision
- logged: v0.2.0 · 2026-10-24

Kept in `released/<app>/<version>/` under formskills' data folder (`FORMSKILLS_HOME`, else Application Support `ai.nodemode.formskills`, `%LOCALAPPDATA%\formskills`, or `~/.local/share/formskills`): the unpacked `skills/` tree and `asset.json` (the catalogue's asset record and when it was fetched). A version already kept with the same digest is reused without a download; `fetch` (and the window's Refresh) downloads again. A download is refused unless its address is https (or loopback), it is at most 64 MB, and its SHA-256 equals the catalogue's. Unpacking refuses an entry that leaves the folder (`enclosed_name`) or is a link, more than 10 000 entries, or more than 256 MB unpacked; it goes into a hidden `.part` folder that is renamed into place only when complete, and then other versions of that app are removed (personal edits, v0.4.0, will live elsewhere). App ids and versions must be plain names before they become folder names. When the catalogue or a download fails, the newest kept version is shown with the reason (`kept`).

### library.rs · where each app's skills come from
- refers-to: core/src/library.rs :: load, checkout, from_release, Source · core/src/places.rs :: dev_mode, dev_roots
- kind: decision
- logged: v0.2.0 · 2026-10-24

Each app gets one source: `release` (the latest released asset, `downloaded` when it was fetched now), `kept` (an earlier release, with why the latest could not be read), `dev` or `missing` (with the reason: no release yet, a release without a skills asset, an untrusted catalogue, a bad digest). The dev mode is opt-in (`FORMSKILLS_DEV=1`; `./formskills dev` sets it with the folder that holds this checkout as `FORMSKILLS_DEV_ROOTS`), so released-only stays the default the owner set: in it, `<root>/<app>/<skills folder>` is read when present and releases are used for the rest. The catalogue is not read when every chosen app came from a checkout.

### skills.rs · the same index formcompiler builds
- refers-to: core/src/skills.rs :: index, front_matter, walk, kind_of
- kind: rationale
- logged: v0.2.0 · 2026-10-24

A skill is a top-level folder with a `SKILL.md`; its name and description come from the front matter, with formcompiler's rules (folded and literal blocks joined, quotes trimmed, the folder name when there is no name). Files skip `__pycache__`, `node_modules`, `.git`, `.DS_Store`, `Thumbs.db`, `*.pyc` and links, and are sorted; each is marked `skill` (the top `SKILL.md`), `sub-skill` (`SUB-SKILL.md` or a nested `SKILL.md`), `reference` (other Markdown) or `file`, for the v0.3.0 viewer. Checked: formvis 1.97.1's asset built by formcompiler's `agents.py` and the formvis checkout index to the same skills, names, descriptions, files and sizes (4 skills, 42 files); all 17 checkouts in dev mode give 35 skills.

### Checked end to end
- kind: decision
- logged: v0.2.0 · 2026-10-24

With a key pair from formcompiler's `catalog.py keygen`, a catalogue signed with its `sign`, and real assets from `agents.py build` served on loopback: no trusted key, a wrong key and an unsigned file are refused with the reason (and a kept copy shown when there is one); unsigned is admitted with `FORMSKILLS_ALLOW_UNSIGNED`; formvis downloads once, is reused on the next run, downloads again with `fetch`, and a newer version replaces the older folder; a wrong digest is refused naming both digests; an asset with `../escape.txt` is refused and nothing is written outside; a release without an asset and an app without a release say so; with the server stopped every app shows its kept version; `FORMSKILLS_OFFLINE` with FormPortal's kept copy uses it. The real catalogue address fails TLS in this sandbox (its proxy's certificate authority) and falls back with the reason.

## v0.1.0 · the list {#v0-1-0}

### setup/apps.py · only apps that name a skills folder
- refers-to: setup/apps.py :: build, main
- kind: decision
- logged: v0.1.0 · 2026-10-24

The family plan forbids hand-kept copies, so the list is generated from formcompiler's registry: for each `apps/<app>.json` whose `agents.skills` names a folder (formcompiler 0.4.0 added the block), the catalogue id, name, kind and summary, the repository, that folder, `state`, and `enabled` (written as `released`). Apps without a skills folder are left out: formskills has nothing to show for them. Sorted by display name, since that is the order a person scans the chips in. It records formcompiler's version and commit; `--check` exits non-zero while the file differs. Generated from formcompiler 0.4.0 (30943ac): 17 apps. formMCP and formskills themselves are not in the registry yet (family plan, Phase 5), so formMCP's own skill appears once it is registered.

### apps.rs · compiled in, format checked
- refers-to: core/src/apps.rs :: App, Apps::bundled, get, describe_source
- kind: rationale
- logged: v0.1.0 · 2026-10-24

The list is compiled in with `include_str!`, so the command line and the window read the same bytes and nothing is fetched in v0.1.0. `bundled` refuses a file whose `format` is not `formskills-apps`. `get` matches the catalogue id, the repository name or the display name, ignoring case, so `formvis`, `FormVis` and `formdeck` (FormSlide's repository) all work. From v0.2.0 this list is the fallback under the signed catalogue, the way formMCP's is.

### cli · three commands
- refers-to: cli/src/main.rs :: main, HELP
- kind: rationale
- logged: v0.1.0 · 2026-10-24

`apps` (with `source` and `count`), `app <id>` and `version`; an unknown app or command exits 1 with the reason. From v0.2.0 also `skills [id]`, `fetch [id]`, `catalog` and `where`; from v0.3.0 `read <id> <path>` and `download <id> [skill] [--to DIR]`; from v0.4.0 `edits` and `edit start|read|write|seen|download|discard`. Checked: `formskills-cli version` prints 0.1.0, `app formvis` prints FormVis with `.claude/skills`, `app nope` exits 1 naming `apps`.
