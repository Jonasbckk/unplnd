@echo off
rem Double-click to refresh the UNPLND numbers in the Obsidian vault.
cd /d "%~dp0.."
node scripts/sync-vault.mjs
echo.
pause
