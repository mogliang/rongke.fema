# Database Schema and Migration Guide

## Overview
This document provides comprehensive information about the FMEA system database schema, migration patterns, and data management strategies for AI-assisted development.

## Database Technology Stack
- **Database Engine**: SQLite (Development) / SQL Server (Production)
- **ORM**: Entity Framework Core 8.x
- **Migration Strategy**: Code-First with Entity Framework Migrations
- **Connection String**: Configured in `appsettings.json`

## Core Entity Schemas

### FMEA Table
Main document entity storing FMEA metadata and configuration.

```sql
CREATE TABLE "FMEAs" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_FMEAs" PRIMARY KEY AUTOINCREMENT,
    "Code" TEXT NOT NULL,
    "Type" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Version" TEXT NOT NULL,
    "FMEAVersion" TEXT NOT NULL,
    "Description" TEXT NULL,
    "Stage" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "CustomerName" TEXT NULL,
    "CompanyName" TEXT NULL,
    "ProductType" TEXT NULL,
    "Material" TEXT NULL,
    "Project" TEXT NULL,
    "ProjectLocation" TEXT NULL,
    "PlanKickOff" TEXT NULL,
    "PlanDeadline" TEXT NULL,
    "SecretLevel" TEXT NULL,
    "AccessLevel" TEXT NULL,
    "DesignDepartment" TEXT NULL,
    "DesignOwner" TEXT NULL,
    "RootStructureCode" TEXT NULL,
    "CoreMembersJson" TEXT NULL
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX "IX_FMEAs_Code" ON "FMEAs" ("Code");
```

### FMStructures Table
Hierarchical structure entities with decomposition relationships.

```sql
CREATE TABLE "FMStructures" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_FMStructures" PRIMARY KEY AUTOINCREMENT,
    "Seq" INTEGER NOT NULL,
    "Code" TEXT NOT NULL,
    "ImportCode" TEXT NOT NULL DEFAULT '',
    "LongName" TEXT NOT NULL,
    "ShortName" TEXT NULL,
    "Category" TEXT NULL,
    "Decomposition" TEXT NULL,
    "Functions" TEXT NULL,
    "Level" INTEGER NOT NULL
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX "IX_FMStructures_Code" ON "FMStructures" ("Code");
CREATE INDEX "IX_FMStructures_Level" ON "FMStructures" ("Level");
CREATE INDEX "IX_FMStructures_Seq" ON "FMStructures" ("Seq");
```

**Constraints:**
- `Level` must be between 0 and 3
- `Code` must be unique across all structures
- `LongName` is required

### FMFunctions Table
Function entities with prerequisite relationships.

```sql
CREATE TABLE "FMFunctions" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_FMFunctions" PRIMARY KEY AUTOINCREMENT,
    "Seq" INTEGER NOT NULL,
    "Code" TEXT NOT NULL,
    "ImportCode" TEXT NOT NULL DEFAULT '',
    "LongName" TEXT NOT NULL,
    "ShortName" TEXT NULL,
    "Prerequisites" TEXT NULL,
    "FaultRefs" TEXT NULL,
    "Level" INTEGER NOT NULL
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX "IX_FMFunctions_Code" ON "FMFunctions" ("Code");
CREATE INDEX "IX_FMFunctions_Level" ON "FMFunctions" ("Level");
CREATE INDEX "IX_FMFunctions_Seq" ON "FMFunctions" ("Seq");
```

**Constraints:**
- `Level` must be between 1 and 3
- `Code` must be unique across all functions
- `LongName` is required

### FMFaults Table
Fault entities with cause relationships and risk assessment.

```sql
CREATE TABLE "FMFaults" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_FMFaults" PRIMARY KEY AUTOINCREMENT,
    "Seq" INTEGER NOT NULL,
    "ImportCode" TEXT NOT NULL DEFAULT '',
    "Code" TEXT NOT NULL,
    "LongName" TEXT NOT NULL,
    "ShortName" TEXT NULL,
    "Level" INTEGER NOT NULL,
    "RiskPriorityFactor" INTEGER NOT NULL DEFAULT 0,
    "Causes" TEXT NULL
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX "IX_FMFaults_Code" ON "FMFaults" ("Code");
CREATE INDEX "IX_FMFaults_Level" ON "FMFaults" ("Level");
CREATE INDEX "IX_FMFaults_RiskPriorityFactor" ON "FMFaults" ("RiskPriorityFactor");
```

