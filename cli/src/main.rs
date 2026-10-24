use std::process::ExitCode;

use formskills_core::{Apps, CORE_VERSION};
use serde_json::json;

const HELP: &str = "formskills-cli: formskills without the window

  apps         the Form apps that ship skills: id, name, kind, summary, where the skills live, state (JSON)
  app <id>     one app (JSON)
  version      formskills' version
  help         this text
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
