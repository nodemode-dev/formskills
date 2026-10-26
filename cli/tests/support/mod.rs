#![allow(dead_code)]

use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;

use base64::Engine;
use ed25519_dalek::{Signer, SigningKey};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

pub const BIN: &str = env!("CARGO_BIN_EXE_formskills-cli");

pub struct Sandbox {
    pub root: PathBuf,
}

impl Sandbox {
    pub fn new(tag: &str) -> Sandbox {
        static N: AtomicUsize = AtomicUsize::new(0);
        let root = std::env::temp_dir().join(format!("formskills-test-{}-{tag}-{}", std::process::id(), N.fetch_add(1, Ordering::SeqCst)));
        let _ = std::fs::remove_dir_all(&root);
        for dir in ["home/Downloads", "formskills", "portal", "dev", "catalogue"] {
            std::fs::create_dir_all(root.join(dir)).unwrap();
        }
        Sandbox { root }
    }

    pub fn path(&self, rel: &str) -> PathBuf {
        self.root.join(rel)
    }

    pub fn command(&self) -> Command {
        let mut c = Command::new(BIN);
        c.env_clear()
            .env("HOME", self.path("home"))
            .env("USERPROFILE", self.path("home"))
            .env("XDG_DATA_HOME", self.path("home/.local/share"))
            .env("FORMSKILLS_HOME", self.path("formskills"))
            .env("FORMSKILLS_DOWNLOADS", self.path("home/Downloads"))
            .env("FORMPORTAL_ROOT", self.path("portal"))
            .env("FORMSKILLS_CATALOG", self.path("catalogue/apps.json"))
            .stdin(Stdio::null());
        c
    }

    pub fn run(&self, args: &[&str], extra: &[(&str, &str)]) -> (bool, String, String) {
        let mut c = self.command();
        for (k, v) in extra {
            c.env(k, v);
        }
        let out = c.args(args).output().unwrap();
        (out.status.success(), String::from_utf8_lossy(&out.stdout).into_owned(), String::from_utf8_lossy(&out.stderr).into_owned())
    }

    pub fn json(&self, args: &[&str], extra: &[(&str, &str)]) -> Value {
        let (ok, out, err) = self.run(args, extra);
        assert!(ok, "{args:?}: {err}");
        serde_json::from_str(&out).unwrap_or_else(|e| panic!("{args:?} printed no JSON ({e}): {out}"))
    }

    pub fn app<'a>(&self, listing: &'a Value, id: &str) -> &'a Value {
        listing["apps"].as_array().unwrap().iter().find(|a| a["id"] == id).unwrap_or_else(|| panic!("{id} not in {listing}"))
    }

    pub fn kept_files(&self) -> Vec<String> {
        let mut found = Vec::new();
        tree(&self.path("formskills/released"), "", &mut found);
        found
    }
}

impl Drop for Sandbox {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

fn tree(dir: &Path, prefix: &str, out: &mut Vec<String>) {
    let Ok(read) = std::fs::read_dir(dir) else { return };
    let mut entries: Vec<_> = read.flatten().collect();
    entries.sort_by_key(|e| e.file_name());
    for e in entries {
        let rel = format!("{prefix}{}", e.file_name().to_string_lossy());
        if e.path().is_dir() {
            tree(&e.path(), &format!("{rel}/"), out);
        } else {
            out.push(rel);
        }
    }
}

pub fn key(seed: u8) -> SigningKey {
    SigningKey::from_bytes(&[seed; 32])
}

pub fn public(key: &SigningKey) -> String {
    base64::engine::general_purpose::STANDARD.encode(key.verifying_key().to_bytes())
}

pub fn hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes).iter().map(|b| format!("{b:02x}")).collect()
}

pub fn write_catalogue(sandbox: &Sandbox, products: &[Value], signer: Option<&SigningKey>) {
    let body = json!({ "format": "formai-catalog", "format_version": 1, "generated": "2026-10-26T00:00:00Z", "origin": "test", "products": products }).to_string();
    std::fs::write(sandbox.path("catalogue/apps.json"), &body).unwrap();
    let sig = sandbox.path("catalogue/apps.json.sig");
    match signer {
        Some(k) => std::fs::write(sig, base64::engine::general_purpose::STANDARD.encode(k.sign(body.as_bytes()).to_bytes())).unwrap(),
        None => {
            let _ = std::fs::remove_file(sig);
        }
    }
}

