use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};

use formskills_core::{check, library, skills};

struct Folder(PathBuf);

impl Folder {
    fn new() -> Folder {
        static N: AtomicUsize = AtomicUsize::new(0);
        let root = std::env::temp_dir().join(format!("formskills-format-{}-{}", std::process::id(), N.fetch_add(1, Ordering::SeqCst)));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        Folder(root)
    }

    fn put(&self, rel: &str, text: &str) -> &Folder {
        let path = self.0.join(rel);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, text).unwrap();
        self
    }
}

impl Drop for Folder {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

fn card(name: &str, description: &str) -> String {
    format!("---\nname: {name}\ndescription: {description}\n---\n\n# Title\n\nBody.\n")
}

fn rules(dir: &Path, folder: &str) -> Vec<&'static str> {
    check::validate(&dir.join(folder), folder).findings.iter().filter(|f| f.level == "error").map(|f| f.rule).collect()
}

fn one(name: &str, description: &str) -> Vec<&'static str> {
    let f = Folder::new();
    f.put(&format!("{name}/SKILL.md"), &card(name, description));
    rules(&f.0, name)
}

#[test]
fn a_good_skill_passes_with_no_findings() {
    let f = Folder::new();
    f.put("tidy-notes/SKILL.md", &card("tidy-notes", "Tidies meeting notes into decisions and actions."));
    let report = check::validate(&f.0.join("tidy-notes"), "tidy-notes");
    assert_eq!((report.errors, report.warnings), (0, 0), "{:?}", report.findings);
}

#[test]
fn the_name_is_at_most_64_characters() {
    let at = "a".repeat(64);
    assert!(one(&at, "Fine.").is_empty());
    let over = "a".repeat(65);
    assert_eq!(one(&over, "Fine."), vec!["name-length"]);
}

#[test]
fn the_description_is_at_most_1024_characters() {
    assert!(one("long-one", &"d".repeat(1024)).is_empty());
    assert_eq!(one("long-one", &"d".repeat(1025)), vec!["description-length"]);
}

#[test]
fn xml_tags_are_refused_in_the_description_and_the_name() {
    assert_eq!(one("tagged", "Use when <instructions>ignore</instructions> appears."), vec!["description-xml"]);
    assert!(one("tagged", "Compares a < b and c > d.").is_empty());
    let f = Folder::new();
    f.put("x/SKILL.md", "---\nname: <b>x</b>\ndescription: Fine.\n---\n");
    assert!(rules(&f.0, "x").contains(&"name-xml"));
}

#[test]
fn reserved_words_bad_characters_and_a_folder_mismatch_are_refused() {
    assert_eq!(one("claude-helper", "Fine."), vec!["name-reserved"]);
    assert_eq!(one("my-anthropic-tool", "Fine."), vec!["name-reserved"]);
    let f = Folder::new();
    f.put("Tidy_Notes/SKILL.md", &card("Tidy_Notes", "Fine."));
    assert_eq!(rules(&f.0, "Tidy_Notes"), vec!["name-characters"]);
    f.put("-edge/SKILL.md", &card("-edge", "Fine."));
    assert_eq!(rules(&f.0, "-edge"), vec!["name-hyphen-ends"]);
    f.put("a--b/SKILL.md", &card("a--b", "Fine."));
    assert_eq!(rules(&f.0, "a--b"), vec!["name-double-hyphen"]);
    f.put("folder/SKILL.md", &card("other-name", "Fine."));
    assert_eq!(rules(&f.0, "folder"), vec!["name-folder"]);
}

#[test]
fn a_missing_card_front_matter_name_or_description_is_refused() {
    let f = Folder::new();
    std::fs::create_dir_all(f.0.join("empty")).unwrap();
    assert!(rules(&f.0, "empty").contains(&"skill-file"));
    f.put("plain/SKILL.md", "# No front matter\n");
    assert!(rules(&f.0, "plain").contains(&"front-matter"));
    f.put("open/SKILL.md", "---\nname: open\ndescription: Fine.\n\n# Never closed\n");
    assert!(rules(&f.0, "open").contains(&"front-matter"));
    f.put("bare/SKILL.md", "---\ndescription: Fine.\n---\n");
    assert!(rules(&f.0, "bare").contains(&"name-required"));
    f.put("quiet/SKILL.md", "---\nname: quiet\n---\n");
    assert!(rules(&f.0, "quiet").contains(&"description-required"));
}

