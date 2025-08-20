# Business Rules and Domain Logic Specification

## Overview
This document defines the comprehensive business rules, validation logic, and domain constraints for the FMEA system. These rules must be enforced in both backend API and frontend validation.

## Core Business Rules

### 1. Hierarchical Structure Rules

#### Structure Decomposition Rules
- **Root Structure**: Must have `Level = 0`
- **Child Structures**: Must have `Level = Parent.Level + 1`
- **Maximum Depth**: Structure hierarchy cannot exceed 3 levels (0, 1, 2, 3)
- **Decomposition Reference**: Parent structure's `Decomposition` field must contain child structure codes
- **Bidirectional Consistency**: If Structure A contains Structure B in decomposition, Structure B's level must be A.level + 1

#### Function Hierarchy Rules
- **Function Level**: Must equal its parent structure's level
- **Level Range**: Functions can only exist at levels 1, 2, or 3 (no level 0 functions)
- **Parent Reference**: Structure's `Functions` field must contain its function codes
- **Function Placement**: Functions can only be created under structures, not other functions

#### Fault Hierarchy Rules
- **Fault Level**: Must equal its parent function's level
- **Level Range**: Faults can only exist at levels 1, 2, or 3 (no level 0 faults)
- **Parent Reference**: Function's `FaultRefs` field must contain its fault codes
- **Fault Placement**: Faults can only be created under functions, not structures or other faults

### 2. Code Generation and Uniqueness Rules

#### Code Format Standards
```
Structure Code: ST.{Level:D2}.{Sequence:D3}    // e.g., ST.01.001
Function Code:  FN.{Level:D2}.{Sequence:D3}    // e.g., FN.01.001  
Fault Code:     FT.{Level:D2}.{Sequence:D3}    // e.g., FT.01.001
```

#### Uniqueness Constraints
- All entity codes must be globally unique within their type
- Database enforces unique index on Code fields
- Code generation must check for existing codes before assignment
- Import codes can be non-unique (for legacy data mapping)

### 3. Sequence and Ordering Rules

#### Sibling Sequence Rules
- **Sequence Uniqueness**: Siblings under same parent must have unique sequence numbers
- **Sequence Range**: Must start from 1 and increment by 1 (1, 2, 3, ...)
- **Reordering**: When moving items, sequence numbers must be recalculated for all siblings
- **Gap Handling**: No gaps allowed in sequence numbers

#### Tree Ordering Impact
- Sequence determines display order in tree views
- Sequence affects export/import order
- Sequence is preserved in relationship graphs but not used for navigation

### 4. Relationship Graph Rules

#### Function Prerequisites Graph
```
Rule: Function A can be prerequisite of Function B if and only if:
  Structure(A) is in the Decomposition of Structure(B)
```

**Validation Logic:**
```typescript
function canBePrerequiste(functionA: FMFunction, functionB: FMFunction): boolean {
    const structA = getStructureByFunction(functionA);
    const structB = getStructureByFunction(functionB);
    
    if (!structA || !structB) return false;
    
    // Check if structA is in structB's decomposition
    return structB.Decomposition.split(',').includes(structA.Code);
}
```

**Business Implications:**
- Higher-level functions depend on lower-level component functions
- Creates dependency chains for failure analysis
- Prevents circular dependencies at same level
- Enables impact analysis propagation

#### Fault Causes Graph
```
Rule: Fault A can cause Fault B if and only if:
  Function(A) is prerequisite of Function(B)
```

**Validation Logic:**
```typescript
function canBeCause(faultA: FMFault, faultB: FMFault): boolean {
    const funcA = getFunctionByFault(faultA);
    const funcB = getFunctionByFault(faultB);
    
    if (!funcA || !funcB) return false;
    
    // Check if funcA is prerequisite of funcB
    return funcB.Prerequisites.split(',').includes(funcA.Code);
}
```

**Business Implications:**
- Fault propagation follows function dependencies
- Root cause analysis traces back through prerequisite chain
- Risk assessment considers causality chains
- Mitigation strategies target cause sources

### 5. Data Integrity Rules

#### Cascade Delete Behavior
```
Delete Structure:
  Option 1: Cascade delete all decomposition (children + their content)
  Option 2: Allow delete of functions only
  Option 3: Allow delete of functions + faults

Delete Function:
  Option 1: Remove all prerequisite relationships (both directions)
  Option 2: Cascade delete all faults

Delete Fault:
  Option 1: Remove all cause relationships (both directions)
```

#### Relationship Consistency
- When entity is deleted, all references to it must be removed
- Relationship fields must not contain orphaned codes
- Bidirectional relationships must be maintained (if A references B, update both)

