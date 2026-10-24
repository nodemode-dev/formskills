use std::path::PathBuf;

use serde::Serialize;

use crate::apps::{App, Apps};
use crate::catalog::{self, Catalogue};
use crate::fetch;
use crate::places::{dev_mode, dev_roots};
use crate::skills::{self, Skill};

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Source {
    Release { channel: String, version: String, downloaded: bool },
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
}

#[derive(Debug, Clone, Serialize)]
pub struct Library {
    pub catalogue: String,
    pub dev: bool,
    pub dev_roots: Vec<String>,
    pub apps: Vec<AppSkills>,
}

pub fn checkout(app: &App) -> Option<PathBuf> {
    dev_roots().into_iter().map(|root| root.join(&app.app).join(&app.skills)).find(|p| p.is_dir())
}

fn from_release(app: &App, catalogue: &Catalogue, refresh: bool) -> (Source, Option<PathBuf>) {
    let kept_or = |reason: String| match fetch::kept(&app.id) {
        Some(k) => (Source::Kept { channel: k.record.channel, version: k.record.version, reason }, Some(k.dir.join("skills"))),
        None => (Source::Missing { reason }, None),
    };
    if !catalogue.used {
        return kept_or(catalogue.note.clone());
    }
    let Some(released) = catalogue.released.get(&app.id) else {
        return kept_or("the catalogue has no release of this app yet".to_string());
    };
    let Some(asset) = &released.skills else {
        return kept_or(format!("its release {} carries no skills asset", released.version));
    };
    match fetch::ensure(&app.id, &released.channel, &released.version, asset, refresh) {
        Ok((kept, downloaded)) => (Source::Release { channel: released.channel.clone(), version: released.version.clone(), downloaded }, Some(kept.dir.join("skills"))),
        Err(why) => kept_or(why),
    }
}

pub fn load(apps: &Apps, only: Option<&str>, refresh: bool) -> Library {
    let dev = dev_mode();
    let chosen: Vec<&App> = apps.apps.iter().filter(|a| only.is_none_or(|o| apps.get(o).is_some_and(|m| m.id == a.id))).collect();
    let need_catalogue = chosen.iter().any(|a| !dev || checkout(a).is_none());
    let catalogue = if need_catalogue { catalog::load() } else { Catalogue { note: "not read: every app came from a checkout".to_string(), ..Default::default() } };
    let found = chosen
        .into_iter()
        .map(|app| {
            let (source, root) = match (dev, checkout(app)) {
                (true, Some(path)) => (Source::Dev { path: path.display().to_string() }, Some(path)),
                _ => from_release(app, &catalogue, refresh),
            };
            let skills = root.as_deref().map(skills::index).unwrap_or_default();
            AppSkills { id: app.id.clone(), source, root, skills }
        })
        .collect();
    Library { catalogue: catalogue.note, dev, dev_roots: dev_roots().iter().map(|p| p.display().to_string()).collect(), apps: found }
}
