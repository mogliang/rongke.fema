# FMEA Web Server

This is the backend API server for the FMEA (Failure Mode and Effects Analysis) application.

## Quick Start

### First Time Setup
```bash
# Complete setup (installs tools, restores packages, builds, and initializes database)
make setup

# Run the server
make run
```

### Development Workflow
```bash
# Run with hot reload (recommended for development)
make watch

# Or run in development mode
make dev
```

## Makefile Commands

### Essential Commands
- `make setup` - Complete first-time setup
- `make run` - Run the application
- `make watch` - Run with file watching (auto-restart on changes)
- `make dev` - Run in development mode

### Database Management
- `make db-init` - Initialize database (first time)
- `make db-migrate` - Add new migration with auto-generated name
- `make db-migrate-named NAME=YourName` - Add migration with custom name
- `make db-update` - Update database to latest migration
- `make db-reset` - Reset database (WARNING: deletes all data)
- `make db-list-migrations` - List all migrations
- `make db-rollback MIGRATION=MigrationName` - Rollback to specific migration

### Build & Development
- `make build` - Build the project
- `make clean` - Clean build artifacts
- `make test` - Run tests
- `make format` - Format code
- `make publish` - Publish for production

### Utilities
- `make help` - Show all available commands
- `make status` - Show project status
- `make install-ef` - Install/update Entity Framework tools

## Database

The application uses SQLite database stored in `bin/app.db`. The database schema is managed through Entity Framework migrations.

## API Documentation

When running, the API documentation is available at:
- Swagger UI: http://localhost:5000/swagger

## Configuration

- `appsettings.json` - Production configuration
- `appsettings.Development.json` - Development configuration

## Port Configuration

Default port is 5000. You can change it by modifying the `PORT` variable in the Makefile or by setting the `--urls` parameter when running manually.

## note
add below to sh or zsh profile
```sh
export PATH="$PATH:$HOME/.dotnet"
export PATH="$PATH:$HOME/.dotnet/tools"
export DOTNET_ROOT="$HOME/.dotnet"
```