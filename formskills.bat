@echo off
setlocal
cd /d "%~dp0"

if /I "%~1"=="dev" (
  set "FORMSKILLS_DEV=1"
  if not defined FORMSKILLS_DEV_ROOTS for %%I in ("%~dp0..") do set "FORMSKILLS_DEV_ROOTS=%%~fI"
  shift
)
if /I "%~1"=="cli" goto cli
if /I "%~1"=="apps" goto apps

where cargo >nul 2>nul || (echo Rust is required: https://rustup.rs. Then run formskills_oc_install.bat & exit /b 1)
if not exist frontend\node_modules (echo Run formskills_oc_install.bat first. & exit /b 1)

start "formskills interface" /b cmd /c "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul
cargo run -p formskills -- %*
exit /b %errorlevel%

:cli
shift
cargo build -q --release --locked -p formskills-cli 1>&2 || exit /b 1
set "RUN=target\release\formskills-cli.exe"
goto collect

:apps
shift
set "RUN=python setup\apps.py"
goto collect

:collect
set "ARGS="
:more
if "%~1"=="" goto run
set ARGS=%ARGS% %1
shift
goto more

:run
%RUN%%ARGS%
exit /b %errorlevel%
