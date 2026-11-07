use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde_json::{json, Map};
pub use serde_json::Value;

use crate::places::{data_dir, home};

pub const API: &str = "1";
pub const PRODUCT: &str = "formskills";
pub const APP_NAME: &str = "FormSkills";

pub const TYPES: [(&str, &str); 21] = [
    (".html", "text/html; charset=utf-8"),
    (".js", "text/javascript; charset=utf-8"),
    (".mjs", "text/javascript; charset=utf-8"),
    (".css", "text/css; charset=utf-8"),
    (".json", "application/json"),
    (".svg", "image/svg+xml"),
    (".png", "image/png"),
    (".webp", "image/webp"),
    (".jpg", "image/jpeg"),
    (".jpeg", "image/jpeg"),
    (".gif", "image/gif"),
    (".wasm", "application/wasm"),
    (".txt", "text/plain; charset=utf-8"),
    (".md", "text/markdown; charset=utf-8"),
    (".wav", "audio/wav"),
    (".ogg", "audio/ogg"),
    (".mp3", "audio/mpeg"),
    (".webm", "video/webm"),
    (".mp4", "video/mp4"),
    (".cube", "text/plain; charset=utf-8"),
    (".woff2", "font/woff2"),
];
pub const PERMISSIONS: [&str; 6] = ["document", "files-read", "files-write", "network", "models", "native-code"];

fn id_ok(s: &str, longest_rest: usize, shortest_rest: usize) -> bool {
    let mut chars = s.chars();
    let Some(first) = chars.next() else { return false };
    if !(first.is_ascii_lowercase() || first.is_ascii_digit()) {
        return false;
    }
    let rest: Vec<char> = chars.collect();
    rest.len() >= shortest_rest && rest.len() <= longest_rest && rest.iter().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
}

pub fn id_re(s: &str) -> bool {
    id_ok(s, 63, 1)
}

pub fn local_re(s: &str) -> bool {
    id_ok(s, 31, 0)
}

pub fn version_re(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    parts.len() == 3 && parts.iter().all(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()))
}

pub fn content_type(suffix: &str) -> Option<&'static str> {
    TYPES.iter().find(|(s, _)| *s == suffix).map(|(_, t)| *t)
}

pub fn portal_root() -> PathBuf {
    let env = std::env::var("FORMPORTAL_ROOT").unwrap_or_default();
    if !env.trim().is_empty() {
        return PathBuf::from(env.trim());
    }
    let home = home();
    if cfg!(target_os = "macos") {
        let support = home.join("Library").join("Application Support");
        let (new, old) = (support.join("studio.formai.portal"), support.join("dev.formai.portal"));
        return if old.is_dir() && !new.exists() { old } else { new };
    }
    if cfg!(target_os = "windows") {
        let base = std::env::var_os("LOCALAPPDATA").filter(|b| !b.is_empty());
        return base.map(PathBuf::from).unwrap_or_else(|| home.join("AppData").join("Local")).join("FormPortal");
    }
    let base = std::env::var_os("XDG_DATA_HOME").filter(|b| !b.is_empty());
    base.map(PathBuf::from).unwrap_or_else(|| home.join(".local").join("share")).join("formportal")
}

pub fn version_tuple(v: &str) -> Vec<i64> {
    let mut out = Vec::new();
    for p in v.split('.').take(3) {
        match p.trim().parse::<i64>() {
            Ok(n) => out.push(n),
            Err(_) => return vec![0, 0, 0],
        }
    }
    out
}

#[derive(Debug, Clone)]
pub struct Extension {
    pub id: String,
    pub version: String,
    pub source: String,
    pub path: PathBuf,
    pub name: String,
    pub kind: String,
    pub description: String,
    pub permissions: Vec<String>,
    pub entry_ui: String,
    pub panels: Vec<Value>,
    pub commands: Vec<Value>,
    pub state: String,
    pub reason: String,
}

impl Extension {
    pub fn new(id: &str, version: &str, source: &str, path: PathBuf) -> Self {
        Extension { id: id.to_string(), version: version.to_string(), source: source.to_string(), path, name: String::new(), kind: String::new(), description: String::new(), permissions: Vec::new(), entry_ui: String::new(), panels: Vec::new(), commands: Vec::new(), state: "ready".to_string(), reason: String::new() }
    }

