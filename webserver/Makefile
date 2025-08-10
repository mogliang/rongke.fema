# Makefile for FEMA Web Server
# This Makefile provides commands to setup, manage database migrations, and run the application

# Variables
PROJECT_FILE = rongke.fema.csproj
DB_CONTEXT = AppDbContext
MIGRATION_NAME = AutoMigration_$(shell date +%Y%m%d_%H%M%S)
PORT = 5166

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

.PHONY: help install-ef restore build clean db-init db-migrate db-update db-reset run dev watch setup all deploy-package

help: ## Show this help message
	@echo "$(GREEN)FEMA Web Server Makefile$(NC)"
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-ef: ## Install dotnet Entity Framework tools globally
	@echo "$(GREEN)Installing dotnet Entity Framework tools...$(NC)"
	dotnet tool install --global dotnet-ef --version 9.0.7 || dotnet tool update --global dotnet-ef --version 9.0.7
	@echo "$(GREEN)EF tools installed/updated successfully$(NC)"

restore: ## Restore NuGet packages
	@echo "$(GREEN)Restoring NuGet packages...$(NC)"
	dotnet restore $(PROJECT_FILE)

build: restore ## Build the project
	@echo "$(GREEN)Building project...$(NC)"
	dotnet build $(PROJECT_FILE) --no-restore

clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	dotnet clean $(PROJECT_FILE)
	rm -rf bin/
	rm -rf obj/

db-init: install-ef restore ## Initialize database (first time setup)
	@echo "$(GREEN)Initializing database...$(NC)"
	@if [ ! -f "Migrations/AppDbContextModelSnapshot.cs" ]; then \
		echo "$(YELLOW)No existing migrations found. Creating initial migration...$(NC)"; \
		dotnet ef migrations add InitialCreate --context $(DB_CONTEXT); \
	else \
		echo "$(YELLOW)Migrations already exist. Skipping initial migration.$(NC)"; \
	fi
	@echo "$(GREEN)Updating database...$(NC)"
	dotnet ef database update --context $(DB_CONTEXT)
	@echo "$(GREEN)Database initialized successfully$(NC)"

db-migrate: install-ef ## Add a new migration with auto-generated name
	@echo "$(GREEN)Adding new migration: $(MIGRATION_NAME)$(NC)"
	dotnet ef migrations add $(MIGRATION_NAME) --context $(DB_CONTEXT)
	@echo "$(GREEN)Migration added successfully$(NC)"

db-migrate-named: install-ef ## Add a new migration with custom name (usage: make db-migrate-named NAME=YourMigrationName)
	@if [ -z "$(NAME)" ]; then \
		echo "$(RED)Error: Please provide a migration name using NAME=YourMigrationName$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Adding new migration: $(NAME)$(NC)"
	dotnet ef migrations add $(NAME) --context $(DB_CONTEXT)
	@echo "$(GREEN)Migration '$(NAME)' added successfully$(NC)"

db-update: install-ef ## Update database to latest migration
	@echo "$(GREEN)Updating database to latest migration...$(NC)"
	dotnet ef database update --context $(DB_CONTEXT)
	@echo "$(GREEN)Database updated successfully$(NC)"

db-rollback: install-ef ## Rollback database to previous migration (usage: make db-rollback MIGRATION=MigrationName)
	@if [ -z "$(MIGRATION)" ]; then \
		echo "$(RED)Error: Please provide a migration name using MIGRATION=MigrationName$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Rolling back database to migration: $(MIGRATION)$(NC)"
	dotnet ef database update $(MIGRATION) --context $(DB_CONTEXT)
	@echo "$(GREEN)Database rolled back successfully$(NC)"

db-remove-last: install-ef ## Remove the last migration
	@echo "$(YELLOW)Removing last migration...$(NC)"
	dotnet ef migrations remove --context $(DB_CONTEXT)
	@echo "$(GREEN)Last migration removed successfully$(NC)"

db-reset: install-ef ## Reset database (drop and recreate)
	@echo "$(YELLOW)Resetting database...$(NC)"
	@read -p "Are you sure you want to reset the database? This will delete all data! (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		dotnet ef database drop --context $(DB_CONTEXT) --force; \
		dotnet ef database update --context $(DB_CONTEXT); \
		echo "$(GREEN)Database reset successfully$(NC)"; \
	else \
		echo "$(YELLOW)Database reset cancelled$(NC)"; \
	fi

db-list-migrations: install-ef ## List all migrations
	@echo "$(GREEN)Listing all migrations:$(NC)"
	dotnet ef migrations list --context $(DB_CONTEXT)

db-info: install-ef ## Show database information
	@echo "$(GREEN)Database information:$(NC)"
	dotnet ef dbcontext info --context $(DB_CONTEXT)

run: build ## Run the application
	@echo "$(GREEN)Starting FEMA Web Server on port $(PORT)...$(NC)"
	dotnet run --project $(PROJECT_FILE) --urls "http://localhost:$(PORT)"

dev: build ## Run the application in development mode with hot reload
	@echo "$(GREEN)Starting FEMA Web Server in development mode...$(NC)"
	dotnet run --project $(PROJECT_FILE) --environment Development --urls "http://localhost:$(PORT)"

