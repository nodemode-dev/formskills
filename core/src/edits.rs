use std::collections::BTreeMap;
use std::path::{Component, Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::check;
use crate::fetch::{hex_sha256, plain};
use crate::library::{self, AppSkills, FileText, Source};
use crate::pack::{self, Saved};
use crate::places::data_dir;
use crate::skills::{self, Skill, SkillFile};

const TEXT_LIMIT: usize = 2 * 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Record {
    app: String,
    folder: String,
    base: String,
    digests: BTreeMap<String, String>,
    created: u64,
    updated: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Edit {
    pub app: String,
    pub folder: String,
    pub name: String,
    pub base: String,
    pub created: u64,
    pub updated: u64,
    pub files: Vec<SkillFile>,
    pub edited: Vec<String>,
    pub original: String,
    pub original_changed: Vec<String>,
}

pub fn edits_dir() -> PathBuf {
    data_dir().join("edits")
}

fn now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn check(app: &str, folder: &str) -> Result<(), String> {
    if plain(app) && plain(folder) {
        Ok(())
    } else {
        Err(format!("{app}/{folder} is not a skill formskills keeps copies of"))
    }
}

fn copy_root(app: &str) -> PathBuf {
    edits_dir().join(app)
}

fn record_path(app: &str, folder: &str) -> PathBuf {
    copy_root(app).join(format!("{folder}.edit.json"))
}

fn read_record(app: &str, folder: &str) -> Option<Record> {
    serde_json::from_slice(&std::fs::read(record_path(app, folder)).ok()?).ok()
}

fn write_atomic(target: &Path, bytes: &[u8]) -> Result<(), String> {
    let name = target.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let part = target.with_file_name(format!(".{name}.part-{}", std::process::id()));
    if let Err(e) = std::fs::write(&part, bytes).and_then(|()| std::fs::rename(&part, target)) {
        let _ = std::fs::remove_file(&part);
        return Err(format!("{}: {e}", target.display()));
    }
    Ok(())
}

fn save_record(record: &Record) -> Result<(), String> {
    let json = serde_json::to_vec_pretty(record).map_err(|e| e.to_string())?;
    write_atomic(&record_path(&record.app, &record.folder), &json)
}

fn base_label(source: &Source) -> String {
    match source {
        Source::Release { version, .. } | Source::Kept { version, .. } => format!("release {version}"),
        Source::Dev { .. } => "checkout".to_string(),
        Source::Missing { .. } => "unknown".to_string(),
    }
}

fn digests(dir: &Path, files: &[SkillFile]) -> BTreeMap<String, String> {
    files.iter().filter_map(|f| std::fs::read(dir.join(&f.path)).ok().map(|b| (f.path.clone(), hex_sha256(&b)))).collect()
}

fn original_skill<'a>(original: Option<&'a AppSkills>, folder: &str) -> Option<(&'a Skill, PathBuf)> {
    let app = original?;
    let skill = app.skills.iter().find(|s| s.folder == folder)?;
    Some((skill, app.root.as_ref()?.join(folder)))
}

fn describe(record: &Record, original: Option<&AppSkills>) -> Edit {
    let root = copy_root(&record.app);
    let skill = skills::index(&root).into_iter().find(|s| s.folder == record.folder);
    let (name, files) = skill.map(|s| (s.name, s.files)).unwrap_or_else(|| (record.folder.clone(), Vec::new()));
    let mine = digests(&root.join(&record.folder), &files);
    let mut edited: Vec<String> = mine.iter().filter(|(p, d)| record.digests.get(*p) != Some(*d)).map(|(p, _)| p.clone()).collect();
    edited.extend(record.digests.keys().filter(|p| !mine.contains_key(*p)).cloned());
    let (original_label, original_changed) = match (original, original_skill(original, &record.folder)) {
        (Some(app), Some((skill, dir))) => {
            let now = digests(&dir, &skill.files);
            let mut changed: Vec<String> = now.iter().filter(|(p, d)| record.digests.get(*p) != Some(*d)).map(|(p, _)| p.clone()).collect();
            changed.extend(record.digests.keys().filter(|p| !now.contains_key(*p)).cloned());
            changed.sort();
            changed.dedup();
            (base_label(&app.source), changed)
        }
        (Some(app), None) => match &app.source {
            Source::Missing { reason } => (format!("not available: {reason}"), Vec::new()),
            source => (format!("{} (this skill is no longer in it)", base_label(source)), Vec::new()),
        },
        (None, _) => ("not available".to_string(), Vec::new()),
    };
    edited.sort();
    edited.dedup();
    Edit {
        app: record.app.clone(),
        folder: record.folder.clone(),
        name,
        base: record.base.clone(),
        created: record.created,
        updated: record.updated,
        files,
        edited,
        original: original_label,
        original_changed,
    }
}

pub fn list(library: Option<&[AppSkills]>) -> Vec<Edit> {
    let Ok(apps) = std::fs::read_dir(edits_dir()) else { return Vec::new() };
    let mut found = Vec::new();
    for app in apps.flatten() {
        let Ok(entries) = std::fs::read_dir(app.path()) else { continue };
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            let Some(folder) = name.strip_suffix(".edit.json") else { continue };
            let app_id = app.file_name().to_string_lossy().to_string();
            if let Some(record) = read_record(&app_id, folder) {
                let original = library.and_then(|l| l.iter().find(|a| a.id == app_id));
                found.push(describe(&record, original));
            }
        }
    }
    found.sort_by(|a, b| (a.app.as_str(), a.folder.as_str()).cmp(&(b.app.as_str(), b.folder.as_str())));
    found
}