    pub fn public(&self, base: &str) -> Value {
        json!({
            "id": self.id,
            "name": if self.name.is_empty() { &self.id } else { &self.name },
            "version": self.version,
            "kind": self.kind,
            "source": self.source,
            "description": self.description,
            "permissions": self.permissions,
            "base": format!("{base}/{}/{}/", self.id, self.version),
            "entryUi": self.entry_ui,
            "panels": self.panels,
            "commands": self.commands,
            "path": if self.source == "development" { Value::String(self.path.display().to_string()) } else { Value::Null },
            "state": self.state,
            "reason": self.reason,
        })
    }
}

fn read_json(path: &Path) -> Option<Value> {
    let text = std::fs::read_to_string(path).ok()?;
    serde_json::from_str(&text).ok()
}

fn safe_rel(rel: &str) -> bool {
    !rel.is_empty() && !rel.starts_with('/') && !rel.contains('\\') && !rel.split('/').any(|p| p == "..") && rel.chars().count() <= 200
}

fn truthy(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0),
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Array(a)) => !a.is_empty(),
        Some(Value::Object(o)) => !o.is_empty(),
    }
}

fn py_str(v: Option<&Value>) -> String {
    match v {
        None | Some(Value::Null) => "None".to_string(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Bool(true)) => "True".to_string(),
        Some(Value::Bool(false)) => "False".to_string(),
        Some(other) => other.to_string(),
    }
}

fn py_repr(v: Option<&Value>) -> String {
    match v {
        Some(Value::String(s)) => format!("'{s}'"),
        other => py_str(other),
    }
}

fn str_or(v: Option<&Value>, fallback: &str) -> String {
    if truthy(v) { py_str(v) } else { fallback.to_string() }
}

fn cut(s: &str, most: usize) -> String {
    s.chars().take(most).collect()
}

fn resolved(p: &Path) -> PathBuf {
    std::fs::canonicalize(p).unwrap_or_else(|_| p.to_path_buf())
}

fn inside(root: &Path, target: &Path) -> bool {
    target != root && target.starts_with(root)
}

