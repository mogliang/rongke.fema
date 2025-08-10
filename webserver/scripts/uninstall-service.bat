@echo off
REM This script uninstalls the FEMA Web Server Windows Service
REM Run this script as Administrator
set SERVICE_NAME=FEMAWebServer

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script must be run as Administrator
    pause
    exit /b 1
)

echo Stopping and removing FEMA Web Server service...
sc stop "%SERVICE_NAME%"
timeout /t 5 /nobreak
sc delete "%SERVICE_NAME%"
echo Service uninstalled successfully!
pause
