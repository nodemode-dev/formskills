use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::edits;
use crate::fetch::{hex_sha256, plain};
use crate::library::{AppSkills, Source};
use crate::own::OWN;
use crate::places::{data_dir, home};
use crate::skills::{self, SkillFile};

pub const AGENTS: [&str; 3] = ["claude", "codex", "cursor"];

pub fn agent_label(agent: &str) -> &'static str {
    match agent {
        "claude" => "Claude Code",
        "codex" => "Codex",
        "cursor" => "Cursor",
        _ => "an unknown agent",
    }
}

fn agent_dir(agent: &str) -> Option<&'static str> {
    match agent {
        "claude" => Some(".claude/skills"),
        "codex" => Some(".agents/skills"),
        "cursor" => Some(".cursor/skills"),
        _ => None,
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Target {
    pub agent: String,
    #[serde(default)]
    pub project: Option<String>,
}

impl Target {
    pub fn new(agent: &str, project: Option<&str>) -> Result<Target, String> {
        if agent_dir(agent).is_none() {
            return Err(format!("there is no agent {agent:?}; use claude, codex or cursor"));
        }
        let project = match project.map(str::trim).filter(|p| !p.is_empty()) {
            None => None,
            Some(path) => {
                let dir = Path::new(path).canonicalize().map_err(|e| format!("{path}: {e}"))?;
                if !dir.is_dir() {
                    return Err(format!("{path} is not a folder"));
                }
                let mine = home().canonicalize().unwrap_or_else(|_| home());
                if dir == mine { None } else { Some(dir.display().to_string()) }
            }
        };
        Ok(Target { agent: agent.to_string(), project })
    }

    pub fn root(&self) -> Result<PathBuf, String> {
        let sub = agent_dir(&self.agent).ok_or_else(|| format!("there is no agent {:?}", self.agent))?;
        let base = match &self.project {
            Some(p) => PathBuf::from(p),
            None => home(),
        };
        Ok(base.join(sub))
    }

    pub fn describe(&self) -> String {
        match &self.project {
            Some(p) => format!("{} in {p}", agent_label(&self.agent)),
            None => format!("{} for you", agent_label(&self.agent)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Origin {
    pub kind: String,
    pub app: String,
    pub version: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Record {
    pub target: Target,
    pub folder: String,
    pub origin: Origin,
    pub digests: BTreeMap<String, String>,
    pub installed: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct State {
    #[serde(flatten)]
    pub record: Record,
    pub path: String,
    #[serde(rename = "where")]
    pub where_: String,
    pub state: &'static str,
    pub changed: Vec<String>,
    pub update: Option<String>,
}

fn records_path() -> PathBuf {
    data_dir().join("installed.json")
}

fn load() -> Result<Vec<Record>, String> {
    let file = records_path();
    match std::fs::read(&file) {
        Ok(bytes) => serde_json::from_slice(&bytes).map_err(|e| format!("{} cannot be read ({e}); formskills changes no install until it is repaired or moved away", file.display())),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Vec::new()),
        Err(e) => Err(format!("{}: {e}", file.display())),
    }
}

fn save(records: &[Record]) -> Result<(), String> {
    let file = records_path();
    if let Some(parent) = file.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
    }
    let part = file.with_extension(format!("part-{}", std::process::id()));
    let json = serde_json::to_vec_pretty(records).map_err(|e| e.to_string())?;
    if let Err(e) = crate::durable::replace_file(&part, &file, &json) {
        return Err(format!("{}: {e}", file.display()));
    }
    Ok(())
}

fn now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn files_of(dir: &Path) -> Vec<SkillFile> {
    let mut files = Vec::new();
    skills::walk_files(dir, &mut files);
    files
}

fn digests_of(dir: &Path) -> BTreeMap<String, String> {
    files_of(dir).into_iter().filter_map(|f| std::fs::read(dir.join(&f.path)).ok().map(|b| (f.path, hex_sha256(&b)))).collect()
}

fn state_of(record: &Record) -> State {
    let path = record.target.root().map(|r| r.join(&record.folder)).unwrap_or_default();
    let (state, changed) = if !path.join("SKILL.md").is_file() {
        ("missing", Vec::new())
    } else {
        let now = digests_of(&path);
        let mut changed: Vec<String> = now.iter().filter(|(p, d)| record.digests.get(*p) != Some(*d)).map(|(p, _)| p.clone()).collect();
        changed.extend(record.digests.keys().filter(|p| !now.contains_key(*p)).cloned());
        changed.sort();
        changed.dedup();
        (if changed.is_empty() { "ok" } else { "modified" }, changed)
    };
    State { record: record.clone(), path: path.display().to_string(), where_: record.target.describe(), state, changed, update: None }
}

pub fn source(library: &[AppSkills], app: &str, folder: &str, copy: bool) -> Result<(PathBuf, Origin), String> {
    if !plain(app) || !plain(folder) {
        return Err(format!("{app}/{folder} is not a skill formskills knows"));
    }
    if app == OWN || copy {
        let edit = edits::get(app, folder, library.iter().find(|a| a.id == app)).map_err(|_| format!("there is no {} {folder}", if app == OWN { "skill of yours named" } else { "copy of" }))?;
        let kind = if app == OWN { "own" } else { "copy" };
        return Ok((edits::copy_dir(app).join(folder), Origin { kind: kind.into(), app: app.into(), version: edit.base }));
    }
    let found = library.iter().find(|a| a.id == app).ok_or_else(|| format!("{app} is not in the library"))?;
    if !found.skills.iter().any(|s| s.folder == folder) {
        return Err(format!("{app} has no skill {folder:?}"));
    }
    let root = found.root.as_ref().ok_or("this app has no skills here")?;
    let (kind, version) = match &found.source {
        Source::Release { version, .. } | Source::Kept { version, .. } => ("release", version.clone()),
        Source::Dev { .. } => ("checkout", String::new()),
        Source::Missing { reason } => return Err(reason.clone()),
    };
    Ok((root.join(folder), Origin { kind: kind.into(), app: app.into(), version }))
}

fn copy_into(from: &Path, part: &Path) -> Result<(), String> {
    for f in files_of(from) {
        let target = part.join(&f.path);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
        }
        std::fs::copy(from.join(&f.path), &target).map_err(|e| format!("{}: {e}", f.path))?;
    }
    Ok(())
}

pub fn install(from: &Path, folder: &str, origin: Origin, target: &Target, force: bool) -> Result<State, String> {
    if !plain(folder) {
        return Err(format!("{folder:?} is not a folder name formskills will write"));
    }
    if !from.join("SKILL.md").is_file() {
        return Err(format!("{} has no SKILL.md", from.display()));
    }
    let root = target.root()?;
    let dest = root.join(folder);
    let mut records = load()?;
    let mine = records.iter().position(|r| r.target == *target && r.folder == folder);
    if let Ok(meta) = std::fs::symlink_metadata(&dest) {
        match mine {
            _ if meta.file_type().is_symlink() => return Err(format!("{} is a link formskills did not make; it is left alone", dest.display())),
            None => return Err(format!("{} is already there and formskills did not install it; it is left alone (remove or rename it yourself to install here)", dest.display())),
            Some(i) => {
                let now = state_of(&records[i]);
                if now.state == "modified" && !force {
                    return Err(format!("{} was changed since formskills installed it ({}); install again with force to replace your changes", dest.display(), now.changed.join(", ")));
                }
            }
        }
    }
    std::fs::create_dir_all(&root).map_err(|e| format!("{}: {e}", root.display()))?;
    let part = root.join(format!(".{folder}.formskills-part-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&part);
    if let Err(e) = copy_into(from, &part) {
        let _ = std::fs::remove_dir_all(&part);
        return Err(e);
    }
    let aside = root.join(format!(".{folder}.formskills-old-{}", std::process::id()));
    if let Err(e) = crate::durable::replace_dir(&part, &dest, &aside) {
        let _ = std::fs::remove_dir_all(&part);
        return Err(format!("{}: {e}", dest.display()));
    }
    let record = Record { target: target.clone(), folder: folder.to_string(), origin, digests: digests_of(&dest), installed: now() };
    match mine {
        Some(i) => records[i] = record.clone(),
        None => records.push(record.clone()),
    }
    save(&records)?;
    Ok(state_of(&record))
}

pub fn uninstall(target: &Target, folder: &str, force: bool) -> Result<(), String> {
    let mut records = load()?;
    let i = records.iter().position(|r| r.target == *target && r.folder == folder).ok_or_else(|| format!("formskills did not install {folder} for {}; nothing was removed", target.describe()))?;
    let now = state_of(&records[i]);
    if now.state == "modified" && !force {
        return Err(format!("{} was changed since formskills installed it ({}); remove it with force to delete your changes too", now.path, now.changed.join(", ")));
    }
    let dest = PathBuf::from(&now.path);
    if std::fs::symlink_metadata(&dest).is_ok_and(|m| m.file_type().is_symlink()) {
        return Err(format!("{} is now a link; it is left alone", dest.display()));
    }
    if dest.exists() {
        std::fs::remove_dir_all(&dest).map_err(|e| format!("{}: {e}", dest.display()))?;
    }
    records.remove(i);
    save(&records)
}

#[derive(Debug, Clone, Serialize)]
pub struct Outcome {
    pub folder: String,
    #[serde(rename = "where")]
    pub where_: String,
    pub path: Option<String>,
    pub error: Option<String>,
}

pub fn install_many(library: &[AppSkills], app: &str, skill: Option<&str>, copy: bool, agents: &[String], project: Option<&str>, force: bool) -> Result<Vec<Outcome>, String> {
    let folders: Vec<String> = match skill {
        Some(f) => vec![f.to_string()],
        None => library.iter().find(|a| a.id == app).map(|a| a.skills.iter().map(|s| s.folder.clone()).collect()).unwrap_or_default(),
    };
    if folders.is_empty() {
        return Err("there are no skills to install".into());
    }
    if agents.is_empty() {
        return Err("choose at least one agent".into());
    }
    let mut out = Vec::new();
    for agent in agents {
        let target = Target::new(agent, project)?;
        for folder in &folders {
            match source(library, app, folder, copy).and_then(|(from, origin)| install(&from, folder, origin, &target, force)) {
                Ok(state) => out.push(Outcome { folder: folder.clone(), where_: state.where_, path: Some(state.path), error: None }),
                Err(e) => out.push(Outcome { folder: folder.clone(), where_: target.describe(), path: None, error: Some(e) }),
            }
        }
    }
    Ok(out)
}

pub fn update(library: &[AppSkills], target: &Target, folder: &str) -> Result<State, String> {
    let record = load()?.into_iter().find(|r| r.target == *target && r.folder == folder).ok_or_else(|| format!("formskills did not install {folder} for {}", target.describe()))?;
    let copy = record.origin.kind == "copy";
    let (from, origin) = source(library, &record.origin.app, folder, copy)?;
    install(&from, folder, origin, target, false)
}

pub fn list(library: Option<&[AppSkills]>) -> Vec<State> {
    let mut found: Vec<State> = load().unwrap_or_default().iter().map(state_of).collect();
    if let Some(apps) = library {
        for s in &mut found {
            if s.record.origin.kind != "release" {
                continue;
            }
            let Some(app) = apps.iter().find(|a| a.id == s.record.origin.app) else { continue };
            if let Source::Release { version, .. } = &app.source {
                if version != &s.record.origin.version && app.skills.iter().any(|k| k.folder == s.record.folder) {
                    s.update = Some(version.clone());
                }
            }
        }
    }
    found.sort_by(|a, b| a.record.target.agent.cmp(&b.record.target.agent).then_with(|| a.record.target.project.cmp(&b.record.target.project)).then_with(|| a.record.folder.cmp(&b.record.folder)));
    found
}