pub fn check(mut ext: Extension, product: &str, app_version: &str, app_name: &str) -> Extension {
    fn refuse(mut ext: Extension, reason: String) -> Extension {
        ext.state = "refused".to_string();
        ext.reason = reason;
        ext
    }

    let manifest = match read_json(&ext.path.join("manifest.json")) {
        Some(Value::Object(m)) => m,
        _ => return refuse(ext, "its manifest.json is missing or not valid JSON".to_string()),
    };
    let one = match manifest.get("format_version") {
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64() == Some(1.0),
        _ => false,
    };
    if manifest.get("format") != Some(&json!("formai-package")) || !one {
        return refuse(ext, "it is not a formai package".to_string());
    }
    ext.name = cut(&str_or(manifest.get("name"), &ext.id), 80);
    ext.kind = str_or(manifest.get("kind"), "");
    ext.description = cut(&str_or(manifest.get("description"), ""), 400);
    let early = match manifest.get("version") {
        None => String::new(),
        v => py_str(v),
    };
    if ext.source == "development" && version_re(&early) {
        ext.version = early;
    }
    if manifest.get("id") != Some(&Value::String(ext.id.clone())) {
        let said = py_repr(manifest.get("id"));
        let id = ext.id.clone();
        return refuse(ext, format!("its manifest says {said}, not '{id}'"));
    }
    if manifest.get("product") != Some(&Value::String(product.to_string())) {
        let said = py_str(manifest.get("product"));
        return refuse(ext, format!("it is made for {said}, not {app_name}"));
    }
    let stated = match manifest.get("version") {
        None => String::new(),
        v => py_str(v),
    };
    if stated != ext.version && ext.source != "development" {
        let said = py_str(manifest.get("version"));
        let version = ext.version.clone();
        return refuse(ext, format!("its manifest says version {said}, FormPortal says {version}"));
    }
    ext.version = str_or(manifest.get("version"), &ext.version);
    if !version_re(&ext.version) {
        return refuse(ext, "its version is not x.y.z".to_string());
    }
    if manifest.get("api") != Some(&json!(API)) {
        let said = py_str(manifest.get("api"));
        return refuse(ext, format!("it needs extension API {said}; this {app_name} offers API {API}"));
    }
    if truthy(manifest.get("native")) {
        return refuse(ext, format!("native extensions are not supported by {app_name}"));
    }
    let perms = if truthy(manifest.get("permissions")) { manifest.get("permissions").cloned().unwrap_or(Value::Null) } else { json!([]) };
    let Some(perms) = perms.as_array() else {
        return refuse(ext, "it asks for a permission that does not exist".to_string());
    };
    if perms.iter().any(|p| !p.as_str().is_some_and(|s| PERMISSIONS.contains(&s))) {
        return refuse(ext, "it asks for a permission that does not exist".to_string());
    }
    let mut seen = Vec::new();
    for p in perms.iter().filter_map(Value::as_str) {
        if !seen.iter().any(|s: &String| s == p) {
            seen.push(p.to_string());
        }
    }
    ext.permissions = seen;
    let minimum = manifest.get("minimum_app");
    if truthy(minimum) && version_tuple(&py_str(minimum)) > version_tuple(app_version) {
        let said = py_str(minimum);
        return refuse(ext, format!("it needs {app_name} {said} or newer"));
    }
    let empty = Map::new();
    let entry_obj = match manifest.get("entry") {
        Some(Value::Object(o)) => o,
        _ => &empty,
    };
    let entry = match entry_obj.get("ui") {
        None => String::new(),
        Some(Value::String(s)) => s.clone(),
        Some(_) => return refuse(ext, "its entry.ui is not a path inside the package".to_string()),
    };
    let has_entry = !entry.is_empty();
    let contributes = match manifest.get("contributes") {
        Some(Value::Object(o)) => o,
        _ => &empty,
    };
    let listed = |key: &str| -> Vec<Map<String, Value>> {
        let items = contributes.get(key).filter(|v| truthy(Some(v))).and_then(Value::as_array).cloned().unwrap_or_default();
        items
            .into_iter()
            .filter_map(|v| match v {
                Value::Object(o) => Some(o),
                _ => None,
            })
            .filter(|o| local_re(&match o.get("id") { None => String::new(), v => py_str(v) }) && truthy(o.get("title")))
            .collect()
    };
    let panels = listed("panels");
    let commands = listed("commands");
    if (!panels.is_empty() || !commands.is_empty()) && !has_entry {
        return refuse(ext, "it contributes panels or commands but has no entry.ui".to_string());
    }
    if has_entry {
        if !safe_rel(&entry) {
            return refuse(ext, "its entry.ui is not a path inside the package".to_string());
        }
        let target = resolved(&ext.path.join(&entry));
        if !target.is_file() || !inside(&resolved(&ext.path), &target) {
            return refuse(ext, format!("its entry.ui {entry} is not in the package"));
        }
    }
    ext.entry_ui = entry;
    ext.panels = panels
        .iter()
        .map(|p| {
            let location = if p.get("location") == Some(&json!("dialog")) { "dialog" } else { "dock" };
            json!({ "id": p["id"], "title": cut(&py_str(p.get("title")), 60), "location": location })
        })
        .collect();
    ext.commands = commands
        .iter()
        .map(|c| {
            let mut out = json!({ "id": c["id"], "title": cut(&py_str(c.get("title")), 80) });
            if truthy(c.get("panel")) {
                out["panel"] = c["panel"].clone();
            }
            out
        })
        .collect();
    ext
}

pub fn resolve(product: &str, app_version: &str, app_name: &str, root: Option<&Path>) -> Vec<Extension> {
    let folder = root.map(Path::to_path_buf).unwrap_or_else(portal_root).join("extensions").join(product);
    let mut found: BTreeMap<String, Extension> = BTreeMap::new();
    let mut order: Vec<String> = Vec::new();
    let mut put = |ext: Extension| {
        if !order.contains(&ext.id) {
            order.push(ext.id.clone());
        }
        found.insert(ext.id.clone(), ext);
    };
    let rows = |file: &str, format: &str| -> Vec<Map<String, Value>> {
        match read_json(&folder.join(file)) {
            Some(Value::Object(o)) if o.get("format") == Some(&json!(format)) => o
                .get("extensions")
                .filter(|v| truthy(Some(v)))
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .filter_map(|r| match r {
                    Value::Object(m) if id_re(&match m.get("id") { None => String::new(), v => py_str(v) }) => Some(m),
                    _ => None,
                })
                .collect(),
            _ => Vec::new(),
        }
    };
    let path_of = |row: &Map<String, Value>| PathBuf::from(match row.get("path") { None => String::new(), v => py_str(v) });
    for row in rows("enabled.json", "formportal-enabled-extensions") {
        let source = if row.get("source") == Some(&json!("sideload")) { "sideload" } else { "catalogue" };
        let version = match row.get("version") { None => String::new(), v => py_str(v) };
        let ext = Extension::new(&py_str(row.get("id")), &version, source, path_of(&row));
        put(check(ext, product, app_version, app_name));
    }
    for row in rows("dev.json", "formext-dev-extensions") {
        let ext = Extension::new(&py_str(row.get("id")), "0.0.0", "development", path_of(&row));
        put(check(ext, product, app_version, app_name));
    }
    let mut out: Vec<Extension> = order.iter().filter_map(|id| found.remove(id)).collect();
    out.sort_by_key(|e| if e.name.is_empty() { e.id.to_lowercase() } else { e.name.to_lowercase() });
    out
}

