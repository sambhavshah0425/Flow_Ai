@echo off
rem One-click local start for Windows: opens the backend and the website in
rem their own windows, then the browser. Close those two windows to stop.
cd /d "%~dp0"

if not exist "backend\node_modules" (
  echo Installing backend packages...
  pushd backend & call npm install & popd
)
if not exist "frontend\node_modules" (
  echo Installing frontend packages...
  pushd frontend & call npm install & popd
)
if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul

start "FlowAi Backend - keep open" /D "%~dp0backend" cmd /k npm run dev
rem Give the backend a head start before the website opens
timeout /t 5 /nobreak >nul
start "FlowAi Website - keep open" /D "%~dp0frontend" cmd /k npm run dev -- --open
