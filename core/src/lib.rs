pub mod apps;
pub mod catalog;
pub mod edits;
pub mod fetch;
pub mod library;
pub mod pack;
pub mod places;
pub mod skills;

pub use apps::{App, Apps};

pub const CORE_VERSION: &str = env!("CARGO_PKG_VERSION");
