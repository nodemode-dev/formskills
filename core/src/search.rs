use serde::Serialize;

use crate::library::AppSkills;

const READ_LIMIT: u64 = 2 * 1024 * 1024;
const SNIPPET: usize = 160;
const MOST: usize = 60;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Hit {
    pub app: String,
    pub folder: String,
    pub name: String,
    pub description: String,
    pub score: u32,
    pub matched: Vec<&'static str>,
    pub path: String,
    pub snippet: String,
}

pub fn words(query: &str) -> Vec<String> {
    let mut found: Vec<String> = Vec::new();
    for raw in query.split_whitespace() {
        let word = raw.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
        if !word.is_empty() && !found.contains(&word) {
            found.push(word);
        }
    }
    found
}

fn starts(hay: &str, word: &str) -> usize {
    hay.match_indices(word).filter(|(at, _)| !hay[..*at].chars().next_back().is_some_and(char::is_alphanumeric)).count()
}

fn body(text: &str) -> &str {
    if !text.starts_with("---") {
        return text;
    }
    let rest = &text[3..];
    match rest.find("\n---") {
        Some(end) => rest[end + 4..].trim_start_matches(['-', '\r', '\n']),
        None => text,
    }
}

fn snippet(line: &str, word: &str) -> String {
    let line = line.trim().trim_start_matches(['#', '-', '*', '>', ' ']);
    let chars: Vec<char> = line.chars().collect();
    if chars.len() <= SNIPPET {
        return line.to_string();
    }
    let lower = line.to_lowercase();
    let at = lower.find(word).map(|b| lower[..b].chars().count()).unwrap_or(0);
    let start = at.saturating_sub(SNIPPET / 3).min(chars.len());
    let end = (start + SNIPPET).min(chars.len());
    let mut out: String = chars[start..end].iter().collect();
    if start > 0 {
        out = format!("...{out}");
    }
    if end < chars.len() {
        out.push_str("...");
    }
    out
}

pub fn search(apps: &[AppSkills], query: &str) -> Vec<Hit> {
    let wanted = words(query);
    if wanted.is_empty() {
        return Vec::new();
    }
    let mut hits = Vec::new();
    for app in apps {
        let Some(root) = app.root.as_deref() else { continue };
        for skill in &app.skills {
            let title = format!("{} {}", skill.name, skill.folder).to_lowercase();
            let about = skill.description.to_lowercase();
            let texts: Vec<(String, String)> = skill
                .files
                .iter()
                .filter(|f| f.path.to_ascii_lowercase().ends_with(".md") && f.bytes <= READ_LIMIT)
                .filter_map(|f| std::fs::read_to_string(root.join(&skill.folder).join(&f.path)).ok().map(|t| (f.path.clone(), body(&t).to_string())))
                .collect();
            let mut score = 0u32;
            let mut matched: Vec<&'static str> = Vec::new();
            let mut first: Option<(String, String)> = None;
            let mut every = true;
            for word in &wanted {
                let mut here = 0u32;
                if starts(&title, word) > 0 {
                    here += 8;
                    if !matched.contains(&"name") {
                        matched.push("name");
                    }
                }
                if starts(&about, word) > 0 {
                    here += 4;
                    if !matched.contains(&"description") {
                        matched.push("description");
                    }
                }
                for (path, text) in &texts {
                    let lower = text.to_lowercase();
                    let count = starts(&lower, word) as u32;
                    if count == 0 {
                        continue;
                    }
                    here += count.min(5);
                    if !matched.contains(&"text") {
                        matched.push("text");
                    }
                    if first.is_none() {
                        if let Some(line) = text.lines().find(|l| starts(&l.to_lowercase(), word) > 0) {
                            first = Some((path.clone(), snippet(line, word)));
                        }
                    }
                }
                if here == 0 {
                    every = false;
                    break;
                }
                score += here;
            }
            if !every {
                continue;
            }
            let (path, snippet) = first.unwrap_or_else(|| ("SKILL.md".to_string(), String::new()));
            hits.push(Hit { app: app.id.clone(), folder: skill.folder.clone(), name: skill.name.clone(), description: skill.description.clone(), score, matched, path, snippet });
        }
    }
    hits.sort_by(|a, b| b.score.cmp(&a.score).then_with(|| a.name.cmp(&b.name)).then_with(|| a.app.cmp(&b.app)));
    hits.truncate(MOST);
    hits
}