pub fn stamp(product: &str, root: Option<&Path>) -> (f64, f64) {
    let folder = root.map(Path::to_path_buf).unwrap_or_else(portal_root).join("extensions").join(product);
    let time = |name: &str| -> f64 {
        std::fs::metadata(folder.join(name))
            .and_then(|m| m.modified())
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs_f64())
            .unwrap_or(0.0)
    };
    (time("enabled.json"), time("dev.json"))
}

pub fn csp_for(base: &str) -> String {
    let src = if base.starts_with("http://") || base.starts_with("https://") || base.starts_with("formext://") { base } else { "'self'" };
    format!(
        "default-src 'none'; script-src {src} 'wasm-unsafe-eval'; style-src {src} 'unsafe-inline'; img-src {src} data: blob:; media-src {src} data: blob:; font-src {src}; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"
    )
}

fn suffix_of(rel: &str) -> String {
    let name = rel.rsplit('/').next().unwrap_or("");
    match name.rfind('.') {
        Some(at) if at > 0 && at + 1 < name.len() => name[at..].to_lowercase(),
        _ => String::new(),
    }
}

pub fn file_for(extensions: &[Extension], ext_id: &str, version: &str, rel: &str) -> Option<(PathBuf, &'static str)> {
    let ext = extensions.iter().find(|e| e.id == ext_id && e.version == version && e.state == "ready")?;
    if !safe_rel(rel) {
        return None;
    }
    let kind = content_type(&suffix_of(rel))?;
    let root = std::fs::canonicalize(&ext.path).ok()?;
    let candidate = ext.path.join(rel);
    let is_link = |p: &Path| std::fs::symlink_metadata(p).map(|m| m.file_type().is_symlink()).unwrap_or(false);
    if is_link(&candidate) {
        return None;
    }
    for p in candidate.ancestors().skip(1) {
        let r = resolved(p);
        if (inside(&root, &r) || r == root) && is_link(p) {
            return None;
        }
    }
    let target = std::fs::canonicalize(&candidate).ok()?;
    if !inside(&root, &target) || !target.is_file() {
        return None;
    }
    Some((target, kind))
}

pub fn headers_for(content_type: &str, base: &str) -> Vec<(&'static str, String)> {
    let mut h = vec![
        ("X-Content-Type-Options", "nosniff".to_string()),
        ("Cache-Control", "no-store".to_string()),
        ("Cross-Origin-Resource-Policy", "cross-origin".to_string()),
        ("Access-Control-Allow-Origin", "*".to_string()),
    ];
    if content_type.starts_with("text/html") {
        h.push(("Content-Security-Policy", csp_for(base)));
    }
    h
}

pub fn app_version() -> &'static str {
    crate::CORE_VERSION
}

pub fn list(root: Option<&Path>) -> Vec<Extension> {
    resolve(PRODUCT, app_version(), APP_NAME, root)
}

pub fn listing(base: &str, root: Option<&Path>) -> Value {
    let (enabled, dev) = stamp(PRODUCT, root);
    let found = list(root);
    json!({
        "product": PRODUCT,
        "app": APP_NAME,
        "appVersion": app_version(),
        "api": API,
        "root": root.map(Path::to_path_buf).unwrap_or_else(portal_root).display().to_string(),
        "stamp": [enabled, dev],
        "extensions": found.iter().map(|e| e.public(base)).collect::<Vec<_>>(),
    })
}

pub const SAVE_LIMIT: usize = 200 * 1024 * 1024;

pub fn save_name(name: &str) -> Option<String> {
    let name = name.trim();
    let ok = !name.is_empty() && name.chars().count() <= 120 && !name.starts_with('.') && !name.contains(['/', '\\', ':', '\0']) && name.chars().all(|c| !c.is_control());
    ok.then(|| name.to_string())
}

