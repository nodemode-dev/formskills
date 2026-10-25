use std::collections::HashMap;
use std::io::Read;
use std::time::Duration;

use base64::Engine;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};

use crate::places::{flag, portal_root};

pub const DEFAULT_CATALOG: &str = "https://github.com/nodemode-ai/formcompiler/releases/download/catalog/apps.json";
pub const KEY_ENV: &str = "FORMAI_CATALOG_PUBKEY";
const TRUSTED_KEYS: &str = include_str!("../catalog_keys.txt");
const CATALOG_FORMAT: &str = "formai-catalog";
const LOOPBACK: [&str; 4] = ["http://127.0.0.1:", "http://127.0.0.1/", "http://localhost:", "http://localhost/"];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Asset {
    pub file: String,
    pub url: String,
    pub bytes: u64,
    pub sha256: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Older {
    pub version: String,
    pub skills: Option<Asset>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Released {
    pub channel: String,
    pub version: String,
    pub skills: Option<Asset>,
    pub history: Vec<Older>,
}

#[derive(Debug, Clone, Default)]
pub struct Catalogue {
    pub released: HashMap<String, Released>,
    pub used: bool,
    pub note: String,
}

#[derive(Deserialize)]
struct Body {
    format: String,
    #[serde(default)]
    products: Vec<Product>,
}

#[derive(Deserialize)]
struct Product {
    id: String,
    #[serde(default)]
    channels: HashMap<String, Release>,
}

#[derive(Deserialize)]
struct Release {
    version: String,
    #[serde(default)]
    agents: Option<ReleaseAgents>,
    #[serde(default)]
    history: Vec<Earlier>,
}

#[derive(Deserialize)]
struct Earlier {
    version: String,
    #[serde(default)]
    agents: Option<ReleaseAgents>,
}

#[derive(Deserialize)]
struct ReleaseAgents {
    #[serde(default)]
    skills: Option<Asset>,
}

pub fn keys() -> Vec<String> {
    let mut keys: Vec<String> = TRUSTED_KEYS.lines().map(str::trim).filter(|l| !l.is_empty() && !l.starts_with('#')).map(str::to_string).collect();
    if let Ok(extra) = std::env::var(KEY_ENV) {
        keys.extend(extra.split(',').map(|k| k.trim().to_string()).filter(|k| !k.is_empty()));
    }
    keys
}

fn decode(text: &str) -> Option<Vec<u8>> {
    base64::engine::general_purpose::STANDARD.decode(text.trim()).ok()
}

pub fn verify(body: &[u8], signature: &str, keys: &[String]) -> Result<(), String> {
    if keys.is_empty() {
        return Err("this build trusts no catalogue key yet".into());
    }
    let raw = decode(signature).ok_or("its signature is not valid base64")?;
    let signature = Signature::from_slice(&raw).map_err(|_| "its signature is not 64 bytes")?;
    for key in keys {
        let Some(bytes) = decode(key) else { continue };
        let Ok(array) = <[u8; 32]>::try_from(bytes.as_slice()) else { continue };
        let Ok(verifying) = VerifyingKey::from_bytes(&array) else { continue };
        if verifying.verify(body, &signature).is_ok() {
            return Ok(());
        }
    }
    Err("its signature does not match a key this build trusts".into())
}

pub fn allowed_url(source: &str) -> bool {
    source.starts_with("https://") || LOOPBACK.iter().any(|p| source.starts_with(p))
}

pub fn get(source: &str, timeout: u64, limit: u64) -> Result<Vec<u8>, String> {
    if allowed_url(source) {
        let agent = ureq::AgentBuilder::new().timeout(Duration::from_secs(timeout)).build();
        let response = agent.get(source).call().map_err(|e| e.to_string())?;
        let mut body = Vec::new();
        response.into_reader().take(limit + 1).read_to_end(&mut body).map_err(|e| e.to_string())?;
        if body.len() as u64 > limit {
            return Err(format!("{source} is larger than {limit} bytes"));
        }
        return Ok(body);
    }
    if source.starts_with("http://") {
        return Err(format!("{source} is not https"));
    }
    let path = source.strip_prefix("file://").unwrap_or(source);
    std::fs::read(path).map_err(|e| format!("{path}: {e}"))
}

fn read_source() -> Result<(Vec<u8>, Option<String>, String), String> {
    let kept = portal_root().join("catalog");
    let from_kept = || -> Result<(Vec<u8>, Option<String>, String), String> {
        let body = std::fs::read(kept.join("apps.json")).map_err(|_| "no copy kept by FormPortal".to_string())?;
        let sig = std::fs::read_to_string(kept.join("apps.json.sig")).ok().map(|s| s.trim().to_string());
        Ok((body, sig, "FormPortal's kept copy".to_string()))
    };
    if flag("FORMSKILLS_OFFLINE") {
        return from_kept();
    }
    let source = std::env::var("FORMSKILLS_CATALOG").ok().filter(|s| !s.trim().is_empty()).unwrap_or_else(|| DEFAULT_CATALOG.to_string());
    match get(&source, 8, 16 * 1024 * 1024) {
        Ok(body) => {
            let sig = get(&format!("{source}.sig"), 8, 4096).ok().map(|s| String::from_utf8_lossy(&s).trim().to_string()).filter(|s| !s.is_empty());
            Ok((body, sig, source))
        }
        Err(fetch_error) => from_kept().map_err(|_| fetch_error),
    }
}

fn released(products: Vec<Product>) -> HashMap<String, Released> {
    let mut found = HashMap::new();
    for mut product in products {
        let pick = ["stable", "beta"].into_iter().find_map(|c| product.channels.remove(c).map(|r| (c, r)));
        if let Some((channel, release)) = pick {
            let skills = release.agents.and_then(|a| a.skills);
            let history = release.history.into_iter().map(|e| Older { version: e.version, skills: e.agents.and_then(|a| a.skills) }).collect();
            found.insert(product.id, Released { channel: channel.to_string(), version: release.version, skills, history });
        }
    }
    found
}

pub fn load() -> Catalogue {
    let unused = |why: String| Catalogue { released: HashMap::new(), used: false, note: format!("the family catalogue was not used: {why}") };
    let (body, signature, from) = match read_source() {
        Ok(found) => found,
        Err(why) => return unused(why),
    };
    let trusted = match &signature {
        Some(sig) => verify(&body, sig, &keys()),
        None if flag("FORMSKILLS_ALLOW_UNSIGNED") => Ok(()),
        None => Err("it is not signed".to_string()),
    };
    if let Err(why) = trusted {
        return unused(format!("{from}: {why}"));
    }
    let parsed: Body = match serde_json::from_slice(&body) {
        Ok(b) => b,
        Err(e) => return unused(format!("{from}: not a catalogue ({e})")),
    };
    if parsed.format != CATALOG_FORMAT {
        return unused(format!("{from}: format {:?}", parsed.format));
    }
    let count = parsed.products.len();
    let signed = if signature.is_some() { "signed" } else { "unsigned, allowed by FORMSKILLS_ALLOW_UNSIGNED" };
    Catalogue { released: released(parsed.products), used: true, note: format!("the family catalogue ({from}, {signed}, {count} products)") }
}
