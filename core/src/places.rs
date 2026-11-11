use std::path::PathBuf;

pub fn home() -> PathBuf {
    std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")).map(PathBuf::from).unwrap_or_default()
}

pub fn flag(name: &str) -> bool {
    std::env::var(name).map(|v| matches!(v.trim(), "1" | "true" | "yes" | "on")).unwrap_or(false)
}

pub fn data_dir() -> PathBuf {
    if let Some(dir) = std::env::var_os("FORMSKILLS_HOME") {
        return PathBuf::from(dir);
    }
    let home = home();
    if cfg!(target_os = "macos") {
        home.join("Library/Application Support/ai.nodemode.formskills")
    } else if cfg!(target_os = "windows") {
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from).unwrap_or_else(|| home.join("AppData/Local")).join("formskills")
    } else {
        std::env::var_os("XDG_DATA_HOME").map(PathBuf::from).unwrap_or_else(|| home.join(".local/share")).join("formskills")
    }
}

pub fn cache_dir() -> PathBuf {
    data_dir().join("released")
}

pub fn portal_root() -> PathBuf {
    if let Some(root) = std::env::var_os("FORMPORTAL_ROOT") {
        return PathBuf::from(root);
    }
    let home = home();
    if cfg!(target_os = "macos") {
        let (new, old) = (home.join("Library/Application Support/studio.formai.portal"), home.join("Library/Application Support/dev.formai.portal"));
        if old.is_dir() && !new.exists() { old } else { new }
    } else if cfg!(target_os = "windows") {
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from).unwrap_or_else(|| home.join("AppData/Local")).join("FormPortal")
    } else {
        std::env::var_os("XDG_DATA_HOME").map(PathBuf::from).unwrap_or_else(|| home.join(".local/share")).join("formportal")
    }
}

pub fn downloads_dir() -> PathBuf {
    if let Some(dir) = std::env::var_os("FORMSKILLS_DOWNLOADS") {
        return PathBuf::from(dir);
    }
    let downloads = home().join("Downloads");
    if downloads.is_dir() {
        downloads
    } else {
        home()
    }
}

pub fn dev_mode() -> bool {
    flag("FORMSKILLS_DEV")
}

pub fn dev_roots() -> Vec<PathBuf> {
    match std::env::var_os("FORMSKILLS_DEV_ROOTS") {
        Some(value) => std::env::split_paths(&value).filter(|p| !p.as_os_str().is_empty()).collect(),
        None => Vec::new(),
    }
}
