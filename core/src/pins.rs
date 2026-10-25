use std::collections::BTreeMap;
use std::path::PathBuf;

use crate::fetch::plain;
use crate::places::data_dir;

pub fn path() -> PathBuf {
    data_dir().join("pins.json")
}

pub fn load() -> BTreeMap<String, String> {
    std::fs::read(path()).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
}

pub fn set(app: &str, version: Option<&str>) -> Result<BTreeMap<String, String>, String> {
    if !plain(app) || version.is_some_and(|v| !plain(v)) {
        return Err(format!("{app} {} is not a release formskills can pin", version.unwrap_or("")));
    }
    let mut pins = load();
    match version {
        Some(v) => pins.insert(app.to_string(), v.to_string()),
        None => pins.remove(app),
    };
    let file = path();
    if let Some(parent) = file.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
    }
    let part = file.with_extension(format!("part-{}", std::process::id()));
    let json = serde_json::to_vec_pretty(&pins).map_err(|e| e.to_string())?;
    if let Err(e) = std::fs::write(&part, json).and_then(|()| std::fs::rename(&part, &file)) {
        let _ = std::fs::remove_file(&part);
        return Err(format!("{}: {e}", file.display()));
    }
    Ok(pins)
}
