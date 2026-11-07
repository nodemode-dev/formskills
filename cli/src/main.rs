use std::process::ExitCode;

use formskills_core::{catalog, check, edits, extensions, install, library, own, pack, pins, places, search, Apps, CORE_VERSION};
use serde_json::json;

const HELP: &str = "formskills-cli: formskills without the window

  apps            the Form apps that ship skills: id, name, kind, summary, where the skills live, state (JSON)
  app <id>        one app (JSON)
  skills [id]     each app's skills and where they came from: its latest release, a kept copy, or a checkout in dev mode (JSON)
  fetch [id]      download every app's latest released skills again, check each digest, and keep them (JSON)
  search <words>  every app's skills holding all the words, in the name, description or text, best first (JSON)
  check <id> [skill] [--edit]   an app's skills, one skill, or your copy of it, against the SKILL.md format (JSON; exit 1 on an error)
  read <id> <path>   one file of an app's skills, by its path in the set (skill folder first), as text
  download <id> [skill] [--to DIR]   an app's skills, or one skill, as a zip in Downloads (or DIR)
  pin <id> <version>|latest   keep an app on one of its earlier releases (the catalogue lists the last five), or follow the latest again
  pins            the apps you pinned (JSON)
  new <name> [description...]   start a skill of your own from the template (then edit it with `edit ... yours <name> ...`)
  own             your own skills (JSON)
  install <id> [skill] --to claude[,codex,cursor] [--project DIR] [--copy] [--force]
                  put an app's skills, one skill, your copy (--copy) or your own skill (id yours) into an agent's skills
                  folder: for you (~/.claude/skills, ~/.agents/skills, ~/.cursor/skills) or one project (DIR/.claude/skills ...)
  installed       what formskills installed, where, whether it was changed there, and newer releases (JSON)
  update <skill> --for AGENT [--project DIR]   install that skill again from its source (a newer release, your latest copy)
  uninstall <skill> --from AGENT [--project DIR] [--force]   remove a skill formskills installed; never one it did not
  edits           your edited copies: what you changed, and whether the original changed since (JSON)
  edit start <id> <skill>            make your own copy of a skill (the original is never changed)
  edit read <id> <skill> <path>      one file of your copy, as text
  edit write <id> <skill> <path> <file|->   replace one file of your copy with a file's text (or stdin)
  edit seen <id> <skill>             note the original's current version as the one your copy follows
  edit download <id> <skill> [--to DIR]   your copy as <skill>-edited.zip
  edit discard <id> <skill>          delete your copy
  extensions [list]   the extensions FormPortal installed and form.ext runs for formskills: id, name, version, source, state, reason, commands (JSON)
  extensions command <id> <command> [args-json]   ask the open formskills window to run an extension's command, with its consent rules (JSON)
  extensions stamp    when FormPortal's lists for formskills last changed (JSON)
  catalog         whether the signed family catalogue can be used now, and why not
  where           the folder formskills keeps released skills in
  version         formskills' version
  help            this text

Your own skills use the app name `yours` in `edit` and `check --edit`.
Released skills only, unless FORMSKILLS_DEV=1: then an app's checkout in a FORMSKILLS_DEV_ROOTS folder is read instead.
";

fn print(value: &serde_json::Value) {
    println!("{}", serde_json::to_string_pretty(value).unwrap_or_default());
}

fn read_input(from: &str) -> Result<String, String> {
    if from == "-" {
        let mut text = String::new();
        std::io::Read::read_to_string(&mut std::io::stdin(), &mut text).map(|_| text).map_err(|e| e.to_string())
    } else {
        std::fs::read_to_string(from).map_err(|e| format!("{from}: {e}"))
    }
}