### 6. FMEA Document Rules

#### Document Lifecycle
- **Creation**: Must specify Type (DFMEA/PFMEA), Name, Version
- **Root Structure**: Must be assigned and cannot be changed after creation
- **Team Members**: Core members required for document validity
- **Version Control**: FMEAVersion tracks document revisions

#### Planning Constraints
- **Dates**: PlanDeadline must be after PlanKickOff
- **Access Control**: SecretLevel and AccessLevel determine visibility
- **Ownership**: DesignOwner and DesignDepartment required for accountability

### 7. Import/Export Rules

#### Code Mapping
- ImportCode field stores original external system codes
- System generates new internal codes during import
- Mapping table maintains relationship between ImportCode and Code
- Export uses either internal codes or original ImportCodes based on target system

#### Data Validation During Import
- Validate hierarchy rules before creating entities
- Resolve code conflicts using generation rules
- Maintain relationship integrity during bulk operations
- Log validation errors for user review

## Validation Implementation Patterns

### Backend Validation (C#)
```csharp
public class StructureValidator
{
    public ValidationResult ValidateCreate(FMStructureDto2 dto, List<FMStructureDto2> existing)
    {
        var result = new ValidationResult();
        
        // Check level constraints
        if (dto.Level < 0 || dto.Level > 3)
            result.Errors.Add("Level must be between 0 and 3");
        
        // Check parent-child level relationship
        if (dto.Level > 0)
        {
            var parent = FindParent(dto, existing);
            if (parent == null)
                result.Errors.Add("Parent structure not found");
            else if (dto.Level != parent.Level + 1)
                result.Errors.Add("Level must be parent level + 1");
        }
        
        // Check code uniqueness
        if (existing.Any(s => s.Code == dto.Code))
            result.Errors.Add($"Code {dto.Code} already exists");
        
        return result;
    }
}
```

### Frontend Validation (TypeScript)
```typescript
export class HierarchyValidator {
  static validateStructureLevel(structure: FMStructureDto2, parent?: FMStructureDto2): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (structure.Level < 0 || structure.Level > 3) {
      errors.push({ field: 'Level', message: 'Level must be between 0 and 3' });
    }
    
    if (parent && structure.Level !== parent.Level + 1) {
      errors.push({ field: 'Level', message: 'Level must be one more than parent level' });
    }
    
    return errors;
  }
  
  static validatePrerequisiteRelationship(
    funcA: FMFunctionDto2, 
    funcB: FMFunctionDto2, 
    structures: FMStructureDto2[]
  ): boolean {
    const structA = structures.find(s => s.Functions.includes(funcA.Code));
    const structB = structures.find(s => s.Functions.includes(funcB.Code));
    
    if (!structA || !structB) return false;
    
    return structB.Decomposition.split(',').includes(structA.Code);
  }
}
```

## Error Messages and User Feedback

### Standard Error Messages
```typescript
export const ErrorMessages = {
  INVALID_LEVEL: 'Level must be between {min} and {max}',
  INVALID_PARENT_CHILD: 'Child level must be exactly one more than parent level',
  CODE_EXISTS: 'Code {code} already exists',
  INVALID_PREREQUISITE: 'Function cannot be prerequisite - structure relationship not found',
  INVALID_CAUSE: 'Fault cannot be cause - function prerequisite relationship not found',
  MISSING_PARENT: 'Parent {type} not found',
  CIRCULAR_DEPENDENCY: 'Circular dependency detected in {type} relationship',
  DELETE_HAS_CHILDREN: 'Cannot delete {type} with children. Choose cascade delete option.',
  SEQUENCE_GAP: 'Sequence numbers cannot have gaps'
};
```

## Business Rule Testing

### Test Scenarios
1. **Valid Hierarchy Creation**: Test normal parent-child creation
2. **Invalid Level Jumps**: Test level validation (e.g., level 0 → level 2)
3. **Prerequisite Constraints**: Test function prerequisite validation rules
4. **Cause Constraints**: Test fault cause validation rules
5. **Cascade Delete**: Test all cascade delete options
6. **Code Uniqueness**: Test code conflict detection
7. **Sequence Reordering**: Test sequence gap handling

### Performance Considerations
- Index structures for fast relationship lookups
- Cache frequently accessed relationship maps
- Batch validate relationship changes
- Use database constraints for critical rules
- Implement client-side validation for immediate feedback

This specification ensures that all business rules are clearly defined and consistently implemented across both backend and frontend components of the FMEA system.
