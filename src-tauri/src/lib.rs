use std::process::ExitCode;
use std::sync::{Arc, Mutex};

use formskills_core::edits::{self, Edit};
use formskills_core::library::{self, AppSkills, FileText, Library};
use formskills_core::pack::{self, Saved};
use formskills_core::Apps;

#[derive(Default, Clone)]
struct Shown(Arc<Mutex<Option<Library>>>);

fn read(refresh: bool, shown: Shown) -> Result<Library, String> {
    let apps = Apps::bundled()?;
    let found = library::load(&apps, None, refresh);
    if let Ok(mut slot) = shown.0.lock() {
        *slot = Some(found.clone());
    }
    Ok(found)
}

fn entry(shown: &Shown, app: &str) -> Result<AppSkills, String> {
    let slot = shown.0.lock().map_err(|_| "the library is busy".to_string())?;
    let found = slot.as_ref().ok_or("the skills have not been read yet")?;
    found.apps.iter().find(|a| a.id == app).cloned().ok_or_else(|| format!("{app} is not in the library"))
}

#[tauri::command]
async fn library(shown: tauri::State<'_, Shown>) -> Result<Library, String> {
    let shown = shown.inner().clone();
    tauri::async_runtime::spawn_blocking(move || read(false, shown)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn refresh(shown: tauri::State<'_, Shown>) -> Result<Library, String> {
    let shown = shown.inner().clone();
    tauri::async_runtime::spawn_blocking(move || read(true, shown)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn read_file(app: String, path: String, shown: tauri::State<'_, Shown>) -> Result<FileText, String> {
    let found = entry(shown.inner(), &app)?;
    let root = found.root.ok_or("this app has no skills here")?;
    tauri::async_runtime::spawn_blocking(move || library::read_text(&root, &path)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn download(app: String, skill: Option<String>, shown: tauri::State<'_, Shown>) -> Result<Saved, String> {
    let found = entry(shown.inner(), &app)?;
    let apps = Apps::bundled()?;
    let name = apps.get(&app).map(|a| a.app.clone()).unwrap_or(app);
    tauri::async_runtime::spawn_blocking(move || pack::archive(&found, &name, skill.as_deref(), None)).await.map_err(|e| e.to_string())?
}

fn original(shown: &Shown, app: &str) -> Option<AppSkills> {
    entry(shown, app).ok()
}

fn library_apps(shown: &Shown) -> Option<Vec<AppSkills>> {
    shown.0.lock().ok()?.as_ref().map(|l| l.apps.clone())
}

#[tauri::command]
async fn edits(shown: tauri::State<'_, Shown>) -> Result<Vec<Edit>, String> {
    let apps = library_apps(shown.inner());
    tauri::async_runtime::spawn_blocking(move || edits::list(apps.as_deref())).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn edit_start(app: String, skill: String, shown: tauri::State<'_, Shown>) -> Result<Edit, String> {
    let found = entry(shown.inner(), &app)?;
    tauri::async_runtime::spawn_blocking(move || edits::start(&found, &skill)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn edit_read(app: String, skill: String, path: String) -> Result<FileText, String> {
    tauri::async_runtime::spawn_blocking(move || edits::read(&app, &skill, &path)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn edit_write(app: String, skill: String, path: String, text: String, shown: tauri::State<'_, Shown>) -> Result<Edit, String> {
    let found = original(shown.inner(), &app);
    tauri::async_runtime::spawn_blocking(move || edits::write(&app, &skill, &path, &text, found.as_ref())).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn edit_seen(app: String, skill: String, shown: tauri::State<'_, Shown>) -> Result<Edit, String> {
    let found = entry(shown.inner(), &app)?;
    tauri::async_runtime::spawn_blocking(move || edits::acknowledge(&app, &skill, &found)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn edit_discard(app: String, skill: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || edits::discard(&app, &skill)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn edit_download(app: String, skill: String) -> Result<Saved, String> {
    tauri::async_runtime::spawn_blocking(move || edits::download(&app, &skill, None)).await.map_err(|e| e.to_string())?
}

pub fn run() -> ExitCode {
    if let Err(e) = Apps::bundled() {
        eprintln!("formskills: {e}");
        return ExitCode::FAILURE;
    }
    match tauri::Builder::default().manage(Shown::default()).invoke_handler(tauri::generate_handler![library, refresh, read_file, download, edits, edit_start, edit_read, edit_write, edit_seen, edit_discard, edit_download]).run(tauri::generate_context!()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("formskills: the window could not start: {e}");
            ExitCode::FAILURE
        }
    }
}