**Constraints:**
- `Level` must be between 1 and 3
- `Code` must be unique across all faults
- `LongName` is required

### Products Table
Simplified FMEA listing for dashboard and navigation.

```sql
CREATE TABLE "Products" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Products" PRIMARY KEY AUTOINCREMENT,
    "Code" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Version" TEXT NOT NULL,
    "Description" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);
```

## Entity Framework Configuration

### DbContext Configuration
```csharp
public class AppDbContext : DbContext
{
    public DbSet<FMEA> FMEAs { get; set; }
    public DbSet<FMStructure> FMStructures { get; set; }
    public DbSet<FMFunction> FMFunctions { get; set; }
    public DbSet<FMFault> FMFaults { get; set; }
    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure unique indexes
        modelBuilder.Entity<FMEA>()
            .HasIndex(e => e.Code)
            .IsUnique();

        modelBuilder.Entity<FMStructure>()
            .HasIndex(e => e.Code)
            .IsUnique();

        modelBuilder.Entity<FMFunction>()
            .HasIndex(e => e.Code)
            .IsUnique();

        modelBuilder.Entity<FMFault>()
            .HasIndex(e => e.Code)
            .IsUnique();

        // Configure enums
        modelBuilder.Entity<FMEA>()
            .Property(e => e.Type)
            .HasConversion<int>();

        // Configure value constraints
        modelBuilder.Entity<FMStructure>()
            .Property(e => e.Level)
            .HasAnnotation("Range", new[] { 0, 3 });

        modelBuilder.Entity<FMFunction>()
            .Property(e => e.Level)
            .HasAnnotation("Range", new[] { 1, 3 });

        modelBuilder.Entity<FMFault>()
            .Property(e => e.Level)
            .HasAnnotation("Range", new[] { 1, 3 });
    }
}
```

## Migration Patterns

### Creating New Migration
```bash
# Navigate to webserver directory
cd webserver

# Add new migration
dotnet ef migrations add YourMigrationName

# Review generated migration files
# Edit if necessary for complex scenarios

# Apply migration to database
dotnet ef database update
```

### Migration Best Practices

#### 1. Data Migration Pattern
```csharp
public partial class AddNewFieldWithData : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 1. Add new column
        migrationBuilder.AddColumn<string>(
            name: "NewField",
            table: "FMStructures",
            type: "TEXT",
            nullable: true);

        // 2. Update existing data
        migrationBuilder.Sql(
            "UPDATE FMStructures SET NewField = 'DefaultValue' WHERE NewField IS NULL");

        // 3. Make column non-nullable if required
        migrationBuilder.AlterColumn<string>(
            name: "NewField",
            table: "FMStructures",
            type: "TEXT",
            nullable: false,
            oldClrType: typeof(string),
            oldType: "TEXT",
            oldNullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "NewField",
            table: "FMStructures");
    }
}
```

#### 2. Index Migration Pattern
```csharp
public partial class AddPerformanceIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Create composite index for common queries
        migrationBuilder.CreateIndex(
            name: "IX_FMStructures_Level_Seq",
            table: "FMStructures",
            columns: new[] { "Level", "Seq" });

        // Create filtered index for specific scenarios
        migrationBuilder.Sql(
            "CREATE INDEX IX_FMFaults_HighRisk ON FMFaults (RiskPriorityFactor) WHERE RiskPriorityFactor > 100");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_FMStructures_Level_Seq",
            table: "FMStructures");

        migrationBuilder.Sql("DROP INDEX IF EXISTS IX_FMFaults_HighRisk");
    }
}
```

#### 3. Relationship Migration Pattern
```csharp
public partial class NormalizeRelationships : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Create junction table for many-to-many relationships
        migrationBuilder.CreateTable(
            name: "FunctionPrerequisites",
            columns: table => new
            {
                FunctionId = table.Column<int>(type: "INTEGER", nullable: false),
                PrerequisiteId = table.Column<int>(type: "INTEGER", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FunctionPrerequisites", x => new { x.FunctionId, x.PrerequisiteId });
                table.ForeignKey(
                    name: "FK_FunctionPrerequisites_FMFunctions_FunctionId",
                    column: x => x.FunctionId,
                    principalTable: "FMFunctions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_FunctionPrerequisites_FMFunctions_PrerequisiteId",
                    column: x => x.PrerequisiteId,
                    principalTable: "FMFunctions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        // Migrate existing comma-separated data
        migrationBuilder.Sql(@"
            INSERT INTO FunctionPrerequisites (FunctionId, PrerequisiteId)
            SELECT f1.Id, f2.Id
            FROM FMFunctions f1
            CROSS JOIN FMFunctions f2
            WHERE ',' || f1.Prerequisites || ',' LIKE '%,' || f2.Code || ',%'
            AND f1.Prerequisites IS NOT NULL
            AND f1.Prerequisites != ''
        ");

        // Remove old column after data migration
        migrationBuilder.DropColumn(
            name: "Prerequisites",
            table: "FMFunctions");
    }
}
```

