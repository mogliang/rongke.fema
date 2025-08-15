# FEMA Services Management Scripts

This directory contains shell scripts to manage both the webserver and client services as background processes.

## Scripts

### `start-services.sh`
Starts both the webserver and client as background processes using `nohup`.

**Features:**
- Checks if services are already running
- Builds both webserver and client before starting
- Installs client dependencies if needed
- Creates PID files for process management
- Logs output to separate files
- Provides graceful error handling

**Usage:**
```bash
./start-services.sh
```

### `stop-services.sh`
Stops both the webserver and client background processes.

**Features:**
- Graceful shutdown with SIGTERM first
- Force kill with SIGKILL if graceful shutdown fails
- Cleans up PID files
- Additional cleanup for any remaining processes
- 30-second timeout for graceful shutdown

**Usage:**
```bash
./stop-services.sh
```

### `status-services.sh`
Checks the status of both services.

**Features:**
- Shows PID and process status
- Checks if ports are listening
- Displays process information
- Shows log file information
- Shows last few log entries

**Usage:**
```bash
./status-services.sh
```

## Service Details

### Webserver
- **Port:** 5166
- **Environment:** Production
- **PID File:** `webserver.pid`
- **Log File:** `webserver.log`
- **URL:** http://localhost:5166

### Client
- **Port:** 4200 (Angular development server)
- **PID File:** `client.pid`
- **Log File:** `client.log`
- **URL:** http://localhost:4200

## Files Created

The scripts create several files in the root directory:

- `webserver.pid` - PID of the webserver process
- `client.pid` - PID of the client process
- `webserver.log` - Webserver output and error logs
- `client.log` - Client output and error logs

## Requirements

### Webserver
- .NET SDK installed
- Entity Framework tools (automatically installed by the script)

### Client
- Node.js and npm installed
- Angular CLI (installed as part of project dependencies)

## Troubleshooting

### Services won't start
1. Check the log files for error details
2. Ensure all dependencies are installed
3. Verify ports 5166 and 4200 are not in use by other processes
4. Make sure you have write permissions in the project directory

### Services won't stop
1. Use `./status-services.sh` to check current status
2. Manually kill processes if needed: `kill -9 <PID>`
3. Remove stale PID files if processes are not running

### Port conflicts
If you need to change the default ports:
1. Edit `start-services.sh` and modify the `ASPNETCORE_URLS` environment variable for the webserver
2. For the client, modify the Angular CLI serve command or use `ng serve --port <PORT>`

## Examples

Start services:
```bash
./start-services.sh
```

Check status:
```bash
./status-services.sh
```

Stop services:
```bash
./stop-services.sh
```

View logs:
```bash
tail -f webserver.log
tail -f client.log
```
