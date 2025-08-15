#!/bin/bash

# FEMA Services Startup Script
# This script starts both the webserver and client as background processes using nohup

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
WEBSERVER_DIR="$SCRIPT_DIR/webserver"
CLIENT_DIR="$SCRIPT_DIR/fema-web-client"

# PID file locations
WEBSERVER_PID_FILE="$SCRIPT_DIR/webserver.pid"
CLIENT_PID_FILE="$SCRIPT_DIR/client.pid"

# Log file locations
WEBSERVER_LOG="$SCRIPT_DIR/webserver.log"
CLIENT_LOG="$SCRIPT_DIR/client.log"

print_status "Starting FEMA Services..."

# Check if services are already running
if [ -f "$WEBSERVER_PID_FILE" ] && kill -0 $(cat "$WEBSERVER_PID_FILE") 2>/dev/null; then
    print_warning "Webserver is already running (PID: $(cat $WEBSERVER_PID_FILE))"
else
    print_status "Starting webserver..."
    
    # Check if webserver directory exists
    if [ ! -d "$WEBSERVER_DIR" ]; then
        print_error "Webserver directory not found: $WEBSERVER_DIR"
        exit 1
    fi
    
    cd "$WEBSERVER_DIR"
    
    # Build the webserver if needed
    print_status "Building webserver..."
    if ! dotnet build rongke.fema.csproj --configuration Release; then
        print_error "Failed to build webserver"
        exit 1
    fi
    
    # Start webserver with nohup
    export ASPNETCORE_ENVIRONMENT=Production
    export ASPNETCORE_URLS=http://0.0.0.0:5166
    
    nohup dotnet run --project rongke.fema.csproj --configuration Release --urls "http://0.0.0.0:5166" > "$WEBSERVER_LOG" 2>&1 &
    WEBSERVER_PID=$!
    echo $WEBSERVER_PID > "$WEBSERVER_PID_FILE"
    
    print_status "Webserver started with PID: $WEBSERVER_PID"
    print_status "Webserver logs: $WEBSERVER_LOG"
    
    # Wait a moment to ensure the webserver starts properly
    sleep 3
    if ! kill -0 $WEBSERVER_PID 2>/dev/null; then
        print_error "Webserver failed to start. Check logs: $WEBSERVER_LOG"
        rm -f "$WEBSERVER_PID_FILE"
        exit 1
    fi
fi

# Check if client is already running
if [ -f "$CLIENT_PID_FILE" ] && kill -0 $(cat "$CLIENT_PID_FILE") 2>/dev/null; then
    print_warning "Client is already running (PID: $(cat $CLIENT_PID_FILE))"
else
    print_status "Starting client..."
    
    # Check if client directory exists
    if [ ! -d "$CLIENT_DIR" ]; then
        print_error "Client directory not found: $CLIENT_DIR"
        exit 1
    fi
    
    cd "$CLIENT_DIR"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing client dependencies..."
        if ! npm install; then
            print_error "Failed to install client dependencies"
            exit 1
        fi
    fi
    
    # Build the client for production
    print_status "Building client..."
    if ! npm run build -- --configuration=production; then
        print_error "Failed to build client"
        exit 1
    fi
    
    # Start client development server with nohup
    nohup npx ng serve --host 0.0.0.0 --port 4200 > "$CLIENT_LOG" 2>&1 &
    CLIENT_PID=$!
    echo $CLIENT_PID > "$CLIENT_PID_FILE"
    
    print_status "Client started with PID: $CLIENT_PID"
    print_status "Client logs: $CLIENT_LOG"
    
    # Wait a moment to ensure the client starts properly
    sleep 3
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        print_error "Client failed to start. Check logs: $CLIENT_LOG"
        rm -f "$CLIENT_PID_FILE"
        exit 1
    fi
fi

print_status "All services started successfully!"
print_status ""
print_status "Service URLs:"
print_status "  - Webserver API: http://localhost:5166"
print_status "  - Client App: http://localhost:4200"
print_status ""
print_status "Log files:"
print_status "  - Webserver: $WEBSERVER_LOG"
print_status "  - Client: $CLIENT_LOG"
print_status ""
print_status "To stop services, run: ./stop-services.sh"
