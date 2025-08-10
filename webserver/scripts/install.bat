@echo off
echo Installing .NET Runtime if not already installed...
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo .NET Runtime not found. Please install .NET 9.0 Runtime manually.
    echo Download from: https://dotnet.microsoft.com/download/dotnet/9.0
    echo After installation, run start.bat to start the application.
    pause
    exit /b 1
) else (
    echo .NET Runtime is already installed
    echo Installation complete. Run start.bat to start the application.
)
pause
