use formskills_core::Apps;
use std::collections::HashSet;

#[test]
fn the_bundled_list_names_its_repository_and_no_commit() {
    let apps = Apps::bundled().expect("the bundled list loads");
    assert_eq!(apps.source.repository, "nodemode-dev/formcompiler");
    let raw: serde_json::Value = serde_json::from_str(include_str!("../data/apps.json")).expect("valid json");
    assert!(raw["source"].get("commit").is_none(), "formcompiler's HEAD must not be recorded");
    assert_eq!(apps.describe_source(), "bundled list from nodemode-dev/formcompiler");
}

#[test]
fn every_listed_app_has_a_skills_folder_a_topic_from_the_list_and_a_public_repository() {
    let apps = Apps::bundled().expect("the bundled list loads");
    let mut seen = HashSet::new();
    for app in &apps.apps {
        assert!(seen.insert(app.id.clone()), "{} is listed twice", app.id);
        assert!(!app.skills.is_empty(), "{} has no skills folder", app.id);
        assert!(apps.topics.contains(&app.topic), "{} has topic {:?} that is not in the topic list", app.id, app.topic);
        assert!(app.repository.starts_with("https://github.com/nodemode-dev/"), "{}", app.repository);
    }
}

fn repo() -> std::path::PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("..").canonicalize().expect("repository root")
}

fn generator(root: &std::path::Path, args: &[&std::ffi::OsStr]) -> Option<(i32, String)> {
    let out = std::process::Command::new("python3").arg("-I").arg(root.join("setup/apps.py")).args(args).output().ok()?;
    Some((out.status.code().unwrap_or(-1), String::from_utf8_lossy(&out.stdout).to_string()))
}

#[test]
fn the_committed_list_is_in_step_with_the_committed_spec_copy() {
    let root = repo();
    let spec = root.join("setup/family.spec.json");
    let Some((code, out)) = generator(&root, &["--family".as_ref(), spec.as_os_str(), "--check".as_ref()]) else { return };
    assert_eq!((code, out.trim()), (0, "apps: in step"));
}

#[test]
fn the_generator_keeps_the_spec_copy_only_when_the_list_changes() {
    let root = repo();
    let tree = std::env::temp_dir().join(format!("formskills-keptspec-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tree);
    for rel in ["setup", "core/data"] {
        std::fs::create_dir_all(tree.join(rel)).unwrap();
    }
    for rel in ["setup/apps.py", "setup/family.spec.json", "core/data/apps.json"] {
        std::fs::copy(root.join(rel), tree.join(rel)).unwrap();
    }
    let kept = tree.join("setup/family.spec.json");
    let list = tree.join("core/data/apps.json");
    let kept_before = std::fs::read(&kept).unwrap();
    let list_before = std::fs::read(&list).unwrap();
    let mut spec: serde_json::Value = serde_json::from_slice(&kept_before).unwrap();

    let unused = tree.join("unused.json");
    spec["generated"] = "2031-01-01T00:00:00Z".into();
    spec["apps"][0]["launcher"] = "something-else".into();
    std::fs::write(&unused, serde_json::to_vec_pretty(&spec).unwrap()).unwrap();
    let Some((code, _)) = generator(&tree, &["--family".as_ref(), unused.as_os_str()]) else { return };
    assert_eq!(code, 0);
    assert_eq!(std::fs::read(&list).unwrap(), list_before, "fields the list does not use must not move it");
    assert_eq!(std::fs::read(&kept).unwrap(), kept_before, "an unchanged list must leave the kept copy alone");

    let changed = tree.join("changed.json");
    let index = spec["apps"].as_array().unwrap().iter().position(|a| a["public"] == true && !a["agents"]["skills"].as_str().unwrap_or("").is_empty()).unwrap();
    spec["apps"][index]["summary"] = "A summary the test changed.".into();
    std::fs::write(&changed, serde_json::to_vec_pretty(&spec).unwrap()).unwrap();
    let (code, out) = generator(&tree, &["--family".as_ref(), changed.as_os_str(), "--check".as_ref()]).unwrap();
    assert_eq!(code, 1, "{out}");
    assert_eq!(std::fs::read(&list).unwrap(), list_before, "--check writes nothing");
    assert_eq!(std::fs::read(&kept).unwrap(), kept_before, "--check writes nothing");

    let (code, _) = generator(&tree, &["--family".as_ref(), changed.as_os_str()]).unwrap();
    assert_eq!(code, 0);
    assert_ne!(std::fs::read(&list).unwrap(), list_before);
    assert_eq!(std::fs::read(&kept).unwrap(), std::fs::read(&changed).unwrap(), "a changed list keeps the spec it came from");

    let list_after = std::fs::read(&list).unwrap();
    let kept_after = std::fs::read(&kept).unwrap();
    spec["generated"] = "2032-02-02T00:00:00Z".into();
    let later = tree.join("later.json");
    std::fs::write(&later, serde_json::to_vec_pretty(&spec).unwrap()).unwrap();
    let (code, _) = generator(&tree, &["--family".as_ref(), later.as_os_str()]).unwrap();
    assert_eq!(code, 0);
    assert_eq!((std::fs::read(&list).unwrap(), std::fs::read(&kept).unwrap()), (list_after.clone(), kept_after.clone()), "a newer spec that gives the same list changes nothing");
    let (code, _) = generator(&tree, &["--family".as_ref(), changed.as_os_str()]).unwrap();
    assert_eq!(code, 0);
    assert_eq!((std::fs::read(&list).unwrap(), std::fs::read(&kept).unwrap()), (list_after, kept_after), "the same spec again changes nothing");

    std::fs::remove_dir_all(&tree).unwrap();
}
