# Makefile for fema-web-client Docker image

# Variables
IMAGE_NAME ?= fema-web-client
IMAGE_TAG ?= latest
REGISTRY ?= docker.io
FULL_IMAGE_NAME = $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
DOCKERFILE = Dockerfile
BUILD_CONTEXT = .

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Display this help message
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Install dependencies
.PHONY: install
install: ## Install npm dependencies
	npm install

# Build the Angular application locally
.PHONY: build
build: ## Build the Angular application
	npm run build

# Build for production with optimization
.PHONY: build-prod
build-prod: ## Build the Angular application for production
	npm run build -- --configuration=production

# Analyze bundle size
.PHONY: bundle-analyze
bundle-analyze: ## Analyze bundle size (requires webpack-bundle-analyzer)
	@echo "Installing webpack-bundle-analyzer if not present..."
	@npm list webpack-bundle-analyzer > /dev/null 2>&1 || npm install --save-dev webpack-bundle-analyzer
	@echo "Building with stats..."
	npm run build -- --configuration=production --stats-json
	@echo "Analyzing bundle..."
	npx webpack-bundle-analyzer dist/fema-web-client/stats.json

# Build with source maps for debugging
.PHONY: build-debug
build-debug: ## Build with source maps enabled
	npm run build -- --configuration=development

# Check bundle budgets
.PHONY: budget-check
budget-check: ## Check if build meets budget requirements
	@echo "Checking bundle budgets..."
	npm run build -- --configuration=production --verbose
	@echo "Build completed - check output above for budget warnings"

# Test the Angular application
.PHONY: test
test: ## Run tests
	npm run test

# Build Docker image
.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "Building Docker image: $(FULL_IMAGE_NAME)"
	docker build -t $(FULL_IMAGE_NAME) -f $(DOCKERFILE) $(BUILD_CONTEXT)
	@echo "✅ Docker image built successfully: $(FULL_IMAGE_NAME)"

# Build Docker image with no cache
.PHONY: docker-build-no-cache
docker-build-no-cache: ## Build Docker image without cache
	@echo "Building Docker image (no cache): $(FULL_IMAGE_NAME)"
	docker build --no-cache -t $(FULL_IMAGE_NAME) -f $(DOCKERFILE) $(BUILD_CONTEXT)
	@echo "✅ Docker image built successfully: $(FULL_IMAGE_NAME)"

# Run Docker container locally
.PHONY: docker-run
docker-run: ## Run Docker container locally on port 8080
	@echo "Running Docker container: $(FULL_IMAGE_NAME)"
	docker run -d -p 8080:80 --name fema-web-client-container $(FULL_IMAGE_NAME)
	@echo "✅ Container started at http://localhost:8080"

# Stop and remove Docker container
.PHONY: docker-stop
docker-stop: ## Stop and remove Docker container
	@echo "Stopping Docker container..."
	-docker stop fema-web-client-container
	-docker rm fema-web-client-container
	@echo "✅ Container stopped and removed"

# Check what files are in the running container
.PHONY: docker-inspect
docker-inspect: ## Inspect files inside the running Docker container
	@echo "Inspecting files in the container..."
	docker exec fema-web-client-container ls -la /usr/share/nginx/html/
	@echo "\nChecking nginx configuration..."
	docker exec fema-web-client-container cat /etc/nginx/conf.d/default.conf

# Check container logs
.PHONY: docker-logs
docker-logs: ## Show Docker container logs
	@echo "Docker container logs:"
	docker logs fema-web-client-container

# Push Docker image to registry
.PHONY: docker-push
docker-push: ## Push Docker image to registry
	@echo "Pushing Docker image: $(FULL_IMAGE_NAME)"
	docker push $(FULL_IMAGE_NAME)
	@echo "✅ Docker image pushed successfully: $(FULL_IMAGE_NAME)"

# Tag Docker image
.PHONY: docker-tag
docker-tag: ## Tag Docker image (use TAG=your-tag)
ifndef TAG
	@echo "❌ Error: TAG variable is required. Usage: make docker-tag TAG=your-tag"
	@exit 1
endif
	@echo "Tagging Docker image: $(FULL_IMAGE_NAME) -> $(REGISTRY)/$(IMAGE_NAME):$(TAG)"
	docker tag $(FULL_IMAGE_NAME) $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo "✅ Image tagged successfully"

# List Docker images
.PHONY: docker-images
docker-images: ## List Docker images for this project
	@echo "Docker images for $(IMAGE_NAME):"
	docker images | grep $(IMAGE_NAME) || echo "No images found for $(IMAGE_NAME)"

# Remove Docker image
.PHONY: docker-clean
docker-clean: ## Remove Docker image
	@echo "Removing Docker image: $(FULL_IMAGE_NAME)"
	-docker rmi $(FULL_IMAGE_NAME)
	@echo "✅ Docker image removed"

# Export Docker image to tar file
.PHONY: docker-export
docker-export: ## Export Docker image to tar file (use OUTPUT=filename.tar to specify output)
ifndef OUTPUT
	$(eval OUTPUT := $(IMAGE_NAME)-$(IMAGE_TAG).tar)
endif
	@echo "Exporting Docker image: $(FULL_IMAGE_NAME) -> $(OUTPUT)"
	docker save -o $(OUTPUT) $(FULL_IMAGE_NAME)
	@echo "✅ Docker image exported to: $(OUTPUT)"
	@ls -lh $(OUTPUT)

# Import Docker image from tar file
.PHONY: docker-import
docker-import: ## Import Docker image from tar file (use INPUT=filename.tar to specify input)
ifndef INPUT
	@echo "❌ Error: INPUT variable is required. Usage: make docker-import INPUT=filename.tar"
	@exit 1
endif
	@echo "Importing Docker image from: $(INPUT)"
	docker load -i $(INPUT)
	@echo "✅ Docker image imported from: $(INPUT)"

# Login to Docker registry
.PHONY: docker-login
docker-login: ## Login to Docker registry
	@echo "Logging in to Docker registry: $(REGISTRY)"
	docker login $(REGISTRY)

# Build and push workflow
.PHONY: publish
publish: docker-build docker-push ## Build and push Docker image

# Build and export workflow
.PHONY: package
package: docker-build docker-export ## Build and export Docker image to tar file

# Build and run workflow
.PHONY: deploy-local
deploy-local: docker-build docker-stop docker-run ## Build and run Docker container locally

# Development workflow
.PHONY: dev
dev: install build ## Install dependencies and build the application

# Clean all Docker resources for this project
.PHONY: docker-clean-all
docker-clean-all: docker-stop docker-clean ## Stop container and remove image

# Lint and format (if you have these scripts)
.PHONY: lint
lint: ## Run linting
	npm run lint || echo "No lint script found in package.json"

# Full CI/CD pipeline simulation
.PHONY: ci
ci: install lint test build-prod docker-build ## Run full CI pipeline (install, lint, test, build-prod, docker-build)

# Show current configuration
.PHONY: config
config: ## Show current configuration
	@echo "Configuration:"
	@echo "  IMAGE_NAME: $(IMAGE_NAME)"
	@echo "  IMAGE_TAG: $(IMAGE_TAG)"
	@echo "  REGISTRY: $(REGISTRY)"
	@echo "  FULL_IMAGE_NAME: $(FULL_IMAGE_NAME)"
	@echo "  DOCKERFILE: $(DOCKERFILE)"
	@echo "  BUILD_CONTEXT: $(BUILD_CONTEXT)"
