use std::io::Write;
use std::path::Path;

pub fn replace_file(part: &Path, target: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let written = std::fs::File::create(part).and_then(|mut file| {
        file.write_all(bytes)?;
        file.sync_all()
    });
    let renamed = written.and_then(|()| std::fs::rename(part, target));
    if renamed.is_err() {
        let _ = std::fs::remove_file(part);
    }
    renamed
}

pub fn replace_dir(part: &Path, target: &Path, aside: &Path) -> std::io::Result<()> {
    if std::fs::symlink_metadata(target).is_err() {
        return std::fs::rename(part, target);
    }
    let _ = std::fs::remove_dir_all(aside);
    std::fs::rename(target, aside)?;
    if let Err(e) = std::fs::rename(part, target) {
        let _ = std::fs::rename(aside, target);
        return Err(e);
    }
    let _ = std::fs::remove_dir_all(aside);
    Ok(())
}
