@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul || (echo Node 20.19 or newer is required: https://nodejs.org & exit /b 1)
where cargo >nul 2>nul || (echo Rust is required: https://rustup.rs & exit /b 1)

pushd frontend
call npm install || (popd & exit /b 1)
popd
cargo fetch --locked || exit /b 1

echo.
echo formskills is ready to run from source. Start the window with: formskills.bat
echo The apps that ship skills on the command line: formskills.bat cli apps
