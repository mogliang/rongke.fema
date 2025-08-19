# FMEA Web Server Deployment Package

This package contains everything needed to deploy the FMEA Web Server on both Linux and Windows.

## Linux Installation

1. Extract this package to your target server
2. Run the install script: `./install.sh`
3. Start the application: `./start.sh`

## Windows Installation

### Option 1: Run as Console Application
1. Extract this package to your target server
2. Run the install script: `install.bat`
3. Start the application: `start.bat`

### Option 2: Install as Windows Service (Recommended for Production)
1. Extract this package to your target server
2. Run `install.bat` first to verify .NET Runtime
3. Run `install-service.bat` **as Administrator** to install as Windows Service
4. The service will start automatically and run on system startup
5. To uninstall the service, run `uninstall-service.bat` **as Administrator**

## Contents

- `app/` - Application binaries and configuration
- Linux Scripts:
  - `start.sh` - Start the application on Linux
  - `install.sh` - Install .NET runtime on Linux
- Windows Scripts:
  - `start.bat` - Start the application on Windows
  - `install.bat` - Verify .NET runtime on Windows
  - `install-service.bat` - Install as Windows Service (run as Administrator)
  - `uninstall-service.bat` - Uninstall Windows Service (run as Administrator)

## Configuration

The application will run on port 5000 by default.
Edit `app/appsettings.Production.json` to modify configuration.

## Database

SQLite database file is included at `app/bin/app.db`

## Windows Service Management

If installed as a Windows Service, you can manage it using:
- Services.msc (GUI)
- Command line: `sc start FMEAWebServer`, `sc stop FMEAWebServer`
- PowerShell: `Start-Service FMEAWebServer`, `Stop-Service FMEAWebServer`

## Firewall Configuration

Make sure port 5000 is open in your firewall:
- Linux: `sudo ufw allow 5000`
- Windows: Use Windows Defender Firewall to allow port 5000
