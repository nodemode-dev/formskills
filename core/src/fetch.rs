use std::io::{Cursor, Read};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::catalog::{self, Asset};
use crate::places::cache_dir;

const ASSET_LIMIT: u64 = 64 * 1024 * 1024;
const UNPACKED_LIMIT: u64 = 256 * 1024 * 1024;
const ENTRY_LIMIT: usize = 10_000;
const RECORD: &str = "asset.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Record {
    pub app: String,
    pub version: String,
    pub channel: String,
    pub asset: Asset,
    pub fetched: u64,
}

#[derive(Debug, Clone)]
pub struct Kept {
    pub dir: PathBuf,
    pub record: Record,
}

pub fn plain(text: &str) -> bool {
    !text.is_empty() && text.len() <= 64 && text.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '+' | '_')) && !text.starts_with('.')
}

fn read_record(dir: &Path) -> Option<Record> {
    serde_json::from_slice(&std::fs::read(dir.join(RECORD)).ok()?).ok()
}

pub fn hex_sha256(bytes: &[u8]) -> String {
    Sha256::digest(bytes).iter().map(|b| format!("{b:02x}")).collect()
}

fn unpack(bytes: &[u8], into: &Path) -> Result<usize, String> {
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes)).map_err(|e| format!("not a zip ({e})"))?;
    if archive.len() > ENTRY_LIMIT {
        return Err(format!("it has {} entries, more than {ENTRY_LIMIT}", archive.len()));
    }
    let mut total = 0u64;
    let mut files = 0usize;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let Some(rel) = entry.enclosed_name() else { return Err(format!("entry {:?} points outside the folder", entry.name())) };
        if entry.unix_mode().is_some_and(|m| m & 0o170000 == 0o120000) {
            return Err(format!("entry {:?} is a link", entry.name()));
        }
        let target = into.join(&rel);
        if entry.is_dir() {
            std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;
            continue;
        }
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let mut data = Vec::new();
        (&mut entry).take(UNPACKED_LIMIT - total + 1).read_to_end(&mut data).map_err(|e| e.to_string())?;
        total += data.len() as u64;
        if total > UNPACKED_LIMIT {
            return Err(format!("it unpacks to more than {UNPACKED_LIMIT} bytes"));
        }
        std::fs::write(&target, data).map_err(|e| format!("{}: {e}", target.display()))?;
        files += 1;
    }
    Ok(files)
}

pub fn kept(app: &str) -> Option<Kept> {
    let dir = cache_dir().join(app);
    let mut found: Vec<Kept> = std::fs::read_dir(&dir).ok()?.flatten().filter_map(|e| {
        let path = e.path();
        let record = read_record(&path)?;
        path.join("skills").is_dir().then_some(Kept { dir: path, record })
    }).collect();
    found.sort_by_key(|k| std::cmp::Reverse(k.record.fetched));
    found.into_iter().next()
}

pub fn ensure(app: &str, channel: &str, version: &str, asset: &Asset, force: bool) -> Result<(Kept, bool), String> {
    if !plain(app) || !plain(version) {
        return Err(format!("the catalogue names an app or version formskills will not use as a folder name ({app} {version})"));
    }
    let app_dir = cache_dir().join(app);
    let final_dir = app_dir.join(version);
    if !force {
        if let Some(record) = read_record(&final_dir) {
            if record.asset.sha256.eq_ignore_ascii_case(&asset.sha256) && final_dir.join("skills").is_dir() {
                return Ok((Kept { dir: final_dir, record }, false));
            }
        }
    }
    if !catalog::allowed_url(&asset.url) {
        return Err(format!("{} is not an https address", asset.url));
    }
    let bytes = catalog::get(&asset.url, 60, ASSET_LIMIT).map_err(|e| format!("could not download {}: {e}", asset.file))?;
    let digest = hex_sha256(&bytes);
    if !digest.eq_ignore_ascii_case(asset.sha256.trim()) {
        return Err(format!("{} does not match the catalogue's digest (got {}, expected {})", asset.file, &digest[..12], asset.sha256.get(..12).unwrap_or(&asset.sha256)));
    }
    let part = app_dir.join(format!(".{version}.part-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&part);
    std::fs::create_dir_all(part.join("skills")).map_err(|e| format!("{}: {e}", part.display()))?;
    let unpacked = unpack(&bytes, &part.join("skills"));
    if let Err(e) = unpacked {
        let _ = std::fs::remove_dir_all(&part);
        return Err(format!("{}: {e}", asset.file));
    }
    let fetched = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    let record = Record { app: app.to_string(), version: version.to_string(), channel: channel.to_string(), asset: asset.clone(), fetched };
    let aside = app_dir.join(format!(".{version}.old-{}", std::process::id()));
    let placed = serde_json::to_vec_pretty(&record)
        .map_err(|e| e.to_string())
        .and_then(|json| std::fs::write(part.join(RECORD), json).map_err(|e| format!("{}: {e}", part.display())))
        .and_then(|()| crate::durable::replace_dir(&part, &final_dir, &aside).map_err(|e| format!("{}: {e}", final_dir.display())));
    if let Err(e) = placed {
        let _ = std::fs::remove_dir_all(&part);
        return Err(e);
    }
    if let Ok(read) = std::fs::read_dir(&app_dir) {
        for entry in read.flatten() {
            let path = entry.path();
            if path != final_dir && path.is_dir() && !entry.file_name().to_string_lossy().starts_with('.') {
                let _ = std::fs::remove_dir_all(path);
            }
        }
    }
    Ok((Kept { dir: final_dir, record }, true))
}