fn run_extensions(args: &[String]) -> ExitCode {
    let base = args.iter().position(|a| a == "--base").and_then(|i| args.get(i + 1)).cloned().unwrap_or_else(|| "/api/extensions/files".to_string());
    let plain: Vec<&str> = {
        let mut out = Vec::new();
        let mut skip = false;
        for a in args {
            if skip {
                skip = false;
            } else if a == "--base" {
                skip = true;
            } else {
                out.push(a.as_str());
            }
        }
        out
    };
    let result: Result<serde_json::Value, String> = match plain.first().copied().unwrap_or("list") {
        "list" => Ok(extensions::listing(&base, None)),
        "stamp" => {
            let (enabled, dev) = extensions::stamp(extensions::PRODUCT, None);
            Ok(json!({ "stamp": [enabled, dev] }))
        }
        "file" => match (plain.get(1), plain.get(2), plain.get(3)) {
            (Some(id), Some(version), Some(path)) => {
                let found = extensions::list(None);
                match extensions::file_for(&found, id, version, path) {
                    Some((target, kind)) => {
                        let headers: serde_json::Map<String, serde_json::Value> = extensions::headers_for(kind, &base).into_iter().map(|(k, v)| (k.to_string(), json!(v))).collect();
                        Ok(json!({ "path": target.display().to_string(), "type": kind, "headers": headers }))
                    }
                    None => Err("not found".to_string()),
                }
            }
            _ => Err("extensions file <id> <version> <path>".to_string()),
        },
        "command" => match (plain.get(1), plain.get(2)) {
            (Some(id), Some(cmd)) => {
                let args = match plain.get(3) {
                    Some(text) => serde_json::from_str(text).map_err(|e| format!("the args are not JSON: {e}")),
                    None => Ok(json!({})),
                };
                args.and_then(|a| {
                    let found = extensions::list(None);
                    let Some(ext) = found.iter().find(|e| e.id == *id) else {
                        return Err(format!("no extension {id:?} for formskills; `formskills-cli extensions list` lists them"));
                    };
                    if ext.state != "ready" {
                        return Err(format!("{} is refused: {}", ext.name, ext.reason));
                    }
                    if !ext.commands.iter().any(|c| c["id"] == json!(cmd)) {
                        return Err(format!("{} has no command {cmd}", ext.name));
                    }
                    extensions::ask(id, cmd, a).map(|r| json!({ "id": id, "command": cmd, "result": r }))
                })
            }
            _ => Err("extensions command <id> <command> [args-json]".to_string()),
        },
        "requests" => Ok(json!(extensions::take())),
        "answer" => match (plain.get(1), plain.get(2)) {
            (Some(key), Some(from)) => read_input(from)
                .and_then(|t| serde_json::from_str::<serde_json::Value>(&t).map_err(|e| e.to_string()))
                .and_then(|v| {
                    let outcome = match v.get("error").and_then(|e| e.as_str()) {
                        Some(e) => Err(e.to_string()),
                        None => Ok(v.get("result").cloned().unwrap_or(serde_json::Value::Null)),
                    };
                    extensions::answer(key, outcome).map(|()| json!({ "answered": key }))
                }),
            _ => Err("extensions answer <key> <file|->".to_string()),
        },
        other => Err(format!("unknown extensions action {other:?}; use list, command or stamp")),
    };
    match result {
        Ok(v) => {
            print(&v);
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!("formskills: {e}");
            ExitCode::FAILURE
        }
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let command = args.first().map(String::as_str).unwrap_or("help");
    if matches!(command, "help" | "-h" | "--help") {
        print!("{HELP}");
        return ExitCode::SUCCESS;
    }
    if matches!(command, "version" | "-V" | "--version") {
        println!("formskills {CORE_VERSION}");
        return ExitCode::SUCCESS;
    }
    if command == "where" {
        println!("{}", places::cache_dir().display());
        return ExitCode::SUCCESS;
    }
    if command == "catalog" {
        let found = catalog::load();
        let with_skills = found.released.values().filter(|r| r.skills.is_some()).count();
        print(&json!({ "used": found.used, "source": found.note, "releases": found.released.len(), "with_skills": with_skills }));
        return ExitCode::SUCCESS;
    }
    if command == "new" {
        let (Some(name), description) = (args.get(1), args[2.min(args.len())..].join(" ")) else {
            eprintln!("formskills: new <name> [description], for example: new tidy-notes Tidies meeting notes into decisions and actions");
            return ExitCode::FAILURE;
        };
        return match own::create(name, &description) {
            Ok(made) => {
                print(&json!({ "created": made, "folder": edits::copy_dir(own::OWN).join(name).display().to_string() }));
                ExitCode::SUCCESS
            }
            Err(e) => {
                eprintln!("formskills: {e}");
                ExitCode::FAILURE
            }
        };
    }
    if command == "own" {
        print(&json!({ "folder": edits::copy_dir(own::OWN).display().to_string(), "skills": own::list() }));
        return ExitCode::SUCCESS;
    }
    if command == "pins" {
        print(&json!({ "file": pins::path().display().to_string(), "pins": pins::load() }));
        return ExitCode::SUCCESS;
    }
    if command == "edit" && args.get(2).map(String::as_str) == Some(own::OWN) {
        let action = args.get(1).map(String::as_str).unwrap_or("");
        let Some(folder) = args.get(3).cloned() else {
            eprintln!("formskills: edit {action} yours <name>");
            return ExitCode::FAILURE;
        };
        let result: Result<serde_json::Value, String> = match (action, args.get(4), args.get(5)) {
            ("read", Some(path), _) => edits::read(own::OWN, &folder, path).map(|f| {
                print!("{}", f.text.unwrap_or_default());
                serde_json::Value::Null
            }),
            ("write", Some(path), Some(from)) => {
                let text = if from == "-" {
                    let mut text = String::new();
                    std::io::Read::read_to_string(&mut std::io::stdin(), &mut text).map(|_| text).map_err(|e| e.to_string())
                } else {
                    std::fs::read_to_string(from).map_err(|e| format!("{from}: {e}"))
                };
                text.and_then(|t| edits::write(own::OWN, &folder, path, &t, None)).map(|e| json!(e))
            }
            ("download", _, _) => {
                let to = args.iter().position(|a| a == "--to").and_then(|i| args.get(i + 1)).map(std::path::Path::new);
                edits::download(own::OWN, &folder, to).map(|s| json!(s))
            }
            ("discard", _, _) => edits::discard(own::OWN, &folder).map(|()| json!({ "discarded": format!("yours/{folder}") })),
            _ => Err("for your own skills: edit read|write|download|discard yours <name> ...".to_string()),
        };
        return match result {
            Ok(serde_json::Value::Null) => ExitCode::SUCCESS,
            Ok(value) => {
                print(&value);
                ExitCode::SUCCESS
            }
            Err(e) => {
                eprintln!("formskills: {e}");
                ExitCode::FAILURE
            }
        };
    }
    if command == "check" && args.get(1).map(String::as_str) == Some(own::OWN) {
        let Some(folder) = args.get(2).filter(|a| *a != "--edit") else {
            eprintln!("formskills: check yours <name>");
            return ExitCode::FAILURE;
        };
        return match edits::validate(own::OWN, folder) {
            Ok(report) => {
                let failed = report.errors > 0;
                print(&json!({ "app": own::OWN, "spec": check::SPEC, "errors": report.errors, "warnings": report.warnings, "skills": [report] }));
                if failed { ExitCode::FAILURE } else { ExitCode::SUCCESS }
            }
            Err(e) => {
                eprintln!("formskills: {e}");
                ExitCode::FAILURE
            }
        };
    }
    if command == "extensions" {
        return run_extensions(&args[1..]);
    }
    let apps = match Apps::bundled() {
        Ok(apps) => apps,
        Err(e) => {
            eprintln!("formskills: {e}");
            return ExitCode::FAILURE;
        }
    };
    if matches!(command, "install" | "installed" | "update" | "uninstall") {
        let value = |name: &str| args.iter().position(|a| a == name).and_then(|i| args.get(i + 1)).cloned();
        let has = |name: &str| args.iter().any(|a| a == name);
        let plain: Vec<&str> = {
            let mut out = Vec::new();
            let mut skip = false;
            for a in &args[1..] {
                if skip {
                    skip = false;
                    continue;
                }
                if matches!(a.as_str(), "--to" | "--for" | "--from" | "--project") {
                    skip = true;
                    continue;
                }
                if a.starts_with("--") {
                    continue;
                }
                out.push(a.as_str());
            }
            out
        };
        let lib = library::load(&apps, None, false);
        let project = value("--project");
        let result: Result<serde_json::Value, String> = match command {
            "installed" => Ok(json!({ "installed": install::list(Some(&lib.apps)) })),
            "install" => (|| {
                let id = plain.first().copied().ok_or("install needs an app id (or yours) and --to")?;
                let id = if id == own::OWN { own::OWN.to_string() } else { apps.get(id).map(|a| a.id.clone()).ok_or_else(|| format!("no Form app ships skills under {id:?}"))? };
                let agents: Vec<String> = value("--to").ok_or("install needs --to claude, codex or cursor (comma separated)")?.split(',').map(|a| a.trim().to_string()).filter(|a| !a.is_empty()).collect();
                let skill = plain.get(1).copied();
                if skill.is_none() && id == own::OWN {
                    return Err("install yours needs the skill's name".to_string());
                }
                let rows = install::install_many(&lib.apps, &id, skill, has("--copy"), &agents, project.as_deref(), has("--force"))?;
                let failed = rows.iter().filter(|r| r.error.is_some()).count();
                if failed == rows.len() {
                    return Err(rows.iter().filter_map(|r| r.error.clone()).collect::<Vec<_>>().join("; "));
                }
                Ok(json!({ "installed": rows, "failed": failed }))
            })(),
            _ => (|| {
                let folder = plain.first().copied().ok_or_else(|| format!("{command} needs the skill's folder name"))?;
                let agent = value(if command == "update" { "--for" } else { "--from" }).ok_or_else(|| format!("{command} needs {} claude, codex or cursor", if command == "update" { "--for" } else { "--from" }))?;
                let target = install::Target::new(&agent, project.as_deref())?;
                if command == "update" {
                    install::update(&lib.apps, &target, folder).map(|s| json!(s))
                } else {
                    install::uninstall(&target, folder, has("--force")).map(|()| json!({ "removed": folder, "where": target.describe() }))
                }
            })(),
        };
        return match result {
            Ok(v) => {
                print(&v);
                ExitCode::SUCCESS
            }
            Err(e) => {
                eprintln!("formskills: {e}");
                ExitCode::FAILURE
            }
        };
    }
    if command == "pin" {
        let (Some(app), Some(version)) = (args.get(1).and_then(|n| apps.get(n)), args.get(2)) else {
            eprintln!("formskills: pin <id> <version>|latest");
            return ExitCode::FAILURE;
        };
        let wanted = (version != "latest").then_some(version.as_str());
        if let Some(v) = wanted {
            let listed = library::load(&apps, Some(&app.id), false).apps.into_iter().next().map(|a| a.releases).unwrap_or_default();
            if !listed.iter().any(|r| r == v) {
                eprintln!("formskills: {} has no release {v} with skills in the catalogue; it lists {}", app.name, if listed.is_empty() { "none".to_string() } else { listed.join(", ") });
                return ExitCode::FAILURE;
            }
        }
        return match pins::set(&app.id, wanted) {
            Ok(all) => {
                let found = library::load(&apps, Some(&app.id), false).apps.into_iter().next();
                print(&json!({ "pins": all, "now": found.map(|a| a.source) }));
                ExitCode::SUCCESS
            }
            Err(e) => {
                eprintln!("formskills: {e}");
                ExitCode::FAILURE
            }
        };
    }
    match command {
        "apps" => {
            print(&json!({ "source": apps.describe_source(), "count": apps.apps.len(), "apps": apps.apps }));
            ExitCode::SUCCESS
        }
        "skills" | "fetch" => {
            let only = args.get(1).map(String::as_str);
            if let Some(name) = only {
                if apps.get(name).is_none() {
                    eprintln!("formskills: no Form app ships skills under {name:?}; `formskills-cli apps` lists them");
                    return ExitCode::FAILURE;
                }
            }
            let found = library::load(&apps, only, command == "fetch");
            let count: usize = found.apps.iter().map(|a| a.skills.len()).sum();
            print(&json!({ "catalogue": found.catalogue, "dev": found.dev, "dev_roots": found.dev_roots, "skills": count, "apps": found.apps }));
            ExitCode::SUCCESS
        }
        "search" => {
            let query = args[1..].join(" ");
            if search::words(&query).is_empty() {
                eprintln!("formskills: search needs a word, for example `formskills-cli search mask`");
                return ExitCode::FAILURE;
            }
            let found = library::load(&apps, None, false);
            let hits = search::search(&found.apps, &query);
            print(&json!({ "query": query, "count": hits.len(), "hits": hits }));
            ExitCode::SUCCESS
        }
        "check" => {
            let rest: Vec<&str> = args[1..].iter().map(String::as_str).filter(|a| *a != "--edit").collect();
            let own = args.iter().any(|a| a == "--edit");
            let Some(app) = rest.first().and_then(|name| apps.get(name)).cloned() else {
                eprintln!("formskills: check needs an app that ships skills; `formskills-cli apps` lists them");
                return ExitCode::FAILURE;
            };
            let skill = rest.get(1).copied();
            let reports: Result<Vec<check::Report>, String> = if own {
                match skill {
                    Some(folder) => edits::validate(&app.id, folder).map(|r| vec![r]),
                    None => Err("check --edit needs the skill whose copy to check".to_string()),
                }
            } else {
                let entry = library::load(&apps, Some(&app.id), false).apps.into_iter().next();
                match entry.as_ref().and_then(|e| e.root.as_deref().map(|root| (e, root))) {
                    Some((e, root)) => {
                        let chosen: Vec<_> = e.skills.iter().filter(|s| skill.is_none_or(|w| s.folder == w)).collect();
                        if chosen.is_empty() {
                            Err(format!("{} has no skill {:?}", app.name, skill.unwrap_or("")))
                        } else {
                            Ok(chosen.iter().map(|s| check::validate(&root.join(&s.folder), &s.folder)).collect())
                        }
                    }
                    None => Err(format!("{} has no skills here", app.name)),
                }
            };
            match reports {
                Ok(reports) => {
                    let errors: usize = reports.iter().map(|r| r.errors).sum();
                    let warnings: usize = reports.iter().map(|r| r.warnings).sum();
                    print(&json!({ "app": app.id, "spec": check::SPEC, "errors": errors, "warnings": warnings, "skills": reports }));
                    if errors > 0 { ExitCode::FAILURE } else { ExitCode::SUCCESS }
                }
                Err(e) => {
                    eprintln!("formskills: {e}");
                    ExitCode::FAILURE
                }
            }
        }
        "edits" => {
            let found = library::load(&apps, None, false);
            print(&json!({ "folder": edits::edits_dir().display().to_string(), "edits": edits::list(Some(&found.apps)) }));
            ExitCode::SUCCESS
        }
        "edit" => {
            let action = args.get(1).map(String::as_str).unwrap_or("");
            let Some(app) = args.get(2).and_then(|name| apps.get(name)).cloned() else {
                eprintln!("formskills: edit {action} needs an app that ships skills and a skill; see `formskills-cli help`");
                return ExitCode::FAILURE;
            };
            let Some(folder) = args.get(3).cloned() else {
                eprintln!("formskills: edit {action} needs the skill's folder name, for example formvis-harness");
                return ExitCode::FAILURE;
            };
            let original = library::load(&apps, Some(&app.id), false).apps.into_iter().next();
            let result: Result<serde_json::Value, String> = match action {
                "start" => original.as_ref().ok_or_else(|| format!("{} was not read", app.name)).and_then(|o| edits::start(o, &folder)).map(|e| json!(e)),
                "read" => match args.get(4) {
                    Some(path) => edits::read(&app.id, &folder, path).map(|f| {
                        if let Some(text) = &f.text {
                            print!("{text}");
                        }
                        serde_json::Value::Null
                    }),
                    None => Err("edit read needs a path in the skill, for example SKILL.md".to_string()),
                },
                "write" => match (args.get(4), args.get(5)) {
                    (Some(path), Some(from)) => {
                        let text = if from == "-" {
                            let mut text = String::new();
                            std::io::Read::read_to_string(&mut std::io::stdin(), &mut text).map(|_| text).map_err(|e| e.to_string())
                        } else {
                            std::fs::read_to_string(from).map_err(|e| format!("{from}: {e}"))
                        };
                        text.and_then(|t| edits::write(&app.id, &folder, path, &t, original.as_ref())).map(|e| json!(e))
                    }
                    _ => Err("edit write needs a path in the skill and a file to take the text from (- for stdin)".to_string()),
                },
                "seen" => original.as_ref().ok_or_else(|| format!("{} was not read", app.name)).and_then(|o| edits::acknowledge(&app.id, &folder, o)).map(|e| json!(e)),
                "download" => {
                    let to = args.iter().position(|a| a == "--to").and_then(|i| args.get(i + 1)).map(std::path::Path::new);
                    edits::download(&app.id, &folder, to).map(|s| json!(s))
                }
                "discard" => edits::discard(&app.id, &folder).map(|()| json!({ "discarded": format!("{}/{folder}", app.id) })),
                other => Err(format!("unknown edit action {other:?}; use start, read, write, seen, download or discard")),
            };
            match result {
                Ok(serde_json::Value::Null) => ExitCode::SUCCESS,
                Ok(value) => {
                    print(&value);
                    ExitCode::SUCCESS
                }
                Err(e) => {
                    eprintln!("formskills: {e}");
                    ExitCode::FAILURE
                }
            }
        }
        "read" | "download" => {
            let Some(app) = args.get(1).and_then(|name| apps.get(name)).cloned() else {
                eprintln!("formskills: {command} needs an app that ships skills; `formskills-cli apps` lists them");
                return ExitCode::FAILURE;
            };
            let found = library::load(&apps, Some(&app.id), false);
            let Some(entry) = found.apps.into_iter().next() else {
                eprintln!("formskills: {} was not read", app.name);
                return ExitCode::FAILURE;
            };
            let result = if command == "read" {
                match (args.get(2), entry.root.as_deref()) {
                    (Some(path), Some(root)) => library::read_text(root, path).map(|f| {
                        match f.text {
                            Some(text) => print!("{text}"),
                            None => eprintln!("formskills: {}: {}", f.path, f.note.unwrap_or_default()),
                        }
                    }),
                    (None, _) => Err("read needs a path, for example formvis-harness/SKILL.md".to_string()),
                    (_, None) => Err(format!("{} has no skills here", app.name)),
                }
            } else {
                let rest: Vec<&str> = args[2..].iter().map(String::as_str).collect();
                let to = rest.iter().position(|a| *a == "--to").and_then(|i| rest.get(i + 1)).map(std::path::Path::new);
                let skill = rest.first().filter(|a| **a != "--to").copied();
                pack::archive(&entry, &app.app, skill, to).map(|saved| print(&json!(saved)))
            };
            match result {
                Ok(()) => ExitCode::SUCCESS,
                Err(e) => {
                    eprintln!("formskills: {e}");
                    ExitCode::FAILURE
                }
            }
        }
        "app" => match args.get(1).and_then(|name| apps.get(name)) {
            Some(app) => {
                print(&json!(app));
                ExitCode::SUCCESS
            }
            None => {
                eprintln!("formskills: no Form app ships skills under {:?}; `formskills-cli apps` lists them", args.get(1).map(String::as_str).unwrap_or(""));
                ExitCode::FAILURE
            }
        },
        other => {
            eprintln!("formskills: unknown command {other:?}\n\n{HELP}");
            ExitCode::FAILURE
        }
    }
}
