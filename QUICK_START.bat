@echo off
REM Quick Start Script for CertVerify AI (Windows)
REM This script helps you get the app running in seconds

echo.
echo ════════════════════════════════════════════════════════════════
echo         CertVerify AI - Quick Start Script
echo     Certificate Verification & Tampering Detection System
echo ════════════════════════════════════════════════════════════════
echo.

echo Checking services...
echo.

REM Check Flask
echo Checking Flask ML API (http://localhost:5000)...
curl -s http://localhost:5000/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Flask ML API is RUNNING
) else (
    echo   [ERROR] Flask ML API is NOT RUNNING
    echo   Fix: Open terminal in 'ml' folder and run: python app.py
)

REM Check Node
echo Checking Node.js Backend (http://localhost:3001)...
curl -s http://localhost:3001/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Node.js Backend is RUNNING
) else (
    echo   [ERROR] Node.js Backend is NOT RUNNING
    echo   Fix: Open terminal in 'server' folder and run: npm start
)

REM Check Frontend
echo Checking React Frontend (http://localhost:5173)...
curl -s http://localhost:5173 > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] React Frontend is RUNNING
) else (
    echo   [ERROR] React Frontend is NOT RUNNING
    echo   Fix: Open terminal in 'client' folder and run: npm run dev
)

echo.
echo ════════════════════════════════════════════════════════════════
echo  READY TO USE!
echo  Open browser: http://localhost:5173
echo.
echo  Test Credentials:
echo  Email: test@test.com
echo  Password: test123
echo ════════════════════════════════════════════════════════════════
echo.
echo Quick Steps:
echo   1. Open browser: http://localhost:5173
echo   2. Login with: test@test.com / test123
echo   3. Click 'Choose File' - select any image (JPG, PNG, PDF)
echo   4. Click 'Analyse Certificate'
echo   5. Wait 2-3 seconds for analysis
echo   6. View results with verdict and confidence score
echo   7. Download report (optional)
echo.
pause
