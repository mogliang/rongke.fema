#!/bin/bash
# Script to generate deployment scripts for FMEA Web Server

DEPLOY_DIR="$1"
SCRIPTS_DIR="$(dirname "$0")"

if [ -z "$DEPLOY_DIR" ]; then
    echo "Usage: $0 <deploy_directory>"
    exit 1
fi

echo "Creating deployment scripts in: $DEPLOY_DIR"

# Copy Linux scripts
echo "Copying Linux scripts..."
cp "$SCRIPTS_DIR/start.sh" "$DEPLOY_DIR/"
cp "$SCRIPTS_DIR/install.sh" "$DEPLOY_DIR/"
chmod +x "$DEPLOY_DIR/start.sh"
chmod +x "$DEPLOY_DIR/install.sh"

# Copy Windows scripts
echo "Copying Windows scripts..."
cp "$SCRIPTS_DIR/start.bat" "$DEPLOY_DIR/"
cp "$SCRIPTS_DIR/install.bat" "$DEPLOY_DIR/"
cp "$SCRIPTS_DIR/install-service.bat" "$DEPLOY_DIR/"
cp "$SCRIPTS_DIR/uninstall-service.bat" "$DEPLOY_DIR/"

# Copy README
echo "Copying deployment README..."
cp "$SCRIPTS_DIR/deploy-readme.md" "$DEPLOY_DIR/README.md"

echo "Deployment scripts created successfully!"
