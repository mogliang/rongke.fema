# FMEA System Technical Specification

## Overview
FMEA (Failure Mode and Effects Analysis) is a systematic method for analyzing potential failure modes within a system design and their effects. This system implements FMEA management with a hierarchical tree structure and relationship graphs.

## System Architecture

### Technology Stack
- **Backend**: ASP.NET Core Web API (.NET)
- **Database**: SQLite with Entity Framework Core
- **Frontend**: Angular 19 with Ant Design (ng-zorro-antd)
- **API Documentation**: Swagger/OpenAPI
- **Client Generation**: OpenAPI Generator for TypeScript Angular client

### Project Structure
```
rongke.fema/
├── webserver/              # ASP.NET Core Web API
│   ├── Controllers/        # API Controllers
│   ├── Data/              # Entity Models & DbContext
│   ├── Domain/            # Business Logic
│   ├── Dto/               # Data Transfer Objects
│   └── Migrations/        # EF Core Migrations
├── fmea-web-client/       # Angular Frontend
│   ├── src/app/           # Angular Components & Services
│   └── src/libs/          # Generated API Client
└── docs/                  # Documentation & Prototypes
```

## Data Model Architecture

### Hierarchical Tree Structure
The FMEA system uses a 4-level hierarchical tree structure:

1. **FMEA (Root)** - The main FMEA document
2. **FMStructure (Level 0-3)** - System/component structures
3. **FMFunction (Level 1-3)** - Functions under structures
4. **FMFault (Level 1-3)** - Faults under functions

### Core Entities

#### FMEA Entity
Main document containing metadata and configuration.

**Key Properties:**
- `Id` (int): Primary key
- `Code` (string): Unique identifier
- `Type` (FMEAType enum): DFMEA/PFMEA type
- `Name`, `Version`, `FMEAVersion`: Document metadata
- `RootStructureCode`: Reference to root structure
- `CoreMembersJson`: Serialized team member list
- Planning fields: Customer, Company, Project details
- Audit fields: CreatedAt, UpdatedAt

#### FMStructure Entity
Represents system/component structures in hierarchical decomposition.

**Key Properties:**
- `Id` (int): Primary key
- `Code` (string): Unique identifier with index
- `Seq` (int): Sibling sequence order
- `LongName`, `ShortName`: Display names
- `Level` (int, 0-3): Hierarchy level
- `Category`: Classification type
- `Decomposition` (string): Child structure codes (comma-separated)
- `Functions` (string): Associated function codes (comma-separated)

**Business Rules:**
- Level 0: Root structure
- Level 1-3: Child structures via decomposition
- Sibling sequence matters for tree ordering
- Unique code constraint enforced

#### FMFunction Entity
Represents functions performed by structures.

**Key Properties:**
- `Id` (int): Primary key
- `Code` (string): Unique identifier
- `Seq` (int): Sibling sequence order
- `LongName`, `ShortName`: Display names
- `Level` (int, 1-3): Hierarchy level (same as parent structure)
- `Prerequisites` (string): Prerequisite function codes (comma-separated)
- `FaultRefs` (string): Associated fault codes (comma-separated)

**Business Rules:**
- Functions inherit level from parent structure
- Prerequisites create function dependency graph
- Prerequisite validation: can only reference functions whose parent structure is in decomposition of current function's parent structure

#### FMFault Entity
Represents failure modes of functions.

**Key Properties:**
- `Id` (int): Primary key
- `Code` (string): Unique identifier
- `Seq` (int): Sibling sequence order
- `LongName`, `ShortName`: Display names
- `Level` (int, 1-3): Hierarchy level (same as parent function)
- `FaultType` (enum): FM/FE/FC classification
- `RiskPriorityFactor` (int): Risk assessment value
- `Causes` (string): Cause fault codes (comma-separated)

**Business Rules:**
- Faults inherit level from parent function
- Causes create fault causality graph
- Cause validation: can only reference faults whose parent function is prerequisite of current fault's parent function

### Relationship Graphs

#### Function Prerequisites Graph
- **Purpose**: Models functional dependencies
- **Rule**: Function A can be prerequisite of Function B only if Structure(A) is in decomposition of Structure(B)
- **Implementation**: Many-to-many through comma-separated codes in `Prerequisites` field

