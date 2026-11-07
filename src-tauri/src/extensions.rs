use std::borrow::Cow;

use tauri::http::{Request, Response, StatusCode};

use formskills_core::extensions::{self, Value};

pub const SCHEME: &str = "formext";
const PORTAL: &str = "formai://extensions?product=formskills";

fn base() -> &'static str {
    if cfg!(target_os = "windows") {
        "http://formext.localhost"
    } else {
        "formext:/"
    }
}

fn prefix(id: &str, version: &str) -> String {
    format!("{}/{id}/{version}/", base())
}

fn decode(piece: &str) -> Option<String> {
    let bytes = piece.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            let hex = std::str::from_utf8(bytes.get(i + 1..i + 3)?).ok()?;
            out.push(u8::from_str_radix(hex, 16).ok()?);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(out).ok()
}

fn split(request: &Request<Vec<u8>>) -> Option<(String, String, String)> {
    let uri = request.uri();
    let host = uri.host().unwrap_or("");
    let path = decode(uri.path().trim_start_matches('/'))?;
    let mut parts: Vec<&str> = path.splitn(3, '/').collect();
    if host.is_empty() || host == "localhost" || host == "formext.localhost" {
        if parts.len() < 3 {
            return None;
        }
    } else {
        parts = std::iter::once(host).chain(path.splitn(2, '/')).collect();
        if parts.len() < 3 {
            return None;
        }
    }
    Some((parts[0].to_string(), parts[1].to_string(), parts[2].to_string()))
}

pub fn serve(request: Request<Vec<u8>>) -> Response<Cow<'static, [u8]>> {
    let found = split(&request).and_then(|(id, version, rel)| {
        let all = extensions::list(None);
        let (target, kind) = extensions::file_for(&all, &id, &version, &rel)?;
        let body = std::fs::read(target).ok()?;
        Some((body, kind, prefix(&id, &version)))
    });
    let (status, body, kind, base) = match found {
        Some((body, kind, base)) => (StatusCode::OK, body, Some(kind), base),
        None => (StatusCode::NOT_FOUND, Vec::new(), None, String::new()),
    };
    let mut answer = Response::builder().status(status);
    for (name, value) in extensions::headers_for(kind.unwrap_or(""), &base) {
        answer = answer.header(name, value);
    }
    if let Some(kind) = kind {
        answer = answer.header("Content-Type", kind);
    }
    answer.body(Cow::Owned(body)).unwrap_or_else(|_| Response::new(Cow::Borrowed(&[][..])))
}

#[tauri::command]
pub async fn extensions_list() -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(|| extensions::listing(base(), None)).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn extensions_stamp() -> Vec<f64> {
    let (enabled, dev) = extensions::stamp(extensions::PRODUCT, None);
    vec![enabled, dev]
}

#[tauri::command]
pub fn extension_requests() -> Vec<Value> {
    extensions::take()
}

#[tauri::command]
pub fn extension_answer(key: String, result: Option<Value>, error: Option<String>) -> Result<(), String> {
    extensions::answer(&key, match error {
        Some(e) => Err(e),
        None => Ok(result.unwrap_or(Value::Null)),
    })
}

#[tauri::command]
pub async fn extension_save(name: String, data: String) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || extensions::save_download(&name, &data, None)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn open_portal() -> Result<(), String> {
    let mut command = if cfg!(target_os = "macos") {
        let mut c = std::process::Command::new("open");
        c.arg(PORTAL);
        c
    } else if cfg!(target_os = "windows") {
        let mut c = std::process::Command::new("cmd");
        c.args(["/C", "start", "", PORTAL]);
        c
    } else {
        let mut c = std::process::Command::new("xdg-open");
        c.arg(PORTAL);
        c
    };
    command.spawn().map(|_| ()).map_err(|e| format!("FormPortal could not be opened: {e}"))
}