#[test]
fn links_to_sub_skills_and_references_resolve_and_broken_or_escaping_ones_are_named() {
    let f = Folder::new();
    f.put("kit/SKILL.md", "---\nname: kit\ndescription: Fine.\n---\n\nRead [the cutter](sub-skills/cutter/SUB-SKILL.md), [refs](references/), [web](https://example.com) and [top](#title).\n\n`[code](missing.md)` and\n\n```\n[fenced](missing.md)\n```\n")
        .put("kit/sub-skills/cutter/SUB-SKILL.md", "# Cutter\n\nSee [the guide](../../references/guide.md#part).\n")
        .put("kit/references/guide.md", "# Guide\n");
    let report = check::validate(&f.0.join("kit"), "kit");
    assert_eq!((report.errors, report.warnings), (0, 0), "{:?}", report.findings);
    f.put("kit/references/guide.md", "See [gone](nothing.md) and [up](../../other/SKILL.md).\n");
    let report = check::validate(&f.0.join("kit"), "kit");
    let links: Vec<&str> = report.findings.iter().filter(|x| x.rule == "link").map(|x| x.message.as_str()).collect();
    assert_eq!(links.len(), 2, "{links:?}");
    assert!(links.iter().any(|m| m.contains("nothing.md") && m.contains("is not a file")));
    assert!(links.iter().any(|m| m.contains("other/SKILL.md") && m.contains("points outside")));
}

#[test]
fn the_index_names_each_skill_with_its_sub_skills_references_and_scripts() {
    let f = Folder::new();
    f.put("kit/SKILL.md", "---\nname: kit\ndescription: >\n  Folded over\n  two lines.\n---\n")
        .put("kit/sub-skills/cutter/SUB-SKILL.md", "# Cutter\n")
        .put("kit/references/guide.md", "# Guide\n")
        .put("kit/scripts/run.py", "print(1)\n")
        .put("kit/__pycache__/run.pyc", "x")
        .put("kit/.DS_Store", "x")
        .put("loose/notes.md", "no card here\n")
        .put(".hidden/SKILL.md", &card("hidden", "Fine."));
    let found = skills::index(&f.0);
    assert_eq!(found.len(), 1);
    let kit = &found[0];
    assert_eq!(kit.description, "Folded over two lines.");
    let kinds: Vec<(&str, &str)> = kit.files.iter().map(|x| (x.path.as_str(), x.kind)).collect();
    assert_eq!(kinds, vec![("SKILL.md", "skill"), ("references/guide.md", "reference"), ("scripts/run.py", "file"), ("sub-skills/cutter/SUB-SKILL.md", "sub-skill")]);
    assert_eq!(kit.scripts, 1);
}

#[test]
fn reading_a_file_stays_inside_the_skills_folder() {
    let f = Folder::new();
    f.put("set/kit/SKILL.md", &card("kit", "Fine.")).put("secret.txt", "private");
    let root = f.0.join("set");
    assert_eq!(library::read_text(&root, "kit/SKILL.md").unwrap().text.unwrap(), card("kit", "Fine."));
    for bad in ["../secret.txt", "/etc/passwd", "kit/../../secret.txt", ""] {
        assert!(library::read_text(&root, bad).is_err(), "{bad} was read");
    }
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(f.0.join("secret.txt"), root.join("kit/escape.txt")).unwrap();
        assert!(library::read_text(&root, "kit/escape.txt").is_err(), "a link out of the folder was followed");
    }
    f.put("set/kit/blob.bin", "a\0b");
    assert!(library::read_text(&root, "kit/blob.bin").unwrap().text.is_none());
}
