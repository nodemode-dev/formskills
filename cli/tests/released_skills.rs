mod support;

use serde_json::json;
use support::*;

fn signed(sandbox: &Sandbox, products: &[serde_json::Value]) -> Vec<(&'static str, String)> {
    let k = key(7);
    write_catalogue(sandbox, products, Some(&k));
    vec![("FORMAI_CATALOG_PUBKEY", public(&k))]
}

fn env<'a>(pairs: &'a [(&'static str, String)]) -> Vec<(&'static str, &'a str)> {
    pairs.iter().map(|(k, v)| (*k, v.as_str())).collect()
}

fn good_set() -> Vec<u8> {
    zip_of(&[
        ("cut-video/SKILL.md", &skill_card("cut-video", "See [the reference](references/timeline.md).")),
        ("cut-video/references/timeline.md", "# Timeline\n"),
    ])
}

#[test]
fn only_apps_the_signed_catalogue_releases_list_skills() {
    let s = Sandbox::new("released");
    let server = Server::start();
    let a = asset(&server, "formcut-skills.zip", &good_set());
    let e = signed(&s, &[product("formcut", "2.10.6", Some(a), vec![]), product("formpdf", "0.56.6", None, vec![])]);
    let listing = s.json(&["skills"], &env(&e));
    let cut = s.app(&listing, "formcut");
    assert_eq!(cut["source"]["kind"], "release");
    assert_eq!(cut["source"]["version"], "2.10.6");
    assert_eq!(cut["skills"][0]["folder"], "cut-video");
    let pdf = s.app(&listing, "formpdf");
    assert_eq!(pdf["source"]["kind"], "missing");
    assert!(pdf["source"]["reason"].as_str().unwrap().contains("no skills asset"), "{pdf}");
    assert_eq!(pdf["skills"], json!([]));
    let md = s.app(&listing, "formmd");
    assert_eq!(md["source"]["kind"], "missing");
    assert_eq!(md["skills"], json!([]));
}

#[test]
fn a_checkout_is_read_only_in_dev_mode() {
    let s = Sandbox::new("dev");
    let checkout = s.path("dev/formcut/.claude/skills/unreleased-skill");
    std::fs::create_dir_all(&checkout).unwrap();
    std::fs::write(checkout.join("SKILL.md"), skill_card("unreleased-skill", "Body.")).unwrap();
    let e = signed(&s, &[]);
    let dev_roots = s.path("dev").display().to_string();
    let mut plain = env(&e);
    plain.push(("FORMSKILLS_DEV_ROOTS", dev_roots.as_str()));
    let listing = s.json(&["skills", "formcut"], &plain);
    assert_eq!(s.app(&listing, "formcut")["source"]["kind"], "missing");
    assert_eq!(s.app(&listing, "formcut")["skills"], json!([]));
    plain.push(("FORMSKILLS_DEV", "1"));
    let listing = s.json(&["skills", "formcut"], &plain);
    assert_eq!(s.app(&listing, "formcut")["source"]["kind"], "dev");
    assert_eq!(s.app(&listing, "formcut")["skills"][0]["folder"], "unreleased-skill");
}

#[test]
fn an_unsigned_or_wrongly_signed_catalogue_lists_nothing() {
    let s = Sandbox::new("trust");
    let server = Server::start();
    let a = asset(&server, "formcut-skills.zip", &good_set());
    let products = [product("formcut", "2.10.6", Some(a), vec![])];
    write_catalogue(&s, &products, None);
    let trusted = public(&key(7));
    let listing = s.json(&["skills", "formcut"], &[("FORMAI_CATALOG_PUBKEY", trusted.as_str())]);
    assert!(listing["catalogue"].as_str().unwrap().contains("not signed"), "{listing}");
    assert_eq!(s.app(&listing, "formcut")["skills"], json!([]));
    write_catalogue(&s, &products, Some(&key(9)));
    let listing = s.json(&["skills", "formcut"], &[("FORMAI_CATALOG_PUBKEY", trusted.as_str())]);
    assert!(listing["catalogue"].as_str().unwrap().contains("does not match a key"), "{listing}");
    assert_eq!(s.app(&listing, "formcut")["skills"], json!([]));
    assert_eq!(server.fetched("formcut-skills.zip"), 0);
    assert!(s.kept_files().is_empty());
}

#[test]
fn a_set_whose_digest_differs_from_the_release_is_refused_and_not_kept() {
    let s = Sandbox::new("digest");
    let server = Server::start();
    let mut a = asset(&server, "formcut-skills.zip", &good_set());
    a["sha256"] = json!(hex(b"something else"));
    let e = signed(&s, &[product("formcut", "2.10.6", Some(a), vec![])]);
    let listing = s.json(&["skills", "formcut"], &env(&e));
    let cut = s.app(&listing, "formcut");
    assert_eq!(cut["source"]["kind"], "missing");
    assert!(cut["source"]["reason"].as_str().unwrap().contains("does not match the catalogue's digest"), "{cut}");
    assert_eq!(server.fetched("formcut-skills.zip"), 1);
    assert!(s.kept_files().is_empty(), "{:?}", s.kept_files());
}

#[test]
fn a_matching_set_is_kept_once_and_downloads_as_released() {
    let s = Sandbox::new("kept");
    let server = Server::start();
    let bytes = good_set();
    let a = asset(&server, "formcut-skills.zip", &bytes);
    let e = signed(&s, &[product("formcut", "2.10.6", Some(a), vec![])]);
    let first = s.json(&["skills", "formcut"], &env(&e));
    assert_eq!(s.app(&first, "formcut")["source"]["downloaded"], true);
    let second = s.json(&["skills", "formcut"], &env(&e));
    assert_eq!(s.app(&second, "formcut")["source"]["downloaded"], false);
    assert_eq!(server.fetched("formcut-skills.zip"), 1);
    let record: serde_json::Value = serde_json::from_slice(&std::fs::read(s.path("formskills/released/formcut/2.10.6/asset.json")).unwrap()).unwrap();
    assert_eq!(record["asset"]["sha256"], hex(&bytes));
    let saved = s.json(&["download", "formcut"], &env(&e));
    let files = read_zip(std::path::Path::new(saved["path"].as_str().unwrap()));
    let released = read_zip_bytes(&bytes);
    assert_eq!(files, released);
}

fn read_zip_bytes(bytes: &[u8]) -> std::collections::HashMap<String, String> {
    let path = std::env::temp_dir().join(format!("formskills-test-{}-released.zip", std::process::id()));
    std::fs::write(&path, bytes).unwrap();
    let found = read_zip(&path);
    let _ = std::fs::remove_file(path);
    found
}

#[test]
fn a_set_that_escapes_its_folder_or_holds_a_link_is_refused() {
    let s = Sandbox::new("unpack");
    let server = Server::start();
    let escape = asset(&server, "escape.zip", &zip_of(&[("one/SKILL.md", &skill_card("one", "Body.")), ("../outside.md", "x")]));
    let link = asset(&server, "link.zip", &zip_with_link("one/passwd", "/etc/passwd"));
    let e = signed(&s, &[product("formcut", "2.10.6", Some(escape), vec![]), product("formpdf", "0.56.6", Some(link), vec![])]);
    let listing = s.json(&["skills"], &env(&e));
    let cut = s.app(&listing, "formcut");
    assert_eq!(cut["source"]["kind"], "missing");
    assert!(cut["source"]["reason"].as_str().unwrap().contains("outside the folder"), "{cut}");
    let pdf = s.app(&listing, "formpdf");
    assert_eq!(pdf["source"]["kind"], "missing");
    assert!(pdf["source"]["reason"].as_str().unwrap().contains("is a link"), "{pdf}");
    assert!(s.kept_files().is_empty(), "{:?}", s.kept_files());
    assert!(!s.path("formskills/outside.md").exists() && !s.path("formskills/released/outside.md").exists());
}

#[test]
fn a_pin_follows_only_releases_the_catalogue_lists() {
    let s = Sandbox::new("pin");
    let server = Server::start();
    let latest = asset(&server, "new.zip", &good_set());
    let earlier_bytes = zip_of(&[("cut-video/SKILL.md", &skill_card("cut-video", "The earlier text."))]);
    let earlier = asset(&server, "old.zip", &earlier_bytes);
    let e = signed(&s, &[product("formcut", "2.10.6", Some(latest), vec![older("2.10.5", earlier)])]);
    s.json(&["pin", "formcut", "2.10.5"], &env(&e));
    let listing = s.json(&["skills", "formcut"], &env(&e));
    let cut = s.app(&listing, "formcut");
    assert_eq!(cut["source"]["kind"], "release");
    assert_eq!(cut["source"]["version"], "2.10.5");
    assert_eq!(cut["source"]["latest"], "2.10.6");
    let (ok, text, _) = s.run(&["read", "formcut", "cut-video/SKILL.md"], &env(&e));
    assert!(ok && text.contains("The earlier text."), "{text}");
    let (ok, _, err) = s.run(&["pin", "formcut", "2.9.0"], &env(&e));
    assert!(!ok && err.contains("has no release 2.9.0"), "{err}");
    std::fs::write(s.path("formskills/pins.json"), r#"{"formcut":"2.9.0"}"#).unwrap();
    let listing = s.json(&["skills", "formcut"], &env(&e));
    let cut = s.app(&listing, "formcut");
    assert_ne!(cut["source"]["kind"], "release", "{cut}");
    assert!(cut["source"]["reason"].as_str().unwrap().contains("no longer lists"), "{cut}");
}

#[test]
fn offline_uses_formportals_kept_copy_under_the_same_trust() {
    let s = Sandbox::new("offline");
    let server = Server::start();
    let a = asset(&server, "formcut-skills.zip", &good_set());
    let e = signed(&s, &[product("formcut", "2.10.6", Some(a), vec![])]);
    let mut offline = env(&e);
    offline.push(("FORMSKILLS_OFFLINE", "1"));
    let listing = s.json(&["skills", "formcut"], &offline);
    assert!(listing["catalogue"].as_str().unwrap().contains("not used"), "{listing}");
    std::fs::create_dir_all(s.path("portal/catalog")).unwrap();
    std::fs::copy(s.path("catalogue/apps.json"), s.path("portal/catalog/apps.json")).unwrap();
    let listing = s.json(&["skills", "formcut"], &offline);
    assert!(listing["catalogue"].as_str().unwrap().contains("not signed"), "{listing}");
    std::fs::copy(s.path("catalogue/apps.json.sig"), s.path("portal/catalog/apps.json.sig")).unwrap();
    let listing = s.json(&["skills", "formcut"], &offline);
    assert!(listing["catalogue"].as_str().unwrap().contains("FormPortal's kept copy"), "{listing}");
    assert_eq!(s.app(&listing, "formcut")["source"]["kind"], "release");
}
