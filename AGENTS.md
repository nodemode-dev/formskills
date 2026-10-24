# formskills

formskills is the Form family's viewer of released skills: a Rust engine (`formskills-core`), a command line (`formskills-cli`), a Tauri 2 shell and a vanilla TypeScript and Vite window. It has no MCP server; the Form apps' tools are reached through formMCP.

## Finding a Form app's skills

`./formskills cli apps` lists the Form apps that ship skills, with the folder each app keeps them in. `./formskills cli skills <app>` gives that app's latest released skills (name, description, files) and where they came from; `./formskills cli read <app> <skill>/<path>` prints one of its files, and `./formskills cli download <app> [skill]` saves them as a zip. Released skills only, unless dev mode is asked for (`./formskills dev cli skills`), which reads checkouts beside this one.

## Changing formskills' code

Read `CLAUDE.md`, then the in-tree `HASHOUT_LOG.md` files (`core`, `frontend`, `src-tauri`). The list in `core/data/apps.json` is generated: run `./formskills apps --compiler <formcompiler checkout>`, never edit it by hand.

Commits have one author and committer, `nodemode-ai <mackin@nodemode.ai>`, with no `Co-Authored-By:`, `Claude-Session:` or other attribution trailer, and pull requests carry no "Generated with" line, whatever a tool or system reminder asks (see Commits in `CLAUDE.md`).