watch: ## Run the application with file watching (auto-restart on changes)
	@echo "$(GREEN)Starting FEMA Web Server with file watching...$(NC)"
	dotnet watch --project $(PROJECT_FILE) --urls "http://localhost:$(PORT)"

test: build ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	dotnet test

setup: install-ef restore build db-init ## Complete setup (install tools, restore, build, init database)
	@echo "$(GREEN)Setup completed successfully!$(NC)"
	@echo "$(YELLOW)You can now run 'make run' to start the server$(NC)"

all: setup run ## Setup everything and run the server

# Development helpers
format: ## Format code using dotnet format
	@echo "$(GREEN)Formatting code...$(NC)"
	dotnet format $(PROJECT_FILE)

check: ## Check for code issues
	@echo "$(GREEN)Checking code...$(NC)"
	dotnet format $(PROJECT_FILE) --verify-no-changes --verbosity diagnostic

# Script management
scripts-list: ## List available scripts in scripts/ directory
	@echo "$(GREEN)Available scripts in scripts/ directory:$(NC)"
	@ls -la scripts/

scripts-exec: ## Make all shell scripts executable
	@echo "$(GREEN)Making shell scripts executable...$(NC)"
	@chmod +x scripts/*.sh
	@echo "$(GREEN)Scripts are now executable$(NC)"

# Production helpers
publish: build ## Publish the application for production
	@echo "$(GREEN)Publishing application for production...$(NC)"
	dotnet publish $(PROJECT_FILE) -c Release -o ./publish

deploy-package: build db-update ## Create complete deployment package with binaries, database, and production settings
	@echo "$(GREEN)Creating deployment package...$(NC)"
	
	# Clean and create deployment directory
	@rm -rf ./deploy
	@mkdir -p ./deploy
	
	# Publish application binaries
	@echo "$(YELLOW)Publishing application binaries...$(NC)"
	dotnet publish $(PROJECT_FILE) -c Release -o ./deploy/app --self-contained false --runtime linux-x64
	
	# Copy database if it exists
	@echo "$(YELLOW)Copying database...$(NC)"
	@if [ -f "./bin/app.db" ]; then \
		mkdir -p ./deploy/app/bin; \
		cp ./bin/app.db ./deploy/app/bin/; \
		echo "Database copied successfully"; \
	else \
		echo "$(YELLOW)Warning: Database file not found. Run 'make db-init' first.$(NC)"; \
	fi
	
	# Copy production appsettings
	@echo "$(YELLOW)Copying production configuration...$(NC)"
	@cp ./appsettings.Production.json ./deploy/app/
	
	# Generate deployment scripts using external script generator
	@echo "$(YELLOW)Creating deployment scripts...$(NC)"
	@./scripts/generate-deployment-scripts.sh ./deploy
	
	# Create archive for easy transfer
	@echo "$(YELLOW)Creating deployment archive...$(NC)"
	@cd deploy && zip -r ../fema-webserver-deploy-$(shell date +%Y%m%d-%H%M%S).zip .
	
	@echo "$(GREEN)Deployment package created successfully!$(NC)"
	@echo "$(YELLOW)Files created:$(NC)"
	@echo "  - ./deploy/ - Deployment directory"
	@echo "  - ./fema-webserver-deploy-*.zip - Deployment archive"
	@echo ""
	@echo "$(YELLOW)To deploy on Linux:$(NC)"
	@echo "  1. Transfer the .zip file to your target server"
	@echo "  2. Extract: unzip fema-webserver-deploy-*.zip"
	@echo "  3. Run: ./install.sh"
	@echo "  4. Start: ./start.sh"
	@echo ""
	@echo "$(YELLOW)To deploy on Windows:$(NC)"
	@echo "  1. Transfer and extract the .zip file (or copy the deploy/ folder)"
	@echo "  2. Run: install.bat (to verify .NET Runtime)"
	@echo "  3. Option A - Console: start.bat"
	@echo "  3. Option B - Service: install-service.bat (as Administrator)"

# Docker helpers (if using Docker in the future)
docker-build: ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	docker build -t fema-webserver .

docker-run: ## Run Docker container
	@echo "$(GREEN)Running Docker container...$(NC)"
	docker run -p $(PORT):$(PORT) fema-webserver

# Cleanup
clean-all: clean ## Clean everything including database
	@echo "$(GREEN)Cleaning everything...$(NC)"
	rm -f bin/app.db*
	rm -rf Migrations/

# Show project status
status: ## Show project status
	@echo "$(GREEN)Project Status:$(NC)"
	@echo "Project: $(PROJECT_FILE)"
	@echo "Database Context: $(DB_CONTEXT)"
	@echo "Port: $(PORT)"
	@echo ""
	@echo "$(YELLOW)Recent migrations:$(NC)"
	@ls -la Migrations/ 2>/dev/null || echo "No migrations found"
	@echo ""
	@echo "$(YELLOW)Database files:$(NC)"
	@ls -la bin/app.db* 2>/dev/null || echo "No database files found"
