mod support;

use support::*;

fn released(s: &Sandbox, server: &Server) -> Vec<(&'static str, String)> {
    let set = zip_of(&[("cut-video/SKILL.md", &skill_card("cut-video", "Body."))]);
    let a = asset(server, "formcut-skills.zip", &set);
    let k = key(7);
    write_catalogue(s, &[product("formcut", "2.10.6", Some(a), vec![])], Some(&k));
    vec![("FORMAI_CATALOG_PUBKEY", public(&k))]
}

fn env<'a>(pairs: &'a [(&'static str, String)]) -> Vec<(&'static str, &'a str)> {
    pairs.iter().map(|(k, v)| (*k, v.as_str())).collect()
}

#[test]
fn an_unreadable_install_record_is_never_overwritten() {
    let s = Sandbox::new("records");
    let server = Server::start();
    let e = released(&s, &server);
    let records = s.path("formskills/installed.json");
    std::fs::write(&records, b"[{\"target\":").unwrap();
    let (ok, _, err) = s.run(&["install", "formcut", "cut-video", "--to", "claude"], &env(&e));
    assert!(!ok);
    assert!(err.contains("cannot be read"), "{err}");
    assert_eq!(std::fs::read(&records).unwrap(), b"[{\"target\":");
    assert!(!s.path("home/.claude/skills/cut-video").exists());
    let (ok, _, err) = s.run(&["uninstall", "cut-video", "--from", "claude"], &env(&e));
    assert!(!ok);
    assert!(err.contains("cannot be read"), "{err}");
    assert_eq!(std::fs::read(&records).unwrap(), b"[{\"target\":");
}

#[test]
fn an_unreadable_pins_file_is_never_overwritten() {
    let s = Sandbox::new("pins");
    let server = Server::start();
    let e = released(&s, &server);
    let pins = s.path("formskills/pins.json");
    std::fs::write(&pins, b"{\"formcut\":").unwrap();
    let (ok, _, err) = s.run(&["pin", "formcut", "latest"], &env(&e));
    assert!(!ok);
    assert!(err.contains("cannot be read"), "{err}");
    assert_eq!(std::fs::read(&pins).unwrap(), b"{\"formcut\":");
}
