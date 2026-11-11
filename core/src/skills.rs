use std::collections::BTreeMap;
use std::path::Path;

use serde::Serialize;

use crate::check::{self, Summary};

const SKIP_DIRS: [&str; 3] = ["__pycache__", "node_modules", ".git"];
const SKIP_FILES: [&str; 2] = [".DS_Store", "Thumbs.db"];

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SkillFile {
    pub path: String,
    pub bytes: u64,
    pub kind: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Skill {
    pub folder: String,
    pub name: String,
    pub description: String,
    pub license: String,
    pub check: Summary,
    pub scripts: usize,
    pub files: Vec<SkillFile>,
}

const SCRIPT_ENDINGS: [&str; 12] = [".py", ".sh", ".bash", ".zsh", ".js", ".mjs", ".ts", ".ps1", ".bat", ".cmd", ".rb", ".pl"];

pub fn is_script(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    SCRIPT_ENDINGS.iter().any(|e| lower.ends_with(e))
}

fn scalar(raw: &str) -> String {
    let raw = raw.trim();
    if raw.len() >= 2 && raw.starts_with('"') && raw.ends_with('"') && raw[1..raw.len() - 1].chars().rev().take_while(|c| *c == '\\').count() % 2 == 0 {
        let mut out = String::new();
        let mut chars = raw[1..raw.len() - 1].chars();
        while let Some(c) = chars.next() {
            match (c, chars.clone().next()) {
                ('\\', Some(next @ ('"' | '\\'))) => {
                    out.push(next);
                    chars.next();
                }
                _ => out.push(c),
            }
        }
        return out;
    }
    if raw.len() >= 2 && raw.starts_with('\'') && raw.ends_with('\'') {
        return raw[1..raw.len() - 1].replace("''", "'");
    }
    if raw.starts_with('#') {
        return String::new();
    }
    match raw.find(" #").or_else(|| raw.find("\t#")) {
        Some(at) => scalar(&raw[..at]),
        None => raw.to_string(),
    }
}

pub fn front_matter(text: &str) -> BTreeMap<String, String> {
    let mut found = BTreeMap::new();
    let mut lines = text.lines();
    if lines.next().map(str::trim) != Some("---") {
        return found;
    }
    let mut block: Option<String> = None;
    let mut raw: Option<String> = None;
    for line in lines {
        if line.trim() == "---" {
            break;
        }
        let starts_key = line.chars().next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_');
        let split = line.split_once(':').filter(|(k, _)| starts_key && k.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-'));
        if let Some((key, value)) = split {
            let value = value.trim();
            if matches!(value, ">" | "|" | ">-" | "|-" | ">+" | "|+") {
                found.insert(key.to_string(), String::new());
                block = Some(key.to_string());
                raw = None;
            } else {
                found.insert(key.to_string(), scalar(value));
                block = Some(key.to_string());
                raw = Some(value.to_string());
            }
        } else if let Some(key) = &block {
            let text = line.trim();
            if !text.is_empty() {
                let entry = found.entry(key.clone()).or_default();
                match raw.as_mut() {
                    Some(_) if text.starts_with('#') || !line.starts_with([' ', '\t']) => {}
                    Some(joined) if joined.is_empty() && (text == "-" || text.starts_with("- ") || text.split_once(':').is_some_and(|(k, v)| !k.is_empty() && k.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') && (v.is_empty() || v.starts_with(' ')))) => block = None,
                    Some(joined) => {
                        *joined = format!("{joined} {text}").trim().to_string();
                        *entry = scalar(joined);
                    }
                    None => *entry = format!("{entry} {text}").trim().to_string(),
                }
            }
        }
    }
    found
}

fn kind_of(path: &str) -> &'static str {
    let name = path.rsplit('/').next().unwrap_or(path);
    if path == "SKILL.md" {
        "skill"
    } else if name == "SUB-SKILL.md" || name == "SKILL.md" {
        "sub-skill"
    } else if name.to_ascii_lowercase().ends_with(".md") {
        "reference"
    } else {
        "file"
    }
}

fn walk(dir: &Path, prefix: &str, files: &mut Vec<SkillFile>) {
    let Ok(read) = std::fs::read_dir(dir) else { return };
    let mut entries: Vec<_> = read.flatten().collect();
    entries.sort_by_key(|e| e.file_name());
    for entry in entries {
        let name = entry.file_name().to_string_lossy().to_string();
        let Ok(kind) = entry.file_type() else { continue };
        if kind.is_symlink() {
            continue;
        }
        let rel = if prefix.is_empty() { name.clone() } else { format!("{prefix}/{name}") };
        if kind.is_dir() {
            if !SKIP_DIRS.contains(&name.as_str()) {
                walk(&entry.path(), &rel, files);
            }
        } else if kind.is_file() && !SKIP_FILES.contains(&name.as_str()) && !name.ends_with(".pyc") {
            let bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
            files.push(SkillFile { kind: kind_of(&rel), path: rel, bytes });
        }
    }
}

pub fn walk_files(dir: &Path, files: &mut Vec<SkillFile>) {
    walk(dir, "", files);
}

pub fn index(root: &Path) -> Vec<Skill> {
    let Ok(read) = std::fs::read_dir(root) else { return Vec::new() };
    let mut folders: Vec<_> = read.flatten().filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false)).map(|e| e.file_name().to_string_lossy().to_string()).filter(|n| !n.starts_with('.')).collect();
    folders.sort();
    let mut skills = Vec::new();
    for folder in folders {
        let dir = root.join(&folder);
        let Ok(card) = std::fs::read_to_string(dir.join("SKILL.md")) else { continue };
        let meta = front_matter(&card);
        let mut files = Vec::new();
        walk(&dir, "", &mut files);
        skills.push(Skill {
            name: meta.get("name").filter(|n| !n.is_empty()).cloned().unwrap_or_else(|| folder.clone()),
            description: meta.get("description").cloned().unwrap_or_default(),
            license: meta.get("license").cloned().unwrap_or_default(),
            check: check::validate(&dir, &folder).summary(),
            scripts: files.iter().filter(|f| is_script(&f.path)).count(),
            folder,
            files,
        });
    }
    skills
}
