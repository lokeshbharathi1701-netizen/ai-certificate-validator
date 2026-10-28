@echo off
REM START ALL SERVICES - CertVerify AI
REM This batch file opens all 3 services in separate terminals

echo.
echo ════════════════════════════════════════════════════════════════
echo         CertVerify AI - Starting All Services
echo ════════════════════════════════════════════════════════════════
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

echo Starting services... Please wait!
echo.

REM Start Flask ML API
echo [1/3] Starting Flask ML API on port 5000...
cd "%SCRIPT_DIR%ml"
if exist "%SCRIPT_DIR%.venv\Scripts\python.exe" (
    start "Flask ML API" cmd /k ""%SCRIPT_DIR%.venv\Scripts\python.exe" app.py"
) else (
    start "Flask ML API" cmd /k "python app.py"
)
timeout /t 3 /nobreak

REM Start Node.js Backend
echo [2/3] Starting Node.js Backend on port 3001...
cd "%SCRIPT_DIR%server"
start "Node.js Backend" cmd /k "npm start"
timeout /t 3 /nobreak

REM Start React Frontend
echo [3/3] Starting React Frontend on port 5173...
cd "%SCRIPT_DIR%client"
start "React Frontend" cmd /k "npm run dev -- --host 0.0.0.0"
timeout /t 3 /nobreak

echo.
echo ════════════════════════════════════════════════════════════════
echo         All services started!
echo ════════════════════════════════════════════════════════════════
echo.
echo Open your browser and go to:
echo   http://localhost:5173
echo.
echo Test Login Credentials:
echo   Email: test@test.com
echo   Password: test123
echo.
echo If you see 3 new terminals above, all services are starting.
echo Allow 10-15 seconds for everything to initialize.
echo.
echo Close this window when done.
echo ════════════════════════════════════════════════════════════════
echo.
pause
