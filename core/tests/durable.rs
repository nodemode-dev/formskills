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

#[test]
fn a_folder_is_swapped_in_and_the_old_one_is_gone() {
    let dir = scratch("swap");
    let target = dir.join("cut-video");
    let part = dir.join(".cut-video.part");
    let aside = dir.join(".cut-video.old");
    std::fs::create_dir_all(&target).unwrap();
    std::fs::write(target.join("SKILL.md"), "old").unwrap();
    std::fs::create_dir_all(&part).unwrap();
    std::fs::write(part.join("SKILL.md"), "new").unwrap();
    durable::replace_dir(&part, &target, &aside).unwrap();
    assert_eq!(std::fs::read_to_string(target.join("SKILL.md")).unwrap(), "new");
    assert_eq!(names(&dir), vec!["cut-video".to_string()]);
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn a_failed_swap_puts_the_old_folder_back() {
    let dir = scratch("swap-failed");
    let target = dir.join("cut-video");
    std::fs::create_dir_all(&target).unwrap();
    std::fs::write(target.join("SKILL.md"), "old").unwrap();
    assert!(durable::replace_dir(&dir.join(".missing.part"), &target, &dir.join(".cut-video.old")).is_err());
    assert_eq!(std::fs::read_to_string(target.join("SKILL.md")).unwrap(), "old");
    assert_eq!(names(&dir), vec!["cut-video".to_string()]);
    let _ = std::fs::remove_dir_all(&dir);
}
