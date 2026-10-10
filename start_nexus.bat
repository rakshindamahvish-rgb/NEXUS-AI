@echo off
title NEXUS Full-Stack Launcher
echo ==================================================================
echo   NEXUS -- AI Supply Chain Future Simulation Engine
echo ==================================================================
echo.
echo Starting Backend (FastAPI)...
start "NEXUS Backend" powershell -NoExit -Command "Set-Location '%~dp0backend'; $env:PYTHONPATH='%~dp0backend'; & '%~dp0venv\Scripts\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo Starting Frontend (React + Vite)...
start "NEXUS Frontend" powershell -NoExit -Command "Set-Location '%~dp0frontend'; npm run dev"

echo.
echo NEXUS is launching!
echo Frontend: http://localhost:5173
echo Backend Docs: http://localhost:8000/docs
