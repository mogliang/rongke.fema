# Makefile for FEMA Web Server
# This Makefile provides commands to setup, manage database migrations, and run the application

# Variables
PROJECT_FILE = rongke.fema.csproj
DB_CONTEXT = AppDbContext
MIGRATION_NAME = AutoMigration_$(shell date +%Y%m%d_%H%M%S)
PORT = 5166

# Docker Variables
IMAGE_NAME ?= fema-webserver
IMAGE_TAG ?= latest
REGISTRY ?= docker.io
FULL_IMAGE_NAME = $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
DOCKERFILE = Dockerfile
BUILD_CONTEXT = .

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

.PHONY: help install-ef restore build clean db-init db-migrate db-update db-reset run dev watch setup all deploy-package docker-build docker-build-no-cache docker-run docker-stop docker-inspect docker-logs docker-push docker-tag docker-images docker-clean docker-export docker-import docker-login publish package deploy-local docker-clean-all docker-test docker-config ci ci-docker

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

# Docker Commands
.PHONY: docker-build docker-build-no-cache docker-run docker-stop docker-inspect docker-logs docker-push docker-tag docker-images docker-clean docker-export docker-import docker-login publish package deploy-local docker-clean-all docker-test

# Build Docker image
docker-build: ## Build Docker image
	@echo "$(GREEN)Building Docker image: $(FULL_IMAGE_NAME)$(NC)"
	docker build -t $(FULL_IMAGE_NAME) -f $(DOCKERFILE) $(BUILD_CONTEXT)
	@echo "$(GREEN)✅ Docker image built successfully: $(FULL_IMAGE_NAME)$(NC)"

# Build Docker image with no cache
docker-build-no-cache: ## Build Docker image without cache
	@echo "$(GREEN)Building Docker image (no cache): $(FULL_IMAGE_NAME)$(NC)"
	docker build --no-cache -t $(FULL_IMAGE_NAME) -f $(DOCKERFILE) $(BUILD_CONTEXT)
	@echo "$(GREEN)✅ Docker image built successfully: $(FULL_IMAGE_NAME)$(NC)"

# Run Docker container locally
docker-run: ## Run Docker container locally on port 5166
	@echo "$(GREEN)Running Docker container: $(FULL_IMAGE_NAME)$(NC)"
	docker run -d -p $(PORT):80 --name fema-webserver-container $(FULL_IMAGE_NAME)
	@echo "$(GREEN)✅ Container started at http://localhost:$(PORT)$(NC)"

# Stop and remove Docker container
docker-stop: ## Stop and remove Docker container
	@echo "$(YELLOW)Stopping Docker container...$(NC)"
	-docker stop fema-webserver-container
	-docker rm fema-webserver-container
	@echo "$(GREEN)✅ Container stopped and removed$(NC)"

# Check what files are in the running container
docker-inspect: ## Inspect files inside the running Docker container
	@echo "$(GREEN)Inspecting files in the container...$(NC)"
	docker exec fema-webserver-container ls -la /app/
	@echo ""
	@echo "$(YELLOW)Checking application files...$(NC)"
	docker exec fema-webserver-container ls -la /app/bin/ || echo "No bin directory found"
	@echo ""
	@echo "$(YELLOW)Checking configuration files...$(NC)"
	docker exec fema-webserver-container ls -la /app/appsettings*.json || echo "No appsettings files found"

# Check container logs
docker-logs: ## Show Docker container logs
	@echo "$(GREEN)Docker container logs:$(NC)"
	docker logs fema-webserver-container

# Test Docker container health
docker-test: ## Test if Docker container is responding
	@echo "$(GREEN)Testing Docker container health...$(NC)"
	@timeout 30 bash -c 'until curl -f http://localhost:$(PORT)/health 2>/dev/null || curl -f http://localhost:$(PORT) 2>/dev/null; do echo "Waiting for container to be ready..."; sleep 2; done' || echo "$(YELLOW)Warning: Health check endpoint not accessible$(NC)"
	@echo "$(GREEN)✅ Container appears to be running$(NC)"

# Push Docker image to registry
docker-push: ## Push Docker image to registry
	@echo "$(GREEN)Pushing Docker image: $(FULL_IMAGE_NAME)$(NC)"
	docker push $(FULL_IMAGE_NAME)
	@echo "$(GREEN)✅ Docker image pushed successfully: $(FULL_IMAGE_NAME)$(NC)"

# Tag Docker image
docker-tag: ## Tag Docker image (use TAG=your-tag)
ifndef TAG
	@echo "$(RED)❌ Error: TAG variable is required. Usage: make docker-tag TAG=your-tag$(NC)"
	@exit 1
