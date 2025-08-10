# Docker Deployment for FEMA Web Client

This directory contains Docker configuration and Makefile for building and deploying the FEMA Web Client as a Docker image.

## Quick Start

### 1. Build and run locally
```bash
make deploy-local
```
This will build the Docker image and run it locally on port 8080.

### 2. Build and publish to registry
```bash
make publish
```
This will build the Docker image and push it to the configured registry.

## Available Commands

Run `make help` to see all available commands:

```bash
make help
```

### Common Commands

- `make build` - Build the Angular application locally
- `make docker-build` - Build Docker image
- `make docker-run` - Run Docker container on port 8080
- `make docker-stop` - Stop and remove Docker container
- `make docker-push` - Push image to registry
- `make docker-export` - Export Docker image to tar file
- `make docker-import INPUT=file.tar` - Import Docker image from tar file
- `make publish` - Build and push Docker image
- `make deploy-local` - Build and run locally
- `make ci` - Run full CI pipeline

### Configuration

You can customize the build by setting environment variables:

```bash
# Custom image name and tag
make docker-build IMAGE_NAME=my-fema-client IMAGE_TAG=v1.0.0

# Custom registry
make docker-push REGISTRY=your-registry.com IMAGE_NAME=fema-client

# Tag an image
make docker-tag TAG=v1.0.0
```

### Docker Registry

To push to a private registry:

1. Login to your registry:
```bash
make docker-login REGISTRY=your-registry.com
```

2. Build and push:
```bash
make publish REGISTRY=your-registry.com IMAGE_NAME=fema-client IMAGE_TAG=latest
```

## Files Created

- `Dockerfile` - Multi-stage Docker build configuration
- `Makefile` - Build automation and deployment commands
- `.dockerignore` - Files to exclude from Docker build context
- `nginx.conf` - Custom nginx configuration for Angular routing
- `DOCKER.md` - This documentation file

## Development Workflow

1. **Local development:**
```bash
make dev  # Install dependencies and build
```

2. **Test Docker build:**
```bash
make deploy-local  # Build Docker image and run locally
```

3. **Export image for offline sharing:**
```bash
make docker-export  # Creates fema-web-client-latest.tar
# or specify custom filename:
make docker-export OUTPUT=my-app-v1.0.tar
```

4. **Import image on another machine:**
```bash
make docker-import INPUT=fema-web-client-latest.tar
```

5. **CI/CD pipeline:**
```bash
make ci  # Full pipeline: install, lint, test, build, docker-build
```

6. **Production deployment:**
```bash
make publish REGISTRY=your-registry.com IMAGE_TAG=production
```

## Troubleshooting

- **Container won't start:** Check if port 8080 is already in use
- **Build fails:** Make sure you have Docker installed and running
- **Push fails:** Ensure you're logged in to the registry with `make docker-login`
- **Nginx shows default page:** This was fixed - the Dockerfile now correctly copies from `dist/fema-web-client/browser/` (Angular 19+ structure)

### Debug Commands

```bash
# Inspect files inside running container
make docker-inspect

# Check container logs
make docker-logs

# Check if application is responding
curl http://localhost:8080

# Test HTTP headers
curl -I http://localhost:8080
```

## Docker Image Details

- **Base Image:** nginx:alpine (production-ready, lightweight)
- **Build Process:** Multi-stage build for optimized image size
- **Port:** Exposes port 80 (mapped to 8080 locally)
- **Angular Routing:** Configured with proper fallback to index.html
- **Static Assets:** Optimized caching headers
- **Security:** Basic security headers included
