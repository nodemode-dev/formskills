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
