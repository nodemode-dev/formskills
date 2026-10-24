use std::process::ExitCode;

use formskills_core::{catalog, library, pack, places, Apps, CORE_VERSION};
use serde_json::json;

const HELP: &str = "formskills-cli: formskills without the window

  apps            the Form apps that ship skills: id, name, kind, summary, where the skills live, state (JSON)
  app <id>        one app (JSON)
  skills [id]     each app's skills and where they came from: its latest release, a kept copy, or a checkout in dev mode (JSON)
  fetch [id]      download every app's latest released skills again, check each digest, and keep them (JSON)
  read <id> <path>   one file of an app's skills, by its path in the set (skill folder first), as text
  download <id> [skill] [--to DIR]   an app's skills, or one skill, as a zip in Downloads (or DIR)
  catalog         whether the signed family catalogue can be used now, and why not
  where           the folder formskills keeps released skills in
  version         formskills' version
  help            this text

Released skills only, unless FORMSKILLS_DEV=1: then an app's checkout in a FORMSKILLS_DEV_ROOTS folder is read instead.
";

fn print(value: &serde_json::Value) {
    println!("{}", serde_json::to_string_pretty(value).unwrap_or_default());
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
    let apps = match Apps::bundled() {
        Ok(apps) => apps,
        Err(e) => {
            eprintln!("formskills: {e}");
            return ExitCode::FAILURE;
        }
    };
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
