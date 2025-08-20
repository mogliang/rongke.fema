# API Development Guide for FMEA System

## Overview
This guide provides detailed instructions for developing and extending the FMEA Web API using ASP.NET Core. Follow these patterns for consistent, maintainable code generation.

## Project Structure and Conventions

### Controller Development

#### Standard Controller Pattern
```csharp
[Route("api/[controller]")]
[ApiController]
public class YourController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public YourController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }
}
```

#### API Endpoint Conventions
- **GET /api/{resource}**: List all resources with optional pagination
- **GET /api/{resource}/{id}**: Get single resource by ID
- **GET /api/{resource}/code/{code}**: Get single resource by unique code
- **POST /api/{resource}**: Create new resource
- **PUT /api/{resource}/{id}**: Update existing resource by ID
- **PUT /api/{resource}/code/{code}**: Update existing resource by code
- **DELETE /api/{resource}/{id}**: Delete resource by ID

#### Response Patterns
```csharp
// Success with data
return Ok(data);

// Success with created resource
return CreatedAtAction(nameof(GetById), new { id = resource.Id }, resourceDto);

// Not found
return NotFound($"Resource with ID {id} not found");

// Bad request with validation errors
return BadRequest("Validation error message");

// Internal server error (let global handler catch)
throw new Exception("Detailed error message");
```

### Entity Development

#### Entity Base Pattern
```csharp
public class YourEntity
{
    public int Id { get; set; }
    
    [Required]
    public string Code { get; set; }
    
    public int Seq { get; set; }
    
    [Required]
    public string LongName { get; set; }
    
    public string ShortName { get; set; }
    
    [Required]
    [Range(0, 3)]
    public int Level { get; set; }
    
    // Relationship fields as comma-separated strings
    public string RelatedCodes { get; set; }
    
    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

#### Required Attributes
- Use `[Required]` for mandatory fields
- Use `[Range]` for level constraints (0-3)
- Use `[Index]` for unique codes
- Use `[NotMapped]` for computed properties

### DTO Development

#### DTO Naming Convention
- Entity: `FMStructure` → DTO: `FMStructureDto2`
- Always include version suffix for iterative development

#### DTO Pattern
```csharp
public class YourEntityDto2
{
    public int Id { get; set; }
    public string Code { get; set; }
    public int Seq { get; set; }
    public string LongName { get; set; }
    public string ShortName { get; set; }
    public int Level { get; set; }
    
    // Relationship collections (parsed from comma-separated strings)
    public List<string> RelatedCodes { get; set; } = new();
    
    // Navigation properties for complete data transfer
    public List<ChildEntityDto2> Children { get; set; } = new();
}
```

### AutoMapper Configuration

#### Profile Pattern
```csharp
public class YourProfile : Profile
{
    public YourProfile()
    {
        // Entity to DTO
        CreateMap<YourEntity, YourEntityDto2>()
            .ForMember(dest => dest.RelatedCodes, 
                opt => opt.MapFrom(src => ParseCommaSeparatedString(src.RelatedCodes)));
        
        // DTO to Entity
        CreateMap<YourEntityDto2, YourEntity>()
            .ForMember(dest => dest.RelatedCodes, 
                opt => opt.MapFrom(src => string.Join(",", src.RelatedCodes)))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
    }
    
    private static List<string> ParseCommaSeparatedString(string value)
    {
        return string.IsNullOrEmpty(value) ? 
            new List<string>() : 
            value.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
    }
}
```

## Business Logic Patterns

### Domain Service Pattern
Create domain services for complex business logic:

```csharp
public class YourDomainService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public YourDomainService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<YourEntity>> GetValidRelatedEntities(int entityId, string relationType)
    {
        // Implement business rules for relationship validation
        // Return entities that can be related based on hierarchy rules
    }

    public async Task<bool> ValidateRelationship(int parentId, int childId)
    {
        // Implement specific validation rules
        // Check hierarchy levels, decomposition rules, etc.
    }
}
```

### Code Generation Pattern
Follow the `FmeaCodeGenerator` pattern for generating unique codes:

```csharp
public static string GenerateCode(string prefix, int level, int sequence)
{
    return $"{prefix}.{level:D2}.{sequence:D3}";
}
```

## Database Patterns

### DbContext Configuration
Add new entities to `AppDbContext`:

```csharp
public DbSet<YourEntity> YourEntities { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Configure unique indexes
    modelBuilder.Entity<YourEntity>()
        .HasIndex(e => e.Code)
        .IsUnique();
    
    // Configure relationships if needed
    modelBuilder.Entity<YourEntity>()
        .HasMany(e => e.Children)
        .WithOne(c => c.Parent)
        .HasForeignKey(c => c.ParentId);
}
```

### Migration Commands
```bash
# Add new migration
dotnet ef migrations add YourMigrationName