pub fn save_download(name: &str, data: &str, into: Option<&Path>) -> Result<Value, String> {
    use base64::Engine;
    let name = save_name(name).ok_or_else(|| format!("{name:?} is not a file name"))?;
    let bytes = base64::engine::general_purpose::STANDARD.decode(data.trim()).map_err(|_| "the file's data is not base64".to_string())?;
    if bytes.len() > SAVE_LIMIT {
        return Err(format!("{name} is larger than {} MB", SAVE_LIMIT / 1024 / 1024));
    }
    let dir = into.map(Path::to_path_buf).unwrap_or_else(crate::places::downloads_dir);
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let (stem, ending) = match name.rfind('.') {
        Some(at) if at > 0 => (&name[..at], &name[at..]),
        _ => (name.as_str(), ""),
    };
    let first = dir.join(&name);
    let target = if std::fs::symlink_metadata(&first).is_err() { first } else { (2..1000).map(|n| dir.join(format!("{stem} ({n}){ending}"))).find(|p| std::fs::symlink_metadata(p).is_err()).ok_or_else(|| format!("{name}: too many files of that name in {}", dir.display()))? };
    let part = dir.join(format!(".{name}.part-{}", std::process::id()));
    crate::durable::replace_file(&part, &target, &bytes).map_err(|e| format!("{}: {e}", target.display()))?;
    Ok(json!({ "saved": true, "name": target.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(), "path": target.display().to_string() }))
}

pub fn requests_dir() -> PathBuf {
    data_dir().join("extension-requests")
}

const ASK_TAKEN: Duration = Duration::from_secs(10);
const ASK_DONE: Duration = Duration::from_secs(130);

pub fn ask(id: &str, command: &str, args: Value) -> Result<Value, String> {
    let dir = requests_dir();
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
    let key = format!("{now}-{}", std::process::id());
    let asked = dir.join(format!("{key}.json"));
    let taken = dir.join(format!("{key}.taken"));
    let answered = dir.join(format!("{key}.answer"));
    let body = json!({ "key": key, "id": id, "command": command, "args": args });
    std::fs::write(&asked, body.to_string()).map_err(|e| format!("{}: {e}", asked.display()))?;
    let started = Instant::now();
    loop {
        if let Some(answer) = read_json(&answered) {
            let _ = std::fs::remove_file(&answered);
            let _ = std::fs::remove_file(&taken);
            return match answer.get("error") {
                Some(Value::String(e)) => Err(e.clone()),
                _ => Ok(answer.get("result").cloned().unwrap_or(Value::Null)),
            };
        }
        let waited = started.elapsed();
        if asked.exists() && waited > ASK_TAKEN {
            let _ = std::fs::remove_file(&asked);
            return Err("the formskills window is not open: start formskills, then ask again".to_string());
        }
        if waited > ASK_DONE {
            let _ = std::fs::remove_file(&taken);
            return Err(format!("{id}: {command} did not finish within {} s", ASK_DONE.as_secs()));
        }
        std::thread::sleep(Duration::from_millis(200));
    }
}

pub fn take() -> Vec<Value> {
    let dir = requests_dir();
    let Ok(entries) = std::fs::read_dir(&dir) else { return Vec::new() };
    let mut names: Vec<String> = entries.filter_map(|e| e.ok()).map(|e| e.file_name().to_string_lossy().to_string()).filter(|n| n.ends_with(".json")).collect();
    names.sort();
    let mut out = Vec::new();
    for name in names {
        let from = dir.join(&name);
        let to = dir.join(name.trim_end_matches(".json").to_string() + ".taken");
        if std::fs::rename(&from, &to).is_err() {
            continue;
        }
        if let Some(body) = read_json(&to) {
            out.push(body);
        }
    }
    out
}

pub fn answer(key: &str, result: Result<Value, String>) -> Result<(), String> {
    if key.is_empty() || !key.chars().all(|c| c.is_ascii_digit() || c == '-') {
        return Err(format!("{key:?} is not a request"));
    }
    let dir = requests_dir();
    if !dir.join(format!("{key}.taken")).exists() {
        return Err(format!("no request {key} is waiting"));
    }
    let body = match result {
        Ok(v) => json!({ "result": v }),
        Err(e) => json!({ "error": e }),
    };
    let part = dir.join(format!("{key}.part"));
    std::fs::write(&part, body.to_string()).map_err(|e| e.to_string())?;
    std::fs::rename(&part, dir.join(format!("{key}.answer"))).map_err(|e| e.to_string())
}
