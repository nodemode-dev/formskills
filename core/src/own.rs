use crate::edits::{self, Edit};
use crate::skills::{self, Skill};

pub const OWN: &str = "yours";
pub const BASE: &str = "your own skill";
const PLACEHOLDER: &str = "Says what this skill does and when an agent should use it, with the words a person would use.";

pub fn name_problem(name: &str) -> Option<String> {
    let chars = name.chars().count();
    if chars == 0 || chars > 64 {
        return Some("a skill name has 1 to 64 characters".into());
    }
    if !name.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
        return Some("a skill name holds only lowercase letters, digits and hyphens".into());
    }
    if name.starts_with('-') || name.ends_with('-') || name.contains("--") {
        return Some("a skill name has no hyphen at either end and never two in a row".into());
    }
    if name.contains("anthropic") || name.contains("claude") {
        return Some("Claude refuses skill names holding \"anthropic\" or \"claude\"".into());
    }
    None
}

fn title(name: &str) -> String {
    name.split('-').filter(|w| !w.is_empty()).map(|w| {
        let mut c = w.chars();
        c.next().map(|f| f.to_uppercase().collect::<String>() + c.as_str()).unwrap_or_default()
    }).collect::<Vec<_>>().join(" ")
}

fn one_line(text: &str) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ").replace('\\', "\\\\").replace('"', "'")
}

pub fn template(name: &str, description: &str) -> String {
    let said = one_line(description);
    let said = if said.is_empty() { PLACEHOLDER.to_string() } else { said };
    format!(
        "---\nname: {name}\ndescription: \"{said}\"\n---\n\n# {}\n\nOne paragraph: what this skill is for, and what it is not for.\n\n## When to use\n\n- The person asks for ...\n- The task involves ...\n\n## Steps\n\n1. First ...\n2. Then ...\n3. Check the result by ...\n\n## Examples\n\nInput: ...\n\nOutput: ...\n\n## Notes\n\n- Edge cases and what to do about them.\n- Keep this file under 500 lines; put long reference material in a `references/` file and link it.\n",
        title(name)
    )
}

pub fn create(name: &str, description: &str) -> Result<Edit, String> {
    if let Some(why) = name_problem(name) {
        return Err(why);
    }
    let root = edits::copy_dir(OWN);
    let target = root.join(name);
    if target.exists() {
        return Err(format!("you already have a skill named {name}"));
    }
    let part = root.join(format!(".{name}.part-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&part);
    let made = std::fs::create_dir_all(&part).and_then(|()| std::fs::write(part.join("SKILL.md"), template(name, description))).and_then(|()| std::fs::rename(&part, &target));
    if let Err(e) = made {
        let _ = std::fs::remove_dir_all(&part);
        return Err(format!("{}: {e}", target.display()));
    }
    edits::adopt(OWN, name, BASE)
}

pub fn list() -> Vec<Skill> {
    skills::index(&edits::copy_dir(OWN))
}
