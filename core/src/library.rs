use std::path::{Component, Path, PathBuf};

use serde::Serialize;

use crate::apps::{App, Apps};
use crate::catalog::{self, Catalogue};
use crate::fetch;
use crate::pins;
use crate::places::{dev_mode, dev_roots};
use crate::skills::{self, Skill};

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Source {
    Release { channel: String, version: String, downloaded: bool, pinned: bool, latest: String },
    Kept { channel: String, version: String, reason: String },
    Dev { path: String },
    Missing { reason: String },
}

#[derive(Debug, Clone, Serialize)]
pub struct AppSkills {
    pub id: String,
    pub source: Source,
    #[serde(skip)]
    pub root: Option<PathBuf>,
    pub skills: Vec<Skill>,
    pub releases: Vec<String>,
    pub pin: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Library {
    pub catalogue: String,
    pub dev: bool,
    pub dev_roots: Vec<String>,
    pub apps: Vec<AppSkills>,
}

const TEXT_LIMIT: u64 = 2 * 1024 * 1024;

#[derive(Debug, Clone, Serialize)]
pub struct FileText {
    pub path: String,
    pub bytes: u64,
    pub text: Option<String>,
    pub note: Option<String>,
}

pub fn read_text(root: &Path, rel: &str) -> Result<FileText, String> {
    let wanted = Path::new(rel);
    if rel.is_empty() || !wanted.components().all(|c| matches!(c, Component::Normal(_))) {
        return Err(format!("{rel:?} is not a path inside the skills folder"));
    }
    let base = root.canonicalize().map_err(|e| format!("{}: {e}", root.display()))?;
    let full = base.join(wanted).canonicalize().map_err(|_| format!("{rel} is not in these skills"))?;
    if !full.starts_with(&base) || !full.is_file() {
        return Err(format!("{rel} is not a file in these skills"));
    }
    let bytes = full.metadata().map(|m| m.len()).unwrap_or(0);
    if bytes > TEXT_LIMIT {
        return Ok(FileText { path: rel.to_string(), bytes, text: None, note: Some(format!("{bytes} bytes, too large to show here; download the skill to open it")) });
    }
    let raw = std::fs::read(&full).map_err(|e| format!("{rel}: {e}"))?;
    match String::from_utf8(raw) {
        Ok(text) if !text.contains('\0') => Ok(FileText { path: rel.to_string(), bytes, text: Some(text), note: None }),
        _ => Ok(FileText { path: rel.to_string(), bytes, text: None, note: Some(format!("{bytes} bytes, not text; download the skill to open it")) }),
    }
}

pub fn checkout(app: &App) -> Option<PathBuf> {
    dev_roots().into_iter().map(|root| root.join(&app.app).join(&app.skills)).find(|p| p.is_dir())
}

fn from_release(app: &App, catalogue: &Catalogue, refresh: bool, pin: Option<&String>) -> (Source, Option<PathBuf>, Vec<String>) {
    let kept_or = |reason: String, releases: Vec<String>| match fetch::kept(&app.id) {
        Some(k) => (Source::Kept { channel: k.record.channel, version: k.record.version, reason }, Some(k.dir.join("skills")), releases),
        None => (Source::Missing { reason }, None, releases),
    };
    if !catalogue.used {
        return kept_or(catalogue.note.clone(), Vec::new());
    }
    let Some(released) = catalogue.released.get(&app.id) else {
        return kept_or("the catalogue has no release of this app yet".to_string(), Vec::new());
    };
    let mut releases: Vec<String> = released.skills.iter().map(|_| released.version.clone()).collect();
    releases.extend(released.history.iter().filter(|o| o.skills.is_some()).map(|o| o.version.clone()));
    let (version, asset) = match pin {
        Some(wanted) if wanted != &released.version => match released.history.iter().find(|o| &o.version == wanted).and_then(|o| o.skills.as_ref()) {
            Some(asset) => (wanted.clone(), asset),
            None => return kept_or(format!("pinned to {wanted}, which the catalogue no longer lists with skills; unpin to follow the latest ({})", released.version), releases),
        },
        _ => match &released.skills {
            Some(asset) => (released.version.clone(), asset),
            None => return kept_or(format!("its release {} carries no skills asset", released.version), releases),
        },
    };
    match fetch::ensure(&app.id, &released.channel, &version, asset, refresh) {
        Ok((kept, downloaded)) => (
            Source::Release { channel: released.channel.clone(), version, downloaded, pinned: pin.is_some(), latest: released.version.clone() },
            Some(kept.dir.join("skills")),
            releases,
        ),
        Err(why) => kept_or(why, releases),
    }
}

pub fn load(apps: &Apps, only: Option<&str>, refresh: bool) -> Library {
    let dev = dev_mode();
    let chosen: Vec<&App> = apps.apps.iter().filter(|a| only.is_none_or(|o| apps.get(o).is_some_and(|m| m.id == a.id))).collect();
    let need_catalogue = chosen.iter().any(|a| !dev || checkout(a).is_none());
    let catalogue = if need_catalogue { catalog::load() } else { Catalogue { note: "not read: every app came from a checkout".to_string(), ..Default::default() } };
    let pins = pins::load();
    let found = chosen
        .into_iter()
        .map(|app| {
            let pin = pins.get(&app.id);
            let (source, root, releases) = match (dev, checkout(app)) {
                (true, Some(path)) => (Source::Dev { path: path.display().to_string() }, Some(path), Vec::new()),
                _ => from_release(app, &catalogue, refresh, pin),
            };
            let skills = root.as_deref().map(skills::index).unwrap_or_default();
            AppSkills { id: app.id.clone(), source, root, skills, releases, pin: pin.cloned() }
        })
        .collect();
    Library { catalogue: catalogue.note, dev, dev_roots: dev_roots().iter().map(|p| p.display().to_string()).collect(), apps: found }
}
