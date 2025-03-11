@echo off
setlocal enabledelayedexpansion enableextensions

rem -------------------------------------------------------------
rem AI Code Fusion - Build Script for Windows
rem -------------------------------------------------------------

rem Ensure we're in the correct directory
set "MAKE_ROOT=%~dp0"
cd /d "%MAKE_ROOT%"

rem Make scripts executable if coming from Unix/WSL
if exist ".git" (
  git update-index --chmod=+x scripts/index.js >nul 2>&1
  git update-index --chmod=+x scripts/lib/*.js >nul 2>&1
)

rem Special handling for release command to pass version
if /i "%1"=="release" (
  if "%2"=="" (
    echo Error: Version argument is required for release command
    echo Usage: make release ^<version^>
    echo Example: make release 1.0.0
    exit /b 1
  )
  scripts\index.js release %2
  exit /b %errorlevel%
)

rem Run the command through our unified Node.js script
node scripts/index.js %*
exit /b %errorlevel%
