use serde::{Deserialize, Serialize};

const BUNDLED: &str = include_str!("../data/apps.json");
pub const APPS_FORMAT: &str = "formskills-apps";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct App {
    pub id: String,
    pub app: String,
    pub name: String,
    pub kind: String,
    pub summary: String,
    pub repository: String,
    pub skills: String,
    pub state: String,
    pub released: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Source {
    pub repository: String,
    pub version: String,
    pub commit: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Apps {
    pub format: String,
    pub format_version: u32,
    pub source: Source,
    pub apps: Vec<App>,
}

impl Apps {
    pub fn bundled() -> Result<Apps, String> {
        let apps: Apps = serde_json::from_str(BUNDLED).map_err(|e| format!("the bundled app list is not valid ({e}); regenerate it with setup/apps.py"))?;
        if apps.format != APPS_FORMAT {
            return Err(format!("the bundled app list has format {:?}, not {APPS_FORMAT:?}", apps.format));
        }
        Ok(apps)
    }

    pub fn get(&self, name: &str) -> Option<&App> {
        let wanted = name.trim().to_lowercase();
        self.apps.iter().find(|a| a.id == wanted || a.app.to_lowercase() == wanted || a.name.to_lowercase() == wanted)
    }

    pub fn describe_source(&self) -> String {
        let commit: String = self.source.commit.chars().take(7).collect();
        if self.source.version.is_empty() {
            format!("bundled list from {} at {commit}", self.source.repository)
        } else {
            format!("bundled list from {} {} ({commit})", self.source.repository, self.source.version)
        }
    }
}
