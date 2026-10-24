pub mod apps;

pub use apps::{App, Apps, Source};

pub const CORE_VERSION: &str = env!("CARGO_PKG_VERSION");
