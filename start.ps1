# NEXUS AI Supply Chain Future Simulation Launcher

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  NEXUS - AI Supply Chain Future Simulation and Resilience Engine" -ForegroundColor White
Write-Host "  Dark Control Tower Edition (Agentic AI Hackathon Release)" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

Write-Host "`n[1/2] Starting NEXUS FastAPI Backend Server (Port 8000)..." -ForegroundColor Green
$BackendCmd = "Set-Location '$WorkspaceRoot\backend'; `$env:PYTHONPATH='$WorkspaceRoot\backend'; & '$WorkspaceRoot\venv\Scripts\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell.exe -ArgumentList @("-NoExit", "-Command", $BackendCmd)

Start-Sleep -Seconds 2

Write-Host "`n[2/2] Starting NEXUS React Control Tower Frontend (Port 5173)..." -ForegroundColor Green
$FrontendCmd = "Set-Location '$WorkspaceRoot\frontend'; npm run dev"
Start-Process powershell.exe -ArgumentList @("-NoExit", "-Command", $FrontendCmd)

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  NEXUS IS NOW RUNNING!" -ForegroundColor Green
Write-Host "  - Frontend Dashboard : http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend API Docs   : http://localhost:8000/docs" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
