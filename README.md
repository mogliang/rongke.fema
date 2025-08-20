# FMEA System - Comprehensive Documentation

## Overview
FMEA (Failure Mode and Effects Analysis) system is a full-stack web application for managing systematic failure mode analysis. The system implements hierarchical structure analysis with relationship graphs for comprehensive risk assessment.

## Technology Stack
- **Backend**: ASP.NET Core Web API (.NET 8)
- **Frontend**: Angular 19 with Ant Design (ng-zorro-antd)
- **Database**: SQLite (Development) / SQL Server (Production)
- **API Documentation**: Swagger/OpenAPI with automated client generation

## Quick Start

### Development Setup
```bash
# Start both services
./start-services.sh

# Check service status
./status-services.sh

# Stop all services
./stop-services.sh
```

### Service URLs
- **API Server**: http://localhost:5166
- **Web Client**: http://localhost:4200
- **API Documentation**: http://localhost:5166/swagger

### Manual Development
```bash
# Backend (Terminal 1)
cd webserver
dotnet run --environment=Development

# Frontend (Terminal 2)
cd fmea-web-client
npm install
npm start
```

## Architecture Overview

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Angular Client │────│  ASP.NET Core    │────│  SQLite/SQL     │
│  (Port 4200)    │    │  API (Port 5166) │    │  Database       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         └───────────────────────┘
           Generated API Client
           (OpenAPI/Swagger)
```

### Data Model Hierarchy
```
FMEA Document
├── FMStructure (Level 0) - Root System
    ├── FMStructure (Level 1) - Subsystems
    │   ├── FMFunction (Level 1) - System Functions
    │   │   └── FMFault (Level 1) - Function Failures
    │   └── FMStructure (Level 2) - Components
    │       ├── FMFunction (Level 2) - Component Functions
    │       │   └── FMFault (Level 2) - Component Failures
    │       └── FMStructure (Level 3) - Sub-components
    │           └── FMFunction (Level 3) - Sub-component Functions
    │               └── FMFault (Level 3) - Sub-component Failures
```

## 📚 Documentation Index

### For AI Code Generation
These documents provide comprehensive specifications for AI-assisted development:

1. **[Technical Specification](fmea-model.md)** - Core system architecture and data models
2. **[API Development Guide](docs/API_DEVELOPMENT_GUIDE.md)** - Backend development patterns and conventions
3. **[Frontend Development Guide](docs/FRONTEND_DEVELOPMENT_GUIDE.md)** - Angular component and service patterns
4. **[Business Rules](docs/BUSINESS_RULES.md)** - Domain logic and validation rules
5. **[Database Schema](docs/DATABASE_SCHEMA.md)** - Database design and migration patterns

### Service Management
6. **[Services README](SERVICES_README.md)** - Development environment setup and management

## Development Commands

### Backend Development
```bash
cd webserver

# Add new controller
dotnet new apicontroller -n YourController -o Controllers

# Add database migration
dotnet ef migrations add YourMigrationName

# Update database
dotnet ef database update

# Run tests
dotnet test
```

### Frontend Development
```bash
cd fmea-web-client

# Generate API client from Swagger
npm run generate-client-sdk

# Generate new component
ng generate component your-component --standalone

# Generate new service
ng generate service your-service

# Run tests
npm test
```

## API Integration

### Swagger Client Generation
The system uses OpenAPI Generator to create TypeScript client from the ASP.NET Core Swagger specification:

```bash
# Auto-generate Angular TypeScript client
npm run generate-client-sdk
```

This generates a complete TypeScript API client in `src/libs/api-client/` with:
- Type-safe service classes
- Request/response models
- Configuration and authentication support

### API Documentation
Visit http://localhost:5166/swagger for interactive API documentation and testing.

## Business Logic

### Core Entities
- **FMEA**: Document metadata and team information
- **FMStructure**: System/component hierarchy (4 levels: 0-3)
- **FMFunction**: Functions performed by structures
- **FMFault**: Failure modes with risk assessment

### Relationship Rules
- **Structure Decomposition**: Parent-child relationships in system hierarchy
- **Function Prerequisites**: Dependency graph between functions
- **Fault Causes**: Causality chains between failure modes

### Key Business Rules
1. Hierarchical levels must increment by 1 (parent.level + 1)
2. Function prerequisites must follow structure decomposition
3. Fault causes must follow function prerequisites
4. All codes must be globally unique within entity type

## Project Structure

```
rongke.fmea/
├── webserver/                    # ASP.NET Core Web API
│   ├── Controllers/              # REST API endpoints
│   ├── Data/                     # Entity models and DbContext
│   ├── Domain/                   # Business logic services
│   ├── Dto/                      # Data transfer objects
│   ├── Migrations/               # EF Core database migrations
│   └── Tests/                    # Unit and integration tests
├── fmea-web-client/              # Angular frontend application
│   ├── src/app/                  # Angular components and services
│   ├── src/libs/api-client/      # Generated API client
│   └── docs/                     # Frontend-specific documentation
├── docs/                         # System documentation
│   ├── FMEA原型HTML/             # UI prototypes and mockups
│   ├── meeting/                  # Meeting notes and decisions
│   └── samples/                  # Sample FMEA data files
└── *.sh                         # Service management scripts
```

## Contributing

### Code Generation Guidelines
1. Follow existing patterns in API/Frontend development guides
2. Maintain business rules defined in specifications
3. Use established naming conventions
4. Implement proper validation on both client and server
5. Generate API client after backend changes
6. Write unit tests for new functionality

### Development Workflow
1. Create feature branch
2. Implement backend changes with tests
3. Run migration if database changes required
4. Generate updated API client
5. Implement frontend changes
6. Test integration between frontend and backend
7. Update documentation if needed

## Troubleshooting

### Common Issues
- **Port conflicts**: Ensure ports 5166 and 4200 are available
- **Database locked**: Stop all services and restart
- **API client outdated**: Regenerate client after backend changes
- **CORS errors**: Check CORS configuration in `Program.cs`

### Debug Information
- Backend logs: `webserver.log`
- Frontend logs: `client.log` or browser console
- Database file: `webserver/bin/app.db`

## License
This project is proprietary software for FMEA analysis and management.

---

For detailed development guidance, refer to the documentation files listed above. Each document provides specific patterns and examples for AI-assisted code generation.