## Query Optimization

### Common Query Patterns
```csharp
// Efficient hierarchy loading
var structures = await context.FMStructures
    .Where(s => s.Level <= maxLevel)
    .OrderBy(s => s.Level)
    .ThenBy(s => s.Seq)
    .ToListAsync();

// Bulk relationship operations
var functionCodes = structures
    .SelectMany(s => s.Functions?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>())
    .ToHashSet();

var functions = await context.FMFunctions
    .Where(f => functionCodes.Contains(f.Code))
    .ToListAsync();

// Efficient prerequisite lookup
var prerequisiteMap = functions
    .Where(f => !string.IsNullOrEmpty(f.Prerequisites))
    .SelectMany(f => f.Prerequisites.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(code => new { FunctionCode = f.Code, PrerequisiteCode = code }))
    .ToLookup(x => x.FunctionCode, x => x.PrerequisiteCode);
```

### Performance Indexes
```sql
-- Hierarchy traversal
CREATE INDEX IX_FMStructures_Level_Seq ON FMStructures (Level, Seq);

-- Code lookups (already unique indexes)
CREATE UNIQUE INDEX IX_FMStructures_Code ON FMStructures (Code);
CREATE UNIQUE INDEX IX_FMFunctions_Code ON FMFunctions (Code);
CREATE UNIQUE INDEX IX_FMFaults_Code ON FMFaults (Code);

-- Risk analysis
CREATE INDEX IX_FMFaults_RiskPriorityFactor ON FMFaults (RiskPriorityFactor DESC);
```

## Data Seeding

### Development Data Seeding
```csharp
public static class DatabaseSeeder
{
    public static async Task SeedDevelopmentData(AppDbContext context)
    {
        if (!await context.FMEAs.AnyAsync())
        {
            // Seed sample FMEA
            var sampleFmea = new FMEA
            {
                Code = "FMEA-SAMPLE-001",
                Type = FMEAType.DFMEA,
                Name = "Sample DFMEA",
                Version = "1.0",
                FMEAVersion = "1.0",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                RootStructureCode = "ST.00.001"
            };

            // Seed sample structures
            var structures = new[]
            {
                new FMStructure { Code = "ST.00.001", LongName = "Root System", Level = 0, Seq = 1 },
                new FMStructure { Code = "ST.01.001", LongName = "Subsystem A", Level = 1, Seq = 1 },
                new FMStructure { Code = "ST.01.002", LongName = "Subsystem B", Level = 1, Seq = 2 }
            };

            // Update decomposition relationships
            structures[0].Decomposition = "ST.01.001,ST.01.002";

            context.FMEAs.Add(sampleFmea);
            context.FMStructures.AddRange(structures);
            
            await context.SaveChangesAsync();
        }
    }
}
```

## Backup and Recovery

### SQLite Backup Strategy
```csharp
public class DatabaseBackupService
{
    public async Task CreateBackup(string sourcePath, string backupPath)
    {
        using var source = new SqliteConnection($"Data Source={sourcePath}");
        using var backup = new SqliteConnection($"Data Source={backupPath}");
        
        source.Open();
        backup.Open();
        
        source.BackupDatabase(backup);
    }

    public async Task RestoreBackup(string backupPath, string targetPath)
    {
        File.Copy(backupPath, targetPath, overwrite: true);
    }
}
```

### Migration Rollback Strategy
```bash
# Rollback to specific migration
dotnet ef database update PreviousMigrationName

# Remove migrations not yet applied to production
dotnet ef migrations remove
```

This database specification provides comprehensive guidance for managing the FMEA system database schema, ensuring data integrity, and supporting efficient AI-assisted development.
