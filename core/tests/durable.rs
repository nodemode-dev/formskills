use std::path::PathBuf;

use formskills_core::durable;

fn scratch(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("formskills-durable-{}-{tag}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn names(dir: &std::path::Path) -> Vec<String> {
    let mut found: Vec<String> = std::fs::read_dir(dir).unwrap().flatten().map(|e| e.file_name().to_string_lossy().into_owned()).collect();
    found.sort();
    found
}

#[test]
fn a_file_is_replaced_whole_and_no_part_is_left() {
    let dir = scratch("replace");
    let target = dir.join("SKILL.md");
    let part = dir.join(".SKILL.md.part");
    std::fs::write(&target, "before").unwrap();
    durable::replace_file(&part, &target, b"after").unwrap();
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "after");
    assert_eq!(names(&dir), vec!["SKILL.md".to_string()]);
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn a_failed_replace_keeps_the_old_file_and_removes_the_part() {
    let dir = scratch("refused");
    let target = dir.join("taken");
    std::fs::create_dir_all(target.join("inside")).unwrap();
    let part = dir.join(".taken.part");
    assert!(durable::replace_file(&part, &target, b"new").is_err());
    assert!(!part.exists());
    assert!(target.join("inside").is_dir());
    let _ = std::fs::remove_dir_all(&dir);
}
