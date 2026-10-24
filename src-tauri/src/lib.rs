use std::process::ExitCode;

pub fn run() -> ExitCode {
    if let Err(e) = formskills_core::Apps::bundled() {
        eprintln!("formskills: {e}");
        return ExitCode::FAILURE;
    }
    match tauri::Builder::default().run(tauri::generate_context!()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("formskills: the window could not start: {e}");
            ExitCode::FAILURE
        }
    }
}