pub fn asset(server: &Server, file: &str, bytes: &[u8]) -> Value {
    server.put(file, bytes.to_vec());
    json!({ "file": file, "url": server.url(file), "bytes": bytes.len(), "sha256": hex(bytes) })
}

pub fn product(id: &str, version: &str, skills: Option<Value>, history: Vec<Value>) -> Value {
    let agents = match skills {
        Some(a) => json!({ "mcp": false, "skills": a }),
        None => json!({ "mcp": false }),
    };
    json!({ "id": id, "channels": { "stable": { "version": version, "agents": agents, "history": history } } })
}

pub fn older(version: &str, skills: Value) -> Value {
    json!({ "version": version, "agents": { "skills": skills } })
}

pub fn skill_card(name: &str, body: &str) -> String {
    format!("---\nname: {name}\ndescription: Tests {name} for the family test suite.\n---\n\n# {name}\n\n{body}\n")
}

pub fn zip_of(entries: &[(&str, &str)]) -> Vec<u8> {
    let mut buffer = std::io::Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut buffer);
        let options = SimpleFileOptions::default();
        for (name, text) in entries {
            zip.start_file(*name, options).unwrap();
            zip.write_all(text.as_bytes()).unwrap();
        }
        zip.finish().unwrap();
    }
    buffer.into_inner()
}

pub fn zip_with_link(name: &str, target: &str) -> Vec<u8> {
    let mut buffer = std::io::Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut buffer);
        zip.start_file("one/SKILL.md", SimpleFileOptions::default()).unwrap();
        zip.write_all(skill_card("one", "Body.").as_bytes()).unwrap();
        zip.add_symlink(name, target, SimpleFileOptions::default()).unwrap();
        zip.finish().unwrap();
    }
    buffer.into_inner()
}

pub fn read_zip(path: &Path) -> HashMap<String, String> {
    let mut archive = zip::ZipArchive::new(std::fs::File::open(path).unwrap()).unwrap();
    let mut found = HashMap::new();
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).unwrap();
        let mut text = String::new();
        entry.read_to_string(&mut text).unwrap();
        found.insert(entry.name().to_string(), text);
    }
    found
}

pub struct Server {
    port: u16,
    files: Arc<Mutex<HashMap<String, Vec<u8>>>>,
    pub hits: Arc<Mutex<Vec<String>>>,
}

impl Server {
    pub fn start() -> Server {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let files: Arc<Mutex<HashMap<String, Vec<u8>>>> = Arc::default();
        let hits: Arc<Mutex<Vec<String>>> = Arc::default();
        let (f, h) = (files.clone(), hits.clone());
        thread::spawn(move || {
            for stream in listener.incoming() {
                let Ok(mut stream) = stream else { continue };
                let mut head = Vec::new();
                let mut byte = [0u8; 1];
                while !head.ends_with(b"\r\n\r\n") && stream.read(&mut byte).map(|n| n == 1).unwrap_or(false) {
                    head.push(byte[0]);
                }
                let text = String::from_utf8_lossy(&head);
                let path = text.split_whitespace().nth(1).unwrap_or("/").trim_start_matches('/').to_string();
                h.lock().unwrap().push(path.clone());
                let body = f.lock().unwrap().get(&path).cloned();
                let reply = match body {
                    Some(b) => [format!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", b.len()).into_bytes(), b].concat(),
                    None => b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".to_vec(),
                };
                let _ = stream.write_all(&reply);
            }
        });
        Server { port, files, hits }
    }

    pub fn put(&self, file: &str, bytes: Vec<u8>) {
        self.files.lock().unwrap().insert(file.to_string(), bytes);
    }

    pub fn url(&self, file: &str) -> String {
        format!("http://127.0.0.1:{}/{file}", self.port)
    }

    pub fn fetched(&self, file: &str) -> usize {
        self.hits.lock().unwrap().iter().filter(|h| *h == file).count()
    }
}
