use std::io::Write;
use std::path::{Path, PathBuf};

use serde::Serialize;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, DateTime, ZipWriter};

use crate::library::{AppSkills, Source};
use crate::places::downloads_dir;

#[derive(Debug, Clone, Serialize)]
pub struct Saved {
    pub path: String,
    pub name: String,
    pub skills: usize,
    pub files: usize,
    pub bytes: u64,
}

fn free_name(dir: &Path, stem: &str) -> PathBuf {
    let first = dir.join(format!("{stem}.zip"));
    if !first.exists() {
        return first;
    }
    (2..1000).map(|n| dir.join(format!("{stem} ({n}).zip"))).find(|p| !p.exists()).unwrap_or(first)
}

fn label(app: &AppSkills, app_name: &str) -> String {
    match &app.source {
        Source::Release { version, .. } | Source::Kept { version, .. } => format!("{app_name}-skills-v{version}"),
        Source::Dev { .. } => format!("{app_name}-skills-checkout"),
        Source::Missing { .. } => format!("{app_name}-skills"),
    }
}

pub fn archive(app: &AppSkills, app_name: &str, skill: Option<&str>, into: Option<&Path>) -> Result<Saved, String> {
    let root = app.root.as_deref().ok_or("this app has no skills to download here")?;
    let chosen: Vec<_> = app.skills.iter().filter(|s| skill.is_none_or(|w| s.folder == w)).collect();
    if chosen.is_empty() {
        return Err(match skill {
            Some(w) => format!("{app_name} has no skill {w:?}"),
            None => format!("{app_name} has no skills to download"),
        });
    }
    let stem = match skill {
        Some(w) => w.to_string(),
        None => label(app, app_name),
    };
    let mut buffer = std::io::Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(&mut buffer);
    let stamp = DateTime::from_date_and_time(1980, 1, 1, 0, 0, 0).map_err(|e| e.to_string())?;
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated).last_modified_time(stamp).unix_permissions(0o644);
    let mut files = 0;
    for s in &chosen {
        for f in &s.files {
            let name = format!("{}/{}", s.folder, f.path);
            let data = std::fs::read(root.join(&s.folder).join(&f.path)).map_err(|e| format!("{name}: {e}"))?;
            zip.start_file(name, options).map_err(|e| e.to_string())?;
            zip.write_all(&data).map_err(|e| e.to_string())?;
            files += 1;
        }
    }
    zip.finish().map_err(|e| e.to_string())?;
    let bytes = buffer.into_inner();
    let dir = into.map(Path::to_path_buf).unwrap_or_else(downloads_dir);
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let target = free_name(&dir, &stem);
    std::fs::write(&target, &bytes).map_err(|e| format!("{}: {e}", target.display()))?;
    Ok(Saved {
        name: target.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
        path: target.display().to_string(),
        skills: chosen.len(),
        files,
        bytes: bytes.len() as u64,
    })
}
