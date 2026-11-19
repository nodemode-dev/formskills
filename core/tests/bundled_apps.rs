use formskills_core::Apps;
use std::collections::HashSet;

#[test]
fn the_bundled_list_names_a_registry_version_and_no_commit() {
    let apps = Apps::bundled().expect("the bundled list loads");
    assert_eq!(apps.source.repository, "nodemode-dev/formcompiler");
    assert!(!apps.source.version.is_empty());
    let raw: serde_json::Value = serde_json::from_str(include_str!("../data/apps.json")).expect("valid json");
    assert!(raw["source"].get("commit").is_none(), "formcompiler's HEAD must not be recorded");
    assert!(apps.describe_source().contains(&apps.source.version));
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
