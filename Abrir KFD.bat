@echo off
cd /d "%~dp0"
echo Abriendo KFD App...
start "" http://localhost:5500/KFD%%20App.html
npx --yes serve . -p 5500 -s --no-clipboard >nul 2>&1
