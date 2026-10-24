use std::process::ExitCode;

use formskills_core::library::{self, Library};
use formskills_core::Apps;

fn read(refresh: bool) -> Result<Library, String> {
    let apps = Apps::bundled()?;
    Ok(library::load(&apps, None, refresh))
}

#[tauri::command]
async fn library() -> Result<Library, String> {
    tauri::async_runtime::spawn_blocking(|| read(false)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn refresh() -> Result<Library, String> {
    tauri::async_runtime::spawn_blocking(|| read(true)).await.map_err(|e| e.to_string())?
}

pub fn run() -> ExitCode {
    if let Err(e) = Apps::bundled() {
        eprintln!("formskills: {e}");
        return ExitCode::FAILURE;
    }
    match tauri::Builder::default().invoke_handler(tauri::generate_handler![library, refresh]).run(tauri::generate_context!()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("formskills: the window could not start: {e}");
            ExitCode::FAILURE
        }
    }
}
