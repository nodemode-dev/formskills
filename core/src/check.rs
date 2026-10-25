use std::path::{Component, Path};

use serde::Serialize;

use crate::skills::{self, SkillFile};

pub const SPEC: &str = "https://agentskills.io/specification";
const NAME_MAX: usize = 64;
const DESCRIPTION_MAX: usize = 1024;
const COMPATIBILITY_MAX: usize = 500;
const SKILL_LINES: usize = 500;
const RESERVED: [&str; 2] = ["anthropic", "claude"];
const READ_LIMIT: u64 = 2 * 1024 * 1024;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Finding {
    pub level: &'static str,
    pub path: String,
    pub rule: &'static str,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Field {
    pub name: &'static str,
    pub required: bool,
    pub set: bool,
    pub chars: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Report {
    pub folder: String,
    pub name: String,
    pub license: String,
    pub fields: Vec<Field>,
    pub errors: usize,
    pub warnings: usize,
    pub findings: Vec<Finding>,
    pub spec: &'static str,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize)]
pub struct Summary {
    pub errors: usize,
    pub warnings: usize,
}

impl Report {
    pub fn summary(&self) -> Summary {
        Summary { errors: self.errors, warnings: self.warnings }
    }
}

fn has_tag(text: &str) -> bool {
    let bytes = text.as_bytes();
    bytes.iter().enumerate().any(|(i, b)| {
        *b == b'<' && bytes.get(i + 1).is_some_and(|n| n.is_ascii_alphabetic() || *n == b'/') && text[i..].contains('>')
    })
}

fn block_closed(text: &str) -> Option<bool> {
    let mut lines = text.lines();
    if lines.next().map(str::trim) != Some("---") {
        return None;
    }
    Some(lines.any(|l| l.trim() == "---"))
}

fn link_targets(text: &str) -> Vec<String> {
    let mut found = Vec::new();
    let mut fenced = false;
    for line in text.lines() {
        if line.trim_start().starts_with("```") {
            fenced = !fenced;
            continue;
        }
        if fenced {
            continue;
        }
        let prose: String = line.split('`').step_by(2).collect::<Vec<_>>().join(" ");
        let mut rest = prose.as_str();
        while let Some(at) = rest.find("](") {
            let after = &rest[at + 2..];
            let Some(end) = after.find(')') else { break };
            let target = after[..end].split_whitespace().next().unwrap_or("").trim_matches(|c| c == '<' || c == '>');
            if !target.is_empty() {
                found.push(target.to_string());
            }
            rest = &after[end..];
        }
    }
    found
}

fn resolve(from: &str, target: &str) -> Option<String> {
    let target = target.split(['#', '?']).next().unwrap_or("");
    if target.is_empty() {
        return Some(String::new());
    }
    let mut parts: Vec<&str> = from.split('/').collect();
    parts.pop();
    for piece in target.split('/') {
        match piece {
            "" | "." => {}
            ".." => {
                parts.pop()?;
            }
            other => parts.push(other),
        }
    }
    Some(parts.join("/"))
}

fn is_outside(target: &str) -> bool {
    let lower = target.to_ascii_lowercase();
    target.starts_with('#') || lower.contains("://") || lower.starts_with("mailto:") || lower.starts_with("tel:")
}

fn name_findings(name: &str, folder: &str, out: &mut Vec<Finding>) {
    let mut error = |rule: &'static str, message: String| out.push(Finding { level: "error", path: "SKILL.md".into(), rule, message });
    if name.is_empty() {
        error("name-required", "the front matter has no name; every skill needs one".into());
        return;
    }
    let chars = name.chars().count();
    if chars > NAME_MAX {
        error("name-length", format!("the name is {chars} characters; at most {NAME_MAX}"));
    }
    if !name.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
        error("name-characters", format!("the name {name:?} may hold only lowercase letters, digits and hyphens"));
    }
    if name.starts_with('-') || name.ends_with('-') {
        error("name-hyphen-ends", format!("the name {name:?} must not start or end with a hyphen"));
    }
    if name.contains("--") {
        error("name-double-hyphen", format!("the name {name:?} must not hold two hyphens in a row"));
    }
    if name != folder {
        error("name-folder", format!("the name {name:?} must match the skill's folder {folder:?}"));
    }
    if has_tag(name) {
        error("name-xml", "the name must not hold XML tags".into());
    }
    let lower = name.to_lowercase();
    for word in RESERVED {
        if lower.contains(word) {
            error("name-reserved", format!("Claude refuses a skill name holding the reserved word {word:?}"));
        }
    }
}

pub fn validate(dir: &Path, folder: &str) -> Report {
    let mut findings = Vec::new();
    let card = std::fs::read_to_string(dir.join("SKILL.md"));
    let text = match &card {
        Ok(text) => text.as_str(),
        Err(_) => {
            findings.push(Finding { level: "error", path: "SKILL.md".into(), rule: "skill-file", message: "there is no readable SKILL.md in this folder".into() });
            ""
        }
    };
    match block_closed(text) {
        None if card.is_ok() => findings.push(Finding { level: "error", path: "SKILL.md".into(), rule: "front-matter", message: "SKILL.md must open with a front matter block: a line of three hyphens, the fields, and a closing line of three hyphens".into() }),
        Some(false) => findings.push(Finding { level: "error", path: "SKILL.md".into(), rule: "front-matter", message: "the front matter block is never closed with a line of three hyphens".into() }),
        _ => {}
    }
    let meta = skills::front_matter(text);
    let get = |key: &str| meta.get(key).map(|v| v.trim().to_string());
    let name = get("name").unwrap_or_default();
    let description = get("description").unwrap_or_default();
    name_findings(&name, folder, &mut findings);
    let description_chars = description.chars().count();
    if description.is_empty() {
        findings.push(Finding { level: "error", path: "SKILL.md".into(), rule: "description-required", message: "the front matter has no description; agents choose skills by it".into() });
    } else {
        if description_chars > DESCRIPTION_MAX {
            findings.push(Finding { level: "error", path: "SKILL.md".into(), rule: "description-length", message: format!("the description is {description_chars} characters; at most {DESCRIPTION_MAX}") });
        }
        if has_tag(&description) {
            findings.push(Finding { level: "error", path: "SKILL.md".into(), rule: "description-xml", message: "the description must not hold XML tags".into() });
        }
    }
    let compatibility = get("compatibility");
    if let Some(value) = &compatibility {
        let chars = value.chars().count();
        if chars == 0 || chars > COMPATIBILITY_MAX {
            findings.push(Finding { level: "error", path: "SKILL.md".into(), rule: "compatibility-length", message: format!("compatibility, when set, holds 1 to {COMPATIBILITY_MAX} characters; it has {chars}") });
        }
    }
    let lines = text.lines().count();
    if lines > SKILL_LINES {
        findings.push(Finding { level: "warning", path: "SKILL.md".into(), rule: "skill-lines", message: format!("SKILL.md is {lines} lines; the format suggests under {SKILL_LINES}, with detail moved to reference files") });
    }
    let mut files: Vec<SkillFile> = Vec::new();
    skills::walk_files(dir, &mut files);
    for file in files.iter().filter(|f| f.path.to_ascii_lowercase().ends_with(".md") && f.bytes <= READ_LIMIT) {
        let Ok(body) = std::fs::read_to_string(dir.join(&file.path)) else { continue };
        for target in link_targets(&body) {
            if is_outside(&target) {
                continue;
            }
            let wanted = resolve(&file.path, &target);
            let inside = wanted.as_deref().is_some_and(|w| Path::new(w).components().all(|c| matches!(c, Component::Normal(_))));
            let found = wanted.as_deref().is_some_and(|w| w.is_empty() || files.iter().any(|f| f.path == w || f.path.starts_with(&format!("{w}/"))));
            if !inside || !found {
                let why = if inside { "is not a file in this skill" } else { "points outside this skill" };
                findings.push(Finding { level: "warning", path: file.path.clone(), rule: "link", message: format!("the link to {target} {why}") });
            }
        }
    }
    let fields = vec![
        Field { name: "name", required: true, set: !name.is_empty(), chars: name.chars().count() },
        Field { name: "description", required: true, set: !description.is_empty(), chars: description_chars },
        Field { name: "license", required: false, set: meta.contains_key("license"), chars: get("license").map(|v| v.chars().count()).unwrap_or(0) },
        Field { name: "compatibility", required: false, set: compatibility.is_some(), chars: compatibility.map(|v| v.chars().count()).unwrap_or(0) },
        Field { name: "metadata", required: false, set: meta.contains_key("metadata"), chars: 0 },
        Field { name: "allowed-tools", required: false, set: meta.contains_key("allowed-tools"), chars: get("allowed-tools").map(|v| v.chars().count()).unwrap_or(0) },
    ];
    let errors = findings.iter().filter(|f| f.level == "error").count();
    let warnings = findings.len() - errors;
    Report { folder: folder.to_string(), name, license: get("license").unwrap_or_default(), fields, errors, warnings, findings, spec: SPEC }
}