pub fn get(app: &str, folder: &str, original: Option<&AppSkills>) -> Result<Edit, String> {
    check(app, folder)?;
    let record = read_record(app, folder).ok_or_else(|| format!("there is no copy of {folder} yet"))?;
    Ok(describe(&record, original))
}

pub fn start(original: &AppSkills, folder: &str) -> Result<Edit, String> {
    check(&original.id, folder)?;
    if let Some(record) = read_record(&original.id, folder) {
        return Ok(describe(&record, Some(original)));
    }
    let (skill, dir) = original_skill(Some(original), folder).ok_or_else(|| format!("{} has no skill {folder:?} to copy", original.id))?;
    let root = copy_root(&original.id);
    let part = root.join(format!(".{folder}.part-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&part);
    let copied = (|| -> Result<(), String> {
        for f in &skill.files {
            let target = part.join(&f.path);
            if let Some(parent) = target.parent() {
                std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
            }
            std::fs::copy(dir.join(&f.path), &target).map_err(|e| format!("{}: {e}", f.path))?;
        }
        let target = root.join(folder);
        if target.exists() {
            return Err(format!("{} exists without its record; move it away and try again", target.display()));
        }
        std::fs::rename(&part, &target).map_err(|e| format!("{}: {e}", target.display()))
    })();
    if let Err(e) = copied {
        let _ = std::fs::remove_dir_all(&part);
        return Err(e);
    }
    let time = now();
    let record = Record { app: original.id.clone(), folder: folder.to_string(), base: base_label(&original.source), digests: digests(&dir, &skill.files), created: time, updated: time };
    save_record(&record)?;
    Ok(describe(&record, Some(original)))
}

pub fn read(app: &str, folder: &str, path: &str) -> Result<FileText, String> {
    check(app, folder)?;
    read_record(app, folder).ok_or_else(|| format!("there is no copy of {folder}"))?;
    if path.is_empty() || !Path::new(path).components().all(|c| matches!(c, Component::Normal(_))) {
        return Err(format!("{path:?} is not a path inside the copy"));
    }
    library::read_text(&copy_root(app), &format!("{folder}/{path}"))
}

pub fn write(app: &str, folder: &str, path: &str, text: &str, original: Option<&AppSkills>) -> Result<Edit, String> {
    check(app, folder)?;
    let mut record = read_record(app, folder).ok_or_else(|| format!("there is no copy of {folder}"))?;
    if text.len() > TEXT_LIMIT {
        return Err(format!("{path} would be larger than {TEXT_LIMIT} bytes"));
    }
    let rel = Path::new(path);
    if path.is_empty() || !rel.components().all(|c| matches!(c, Component::Normal(_))) {
        return Err(format!("{path:?} is not a path inside the copy"));
    }
    let base = copy_root(app).join(folder).canonicalize().map_err(|e| e.to_string())?;
    let target = base.join(rel).canonicalize().map_err(|_| format!("{path} is not a file in the copy"))?;
    if !target.starts_with(&base) || !target.is_file() {
        return Err(format!("{path} is not a file in the copy"));
    }
    write_atomic(&target, text.as_bytes())?;
    record.updated = now();
    save_record(&record)?;
    Ok(describe(&record, original))
}

pub fn acknowledge(app: &str, folder: &str, original: &AppSkills) -> Result<Edit, String> {
    check(app, folder)?;
    let mut record = read_record(app, folder).ok_or_else(|| format!("there is no copy of {folder}"))?;
    let (skill, dir) = original_skill(Some(original), folder).ok_or("the original is not available now")?;
    record.digests = digests(&dir, &skill.files);
    record.base = base_label(&original.source);
    save_record(&record)?;
    Ok(describe(&record, Some(original)))
}

pub fn copy_dir(app: &str) -> PathBuf {
    copy_root(app)
}

pub fn adopt(app: &str, folder: &str, base: &str) -> Result<Edit, String> {
    check(app, folder)?;
    if read_record(app, folder).is_some() {
        return Err(format!("{folder} exists already"));
    }
    if !copy_root(app).join(folder).join("SKILL.md").is_file() {
        return Err(format!("{folder} has no SKILL.md"));
    }
    let time = now();
    let record = Record { app: app.to_string(), folder: folder.to_string(), base: base.to_string(), digests: BTreeMap::new(), created: time, updated: time };
    save_record(&record)?;
    Ok(describe(&record, None))
}

pub fn validate(app: &str, folder: &str) -> Result<check::Report, String> {
    check(app, folder)?;
    read_record(app, folder).ok_or_else(|| format!("there is no copy of {folder}"))?;
    Ok(check::validate(&copy_root(app).join(folder), folder))
}

pub fn discard(app: &str, folder: &str) -> Result<(), String> {
    check(app, folder)?;
    read_record(app, folder).ok_or_else(|| format!("there is no copy of {folder}"))?;
    let dir = copy_root(app).join(folder);
    if dir.exists() {
        std::fs::remove_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    }
    std::fs::remove_file(record_path(app, folder)).map_err(|e| e.to_string())
}

pub fn download(app: &str, folder: &str, into: Option<&Path>) -> Result<Saved, String> {
    check(app, folder)?;
    read_record(app, folder).ok_or_else(|| format!("there is no copy of {folder}"))?;
    let root = copy_root(app);
    let skill = skills::index(&root).into_iter().find(|s| s.folder == folder).ok_or_else(|| format!("the copy of {folder} has no SKILL.md"))?;
    let name = if app == crate::own::OWN { folder.to_string() } else { format!("{folder}-edited") };
    pack::zip_skills(&root, &[&skill], &name, into)
}