#### Fault Causes Graph
- **Purpose**: Models fault causality chains
- **Rule**: Fault A can cause Fault B only if Function(A) is prerequisite of Function(B)
- **Implementation**: Many-to-many through comma-separated codes in `Causes` field

## API Design Patterns

### RESTful Endpoints
```
GET /api/fmea/code/{code}           # Get FMEA with all related data
PUT /api/fmea/code/{code}           # Save complete FMEA
GET /api/products                   # List all FMEAs
POST /api/products                  # Create new FMEA
PUT /api/products/{id}              # Update FMEA metadata
DELETE /api/products/{id}           # Delete FMEA
```

### Data Transfer Objects (DTOs)
- **FMEADto2**: Complete FMEA with all structures, functions, and faults
- **FMStructureDto2**: Structure with relationship codes
- **FMFunctionDto2**: Function with prerequisite/fault codes
- **FMFaultDto2**: Fault with cause codes

### AutoMapper Configuration
Bidirectional mapping between entities and DTOs with relationship field handling.

## User Operations Specification

### FMStructure Operations
1. **Add Sub-Structure**
   - Validate parent exists
   - Set level = parent.level + 1
   - Generate unique code
   - Update parent's Decomposition field

2. **Edit Fields**
   - Update LongName, ShortName, Category
   - Maintain code uniqueness
   - Preserve relationships

3. **Reorder Sequence**
   - Update Seq within same parent
   - Maintain sibling ordering

4. **Delete with Cascade Options**
   - Remove from parent's Decomposition
   - Option: Cascade delete all child structures
   - Option: Delete associated functions
   - Option: Delete function's faults

### FMFunction Operations
1. **Add Function**
   - Set level = parent structure level
   - Generate unique code
   - Update structure's Functions field

2. **Manage Prerequisites**
   - List valid prerequisites (structure decomposition rule)
   - Add/remove prerequisite relationships
   - Maintain graph consistency

3. **Delete with Options**
   - Remove prerequisite relationships (both directions)
   - Option: Delete all associated faults

### FMFault Operations
1. **Add Fault**
   - Set level = parent function level
   - Generate unique code
   - Update function's FaultRefs field

2. **Manage Causes**
   - List valid causes (function prerequisite rule)
   - Add/remove cause relationships
   - Maintain causality graph consistency

## Frontend Architecture

### Component Structure
```
app/
├── components/
│   └── add-team-member-modal/      # Team management
├── fmea-step1/                     # FMEA metadata & planning
├── fmea-step2/                     # Structure analysis
├── fmea-step3/                     # Function analysis
└── libs/api-client/                # Generated API client
```

### State Management
- Service-based architecture
- Mock service for development
- Generated API client for production

### UI Framework
- Ant Design components (ng-zorro-antd)
- Tree components for hierarchy display
- Modal dialogs for CRUD operations
- Form validation and error handling

## Development Guidelines for AI Code Generation

### Code Generation Best Practices
1. **Follow existing patterns**: Use established entity/DTO/controller patterns
2. **Maintain relationships**: Always update relationship fields when modifying entities
3. **Validate business rules**: Implement prerequisite and cause validation logic
4. **Use AutoMapper**: Configure bidirectional mappings for new DTOs
5. **Generate API client**: Run OpenAPI generator after API changes
6. **Test endpoints**: Use Swagger UI for API testing

### Naming Conventions
- **Entities**: PascalCase (e.g., `FMStructure`)
- **Properties**: PascalCase (e.g., `LongName`)
- **API routes**: kebab-case (e.g., `/api/fmea/code/{code}`)
- **Database fields**: Same as properties
- **Angular components**: kebab-case files, PascalCase classes

### Error Handling
- **API**: Return appropriate HTTP status codes with descriptive messages
- **Frontend**: Display user-friendly error messages
- **Validation**: Client and server-side validation for business rules

### Security Considerations
- Input validation for all API endpoints
- SQL injection prevention through EF Core
- XSS prevention in Angular templates
- CORS configuration for cross-origin requests

### Performance Optimization
- Eager loading for related entities when needed
- Pagination for large datasets
- Async operations for database queries
- Minimize API calls through batch operations

This specification provides comprehensive guidance for AI-assisted code generation, ensuring consistency with existing architecture and business rules.