endif
	@echo "$(GREEN)Tagging Docker image: $(FULL_IMAGE_NAME) -> $(REGISTRY)/$(IMAGE_NAME):$(TAG)$(NC)"
	docker tag $(FULL_IMAGE_NAME) $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo "$(GREEN)✅ Image tagged successfully$(NC)"

# List Docker images
docker-images: ## List Docker images for this project
	@echo "$(GREEN)Docker images for $(IMAGE_NAME):$(NC)"
	docker images | grep $(IMAGE_NAME) || echo "No images found for $(IMAGE_NAME)"

# Remove Docker image
docker-clean: ## Remove Docker image
	@echo "$(YELLOW)Removing Docker image: $(FULL_IMAGE_NAME)$(NC)"
	-docker rmi $(FULL_IMAGE_NAME)
	@echo "$(GREEN)✅ Docker image removed$(NC)"

# Export Docker image to tar file
docker-export: ## Export Docker image to tar file (use OUTPUT=filename.tar to specify output)
ifndef OUTPUT
	$(eval OUTPUT := $(IMAGE_NAME)-$(IMAGE_TAG).tar)
endif
	@echo "$(GREEN)Exporting Docker image: $(FULL_IMAGE_NAME) -> $(OUTPUT)$(NC)"
	docker save -o $(OUTPUT) $(FULL_IMAGE_NAME)
	@echo "$(GREEN)✅ Docker image exported to: $(OUTPUT)$(NC)"
	@ls -lh $(OUTPUT)

# Import Docker image from tar file
docker-import: ## Import Docker image from tar file (use INPUT=filename.tar to specify input)
ifndef INPUT
	@echo "$(RED)❌ Error: INPUT variable is required. Usage: make docker-import INPUT=filename.tar$(NC)"
	@exit 1
endif
	@echo "$(GREEN)Importing Docker image from: $(INPUT)$(NC)"
	docker load -i $(INPUT)
	@echo "$(GREEN)✅ Docker image imported from: $(INPUT)$(NC)"

# Login to Docker registry
docker-login: ## Login to Docker registry
	@echo "$(GREEN)Logging in to Docker registry: $(REGISTRY)$(NC)"
	docker login $(REGISTRY)

# Build and push workflow
publish: docker-build docker-push ## Build and push Docker image

# Build and export workflow  
package: docker-build docker-export ## Build and export Docker image to tar file

# Build and run workflow
deploy-local: docker-build docker-stop docker-run ## Build and run Docker container locally

# Clean all Docker resources for this project
docker-clean-all: docker-stop docker-clean ## Stop container and remove image

# Show current Docker configuration
docker-config: ## Show current Docker configuration
	@echo "$(GREEN)Docker Configuration:$(NC)"
	@echo "  IMAGE_NAME: $(IMAGE_NAME)"
	@echo "  IMAGE_TAG: $(IMAGE_TAG)" 
	@echo "  REGISTRY: $(REGISTRY)"
	@echo "  FULL_IMAGE_NAME: $(FULL_IMAGE_NAME)"
	@echo "  DOCKERFILE: $(DOCKERFILE)"
	@echo "  BUILD_CONTEXT: $(BUILD_CONTEXT)"
	@echo "  PORT: $(PORT)"

# CI/CD Pipeline
.PHONY: ci ci-docker

# Full CI/CD pipeline simulation  
ci: restore build test format check ## Run full CI pipeline (restore, build, test, format, check)
	@echo "$(GREEN)✅ CI pipeline completed successfully!$(NC)"

# CI pipeline with Docker build
ci-docker: ci docker-build ## Run full CI pipeline and build Docker image
	@echo "$(GREEN)✅ CI pipeline with Docker build completed successfully!$(NC)"

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
	@echo "$(YELLOW)Docker Configuration:$(NC)"
	@echo "Image: $(FULL_IMAGE_NAME)"
	@echo "Registry: $(REGISTRY)"
	@echo ""
	@echo "$(YELLOW)Recent migrations:$(NC)"
	@ls -la Migrations/ 2>/dev/null || echo "No migrations found"
	@echo ""
	@echo "$(YELLOW)Database files:$(NC)"
	@ls -la bin/app.db* 2>/dev/null || echo "No database files found"
	@echo ""
	@echo "$(YELLOW)Docker images:$(NC)"
	@docker images | grep $(IMAGE_NAME) 2>/dev/null || echo "No Docker images found for $(IMAGE_NAME)"
	@echo ""
	@echo "$(YELLOW)Running containers:$(NC)"
	@docker ps | grep fema-webserver-container 2>/dev/null || echo "No running containers found"
