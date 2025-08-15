#!/bin/bash

# FEMA Services Shutdown Script
# This script stops both the webserver and client background processes

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

# PID file locations
WEBSERVER_PID_FILE="$SCRIPT_DIR/webserver.pid"
CLIENT_PID_FILE="$SCRIPT_DIR/client.pid"

print_status "Stopping FEMA Services..."

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            
            # Try graceful shutdown first
            if kill -TERM $pid 2>/dev/null; then
                # Wait up to 30 seconds for graceful shutdown
                for i in {1..30}; do
                    if ! kill -0 $pid 2>/dev/null; then
                        print_status "$service_name stopped gracefully"
                        rm -f "$pid_file"
                        return 0
                    fi
                    sleep 1
                done
                
                # Force kill if still running
                print_warning "$service_name didn't stop gracefully, forcing shutdown..."
                if kill -KILL $pid 2>/dev/null; then
                    print_status "$service_name force stopped"
                    rm -f "$pid_file"
                else
                    print_error "Failed to stop $service_name"
                    return 1
                fi
            else
                print_error "Failed to send termination signal to $service_name"
                return 1
            fi
        else
            print_warning "$service_name PID file exists but process is not running"
            rm -f "$pid_file"
        fi
    else
        print_warning "$service_name is not running (no PID file found)"
    fi
}

# Stop webserver
stop_service "Webserver" "$WEBSERVER_PID_FILE"

# Stop client
stop_service "Client" "$CLIENT_PID_FILE"

# Additional cleanup - kill any remaining processes by name
print_status "Cleaning up any remaining processes..."

# Kill any remaining dotnet processes running the webserver
pkill -f "dotnet.*rongke.fema" 2>/dev/null && print_status "Killed remaining webserver processes" || true

# Kill any remaining ng serve processes for the client
pkill -f "ng serve" 2>/dev/null && print_status "Killed remaining client processes" || true

print_status "All services stopped successfully!"
print_status ""
print_status "To start services again, run: ./start-services.sh"
