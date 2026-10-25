pub mod apps;
pub mod catalog;
pub mod check;
pub mod edits;
pub mod fetch;
pub mod install;
pub mod library;
pub mod own;
pub mod pack;
pub mod pins;
pub mod places;
pub mod search;
pub mod skills;

pub use apps::{App, Apps};

pub const CORE_VERSION: &str = env!("CARGO_PKG_VERSION");