# Update database
dotnet ef database update

# Remove last migration (if not applied)
dotnet ef migrations remove
```

## Error Handling and Validation

### Input Validation
```csharp
[HttpPost]
public async Task<ActionResult<YourEntityDto2>> Create(YourEntityDto2 dto)
{
    // Validate input
    if (string.IsNullOrEmpty(dto.Code))
        return BadRequest("Code is required");
    
    if (dto.Level < 0 || dto.Level > 3)
        return BadRequest("Level must be between 0 and 3");
    
    // Check for duplicates
    var exists = await _context.YourEntities
        .AnyAsync(e => e.Code == dto.Code);
    if (exists)
        return BadRequest($"Entity with code {dto.Code} already exists");
    
    // Continue with creation...
}
```

### Relationship Validation
```csharp
private async Task<bool> ValidateHierarchyRule(string parentCode, string childCode)
{
    var parent = await _context.FMStructures
        .FirstOrDefaultAsync(s => s.Code == parentCode);
    var child = await _context.FMStructures
        .FirstOrDefaultAsync(s => s.Code == childCode);
    
    if (parent == null || child == null)
        return false;
    
    // Business rule: child level must be parent level + 1
    return child.Level == parent.Level + 1;
}
```

## API Documentation

### Swagger Annotations
```csharp
/// <summary>
/// Creates a new entity with the specified properties
/// </summary>
/// <param name="dto">The entity data to create</param>
/// <returns>The created entity with generated ID and code</returns>
/// <response code="201">Entity created successfully</response>
/// <response code="400">Invalid input data or business rule violation</response>
/// <response code="409">Entity with the same code already exists</response>
[HttpPost]
[ProducesResponseType(typeof(YourEntityDto2), 201)]
[ProducesResponseType(400)]
[ProducesResponseType(409)]
public async Task<ActionResult<YourEntityDto2>> Create(YourEntityDto2 dto)
```

## Testing Patterns

### Unit Test Structure
```csharp
[Fact]
public async Task Create_ValidEntity_ReturnsCreatedResult()
{
    // Arrange
    var dto = new YourEntityDto2 { /* valid data */ };
    
    // Act
    var result = await _controller.Create(dto);
    
    // Assert
    var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
    var returnedDto = Assert.IsType<YourEntityDto2>(createdResult.Value);
    Assert.Equal(dto.LongName, returnedDto.LongName);
}
```

## Performance Considerations

### Query Optimization
```csharp
// Use Include for eager loading when needed
var entities = await _context.YourEntities
    .Include(e => e.Children)
    .Where(e => e.Level == targetLevel)
    .ToListAsync();

// Use projection for large datasets
var simplifiedEntities = await _context.YourEntities
    .Select(e => new { e.Id, e.Code, e.LongName })
    .ToListAsync();
```

### Async Patterns
Always use async methods for database operations:
```csharp
// Good
var entity = await _context.YourEntities.FirstOrDefaultAsync(e => e.Id == id);

// Avoid
var entity = _context.YourEntities.FirstOrDefault(e => e.Id == id);
```

## Code Generation Commands

### Add New Controller
```bash
dotnet new apicontroller -n YourController -o Controllers
```

### Generate API Client (Run from fmea-web-client)
```bash
npm run generate-client-sdk
```

This guide ensures consistent development patterns and helps AI systems generate code that follows established conventions and business rules.
