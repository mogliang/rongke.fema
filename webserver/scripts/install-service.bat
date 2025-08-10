@echo off
REM This script installs the FEMA Web Server as a Windows Service
REM Run this script as Administrator
echo Installing FEMA Web Server as Windows Service...
set SERVICE_NAME=FEMAWebServer
set SERVICE_DISPLAY_NAME=FEMA Web Server
set SERVICE_DESCRIPTION=FMEA Web Application Server
set APP_PATH=%~dp0app\rongke.fema.exe

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script must be run as Administrator
    pause
    exit /b 1
)

REM Stop service if it exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo Stopping existing service...
    sc stop "%SERVICE_NAME%"
    timeout /t 5 /nobreak
    sc delete "%SERVICE_NAME%"
)

REM Create the service
echo Creating Windows Service...
sc create "%SERVICE_NAME%" binPath= "\"%APP_PATH%\"" DisplayName= "%SERVICE_DISPLAY_NAME%" start= auto
sc description "%SERVICE_NAME%" "%SERVICE_DESCRIPTION%"

REM Set environment variables for the service
reg add "HKLM\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%" /v Environment /t REG_MULTI_SZ /d "ASPNETCORE_ENVIRONMENT=Production\0ASPNETCORE_URLS=http://0.0.0.0:5000" /f

REM Start the service
echo Starting service...
sc start "%SERVICE_NAME%"

echo Service installation completed!
echo Service Name: %SERVICE_NAME%
echo The FEMA Web Server is now running as a Windows Service on port 5000
pause
