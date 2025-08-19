#!/bin/bash

# FMEA Services Status Script
# This script checks the status of both the webserver and client services

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

# Log file locations
WEBSERVER_LOG="$SCRIPT_DIR/webserver.log"
CLIENT_LOG="$SCRIPT_DIR/client.log"

echo "========================================="
echo "FMEA Services Status"
echo "========================================="

# Function to check service status
check_service_status() {
    local service_name=$1
    local pid_file=$2
    local log_file=$3
    local port=$4
    
    echo ""
    echo "--- $service_name ---"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            print_status "$service_name is running (PID: $pid)"
            
            # Check if port is listening
            if command -v netstat >/dev/null 2>&1; then
                if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                    print_status "Port $port is listening"
                else
                    print_warning "Port $port is not listening"
                fi
            elif command -v ss >/dev/null 2>&1; then
                if ss -tuln 2>/dev/null | grep -q ":$port "; then
                    print_status "Port $port is listening"
                else
                    print_warning "Port $port is not listening"
                fi
            fi
            
            # Show process info
            if command -v ps >/dev/null 2>&1; then
                echo "Process info:"
                ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null || echo "  Unable to get process info"
            fi
        else
            print_error "$service_name is not running (stale PID file)"
        fi
    else
        print_error "$service_name is not running (no PID file)"
    fi
    
    # Show log file info
    if [ -f "$log_file" ]; then
        local log_size=$(wc -c < "$log_file" 2>/dev/null || echo "0")
        local log_lines=$(wc -l < "$log_file" 2>/dev/null || echo "0")
        echo "Log file: $log_file (${log_size} bytes, ${log_lines} lines)"
        
        # Show last few lines of log if file exists and is not empty
        if [ "$log_size" -gt 0 ]; then
            echo "Last 3 log entries:"
            tail -n 3 "$log_file" 2>/dev/null | sed 's/^/  /' || echo "  Unable to read log file"
        fi
    else
        echo "Log file: Not found"
    fi
}

# Check webserver status
check_service_status "Webserver" "$WEBSERVER_PID_FILE" "$WEBSERVER_LOG" "5166"

# Check client status  
check_service_status "Client" "$CLIENT_PID_FILE" "$CLIENT_LOG" "4200"

echo ""
echo "========================================="
echo "Service URLs:"
echo "  - Webserver API: http://localhost:5166"
echo "  - Client App: http://localhost:4200"
echo ""
echo "Commands:"
echo "  - Start services: ./start-services.sh"
echo "  - Stop services: ./stop-services.sh"
echo "  - Check status: ./status-services.sh"
echo "========================================="
