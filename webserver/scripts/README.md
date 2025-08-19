# Scripts Directory

This directory contains all deployment and utility scripts for the FMEA Web Server project.

## Deployment Scripts

These scripts are used to generate deployment packages:

### `generate-deployment-scripts.sh`
Main script generator that copies all deployment scripts to a target directory.
- **Usage**: `./generate-deployment-scripts.sh <deploy_directory>`
- **Purpose**: Used by the Makefile `deploy-package` target to create deployment packages

### Linux Scripts

#### `start.sh`
Starts the FMEA Web Server application on Linux systems.
- **Environment**: Production
- **Port**: 5000
- **Usage**: `./start.sh`

#### `install.sh`
Installs .NET Runtime on Linux systems if not already present.
- **Supports**: Ubuntu 20.04 (can be modified for other distributions)
- **Usage**: `./install.sh`

### Windows Scripts

#### `start.bat`
Starts the FMEA Web Server application on Windows systems.
- **Environment**: Production
- **Port**: 5000
- **Usage**: Double-click or run from command prompt

#### `install.bat`
Verifies .NET Runtime installation on Windows systems.
- **Usage**: Double-click or run from command prompt

#### `install-service.bat`
Installs the FMEA Web Server as a Windows Service.
- **Requirements**: Must be run as Administrator
- **Service Name**: FMEAWebServer
- **Usage**: Right-click -> "Run as administrator"

#### `uninstall-service.bat`
Uninstalls the FMEA Web Server Windows Service.
- **Requirements**: Must be run as Administrator
- **Usage**: Right-click -> "Run as administrator"

## Documentation Templates

#### `deploy-readme.md`
Template for deployment package README file.
- **Purpose**: Provides deployment instructions for both Linux and Windows
- **Usage**: Automatically copied to deployment packages

## Usage in Makefile

The scripts are integrated into the Makefile build system:

```bash
# Create a complete deployment package
make deploy-package

# List available scripts
make scripts-list

# Make shell scripts executable
make scripts-exec
```

## Maintenance

When updating deployment scripts:

1. Edit the script files in this directory
2. Test the scripts individually
3. Run `make deploy-package` to test the integration
4. Commit changes to version control

## Script Permissions

Linux shell scripts (`.sh` files) should be executable:
```bash
chmod +x scripts/*.sh
```

Or use the Makefile target:
```bash
make scripts-exec
```
