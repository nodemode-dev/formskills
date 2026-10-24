use std::collections::BTreeMap;
use std::path::Path;

use serde::Serialize;

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
    pub files: Vec<SkillFile>,
}

pub fn front_matter(text: &str) -> BTreeMap<String, String> {
    let mut found = BTreeMap::new();
    let mut lines = text.lines();
    if lines.next().map(str::trim) != Some("---") {
        return found;
    }
    let mut block: Option<String> = None;
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
            } else {
                found.insert(key.to_string(), value.trim_matches(|c| c == '"' || c == '\'').to_string());
                block = None;
            }
        } else if let Some(key) = &block {
            if !line.trim().is_empty() {
                let entry = found.entry(key.clone()).or_default();
                *entry = format!("{entry} {}", line.trim()).trim().to_string();
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
            folder,
            files,
        });
    }
    skills
}
