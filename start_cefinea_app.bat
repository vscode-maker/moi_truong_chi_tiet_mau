@echo off
echo Starting CEFINEA App...
echo 1. Starting API Server (Node.js)...
start "CEFINEA API Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo 2. Starting React App (Vite)...
cd cefinea-react
start "CEFINEA React App" cmd /k "npm run dev"

echo Done! Browser should open shortly.
pause
