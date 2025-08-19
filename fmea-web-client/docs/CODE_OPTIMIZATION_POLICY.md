# Code Optimization Policy & Quick Reference Guide

**Version**: 1.0  
**Created**: August 11, 2025  
**Purpose**: Standardize and accelerate code optimization across the FMEA project

---

## 🎯 Optimization Principles

### Core Philosophy
> **"Code should be self-documenting, logically organized, and consistently named"**

1. **Clarity over Brevity**: Descriptive names are better than short cryptic ones
2. **Consistency over Individual Preference**: Follow established patterns 
3. **Domain Alignment**: Use business terminology from the FMEA domain
4. **Future-Proofing**: Structure code for easy extension and maintenance

---

## 🏗️ 1. Component Organization Standards

### **Mandatory Section Structure**
Every Angular component MUST follow this organization:

```typescript
export class ComponentNameComponent {
  constructor() { }

  // ========================================
  // INITIALIZATION SECTION
  // ========================================
  
  // Input/Output properties
  @Input() inputProp = input.required<Type>();
  @Output() outputEvent = new EventEmitter<Type>();
  
  // Core data properties
  currentDataName: Type = defaultValue;
  
  // UI state properties  
  uiStateName: boolean = false;
  
  // Form builders & validators
  private fb = inject(NonNullableFormBuilder);
  
  // Lifecycle methods
  ngOnInit() { }
  ngOnChanges() { }
  ngOnDestroy() { }
  
  // General utility methods
  refreshData() { }
  utilityMethodName() { }

  // ========================================  
  // FEATURE_NAME SECTION (e.g., ADD SECTION)
  // ========================================
  
  // Feature-specific properties
  isFeatureModeActive: boolean = false;
  featureForm = this.fb.group({...});
  
  // Feature methods
  openFeatureModal() { }
  cancelFeatureAction() { }
  confirmFeatureAction() { }

  // ========================================
  // ANOTHER_FEATURE SECTION  
  // ========================================
  // ... repeat pattern
}
```

### **Section Ordering Rules**
1. **INITIALIZATION** - Always first
2. **Feature Sections** - Alphabetical order by feature name
3. **Utility Sections** - Last (if any)

---

## 🏷️ 2. Field Naming Standards

### **Naming Conventions**

| **Field Type** | **Pattern** | **Example** | **Notes** |
|----------------|-------------|-------------|-----------|
| **Current/Active Data** | `current{EntityName}` | `currentUser`, `currentFmeaDoc` | For active working data |
| **Collections** | `{descriptive}{EntityName}s` | `flattenedStructures`, `filteredUsers` | Describe data state |
| **UI State Flags** | `{action}{State}` | `showDetails`, `isLoading` | Boolean states |
| **Tree/Hierarchical Data** | `{type}TreeNodes` | `childTreeNodes`, `fullTreeNodes` | Distinguish tree types |
| **Form Objects** | `{purpose}Form` | `editForm`, `searchForm` | Clear form purpose |
| **Modal States** | `is{Action}Mode` | `isEditMode`, `isAddMode` | Modal visibility |

### **Field Naming Rules**
✅ **DO**:
- Use descriptive prefixes: `current`, `selected`, `filtered`, `flattened`
- Include entity name: `currentUser`, `selectedStructure`  
- Use boolean prefixes: `is`, `has`, `show`, `can`
- Be specific about collections: `filteredUsers` not `users`

❌ **DON'T**:
- Use generic names: `data`, `items`, `list`
- Add unnecessary suffixes: `flagShowRoot`, `nameString`
- Use abbreviations: `usr`, `doc`, `struct`
- Create redundant fields: `selectedId` + `selectedObject`

### **Redundancy Elimination**
```typescript
// ❌ BEFORE: Redundant fields
selectedUserId: string = '';
selectedUser: User = defaultUser;

// ✅ AFTER: Single source of truth  
currentSelectedUser: User = defaultUser;
// Access ID via: this.currentSelectedUser.id
```

---

## 🎯 3. Function Naming Standards

### **Function Categories & Patterns**

#### **A. Event Handlers**
- **Pattern**: `on{Event}{Context}`
- **Examples**: `onTreeContextMenu`, `onFormSubmit`, `onButtonClick`
- **Usage**: For responding to UI events

#### **B. Modal Operations**
- **Pattern**: `open{Entity}{Action}Modal`, `cancel{Entity}{Action}`, `confirm{Entity}{Action}`
- **Examples**: 
  - `openUserEditModal`, `cancelUserEdit`, `confirmUserEdit`
  - `openStructureAddModal`, `cancelStructureAdd`, `confirmStructureAdd`
- **Usage**: For modal dialog interactions

#### **C. Data Operations (CRUD)**
- **Pattern**: `{action}{Entity}{Context}`
- **Examples**: `loadUserData`, `saveUserChanges`, `deleteUserRecord`
- **Usage**: For data manipulation

#### **D. UI State Management**
- **Pattern**: `toggle{Feature}{State}`, `show{Feature}`, `hide{Feature}`  
- **Examples**: `toggleRootTreeDisplay`, `showUserDetails`, `hideErrorMessage`
- **Usage**: For UI state changes

#### **E. Selection Management**
- **Pattern**: `select{Entity}{Context}`, `deselect{Entity}`
- **Examples**: `selectStructureNode`, `selectUserFromList`, `deselectAllItems`
- **Usage**: For managing selections

#### **F. Utility Functions**
- **Pattern**: `{verb}{Object}{Context}`
- **Examples**: `refreshDataView`, `validateFormFields`, `formatDisplayText`
- **Usage**: For helper/utility operations

### **Function Naming Rules**
✅ **DO**:
- Use clear action verbs: `open`, `close`, `toggle`, `select`, `confirm`
- Include entity names: `User`, `Structure`, `Document`  
- Be specific about context: `Modal`, `Form`, `Tree`, `List`
- Follow consistent patterns within feature groups

❌ **DON'T**:
- Use generic names: `handle`, `process`, `manage`
- Add number suffixes: `contextMenu2`, `handler3`
- Use unclear abbreviations: `proc`, `mgmt`, `ctrl`
- Mix patterns within the same component

---

## ⚡ 4. Quick Optimization Checklist

### **Before Starting Optimization**
- [ ] Backup current working code
- [ ] Identify all component methods and properties
- [ ] Map current template usage
- [ ] Note all external dependencies

### **During Organization Phase**
- [ ] Create section headers with clear separators
- [ ] Group related properties together
- [ ] Order sections: Initialization → Features → Utilities
- [ ] Add comments for complex sections

### **During Field Renaming**  
- [ ] List all current field names
- [ ] Identify redundant fields for elimination
- [ ] Apply naming conventions systematically
- [ ] Update all references in component
- [ ] Update template references
- [ ] Test for compilation errors

### **During Function Renaming**
- [ ] Categorize functions by purpose  
- [ ] Apply consistent naming patterns
- [ ] Update all internal function calls
- [ ] Update template event handlers
- [ ] Update any external component references
- [ ] Verify functionality preservation

### **Testing & Validation**
- [ ] Zero compilation errors
- [ ] All functionality works as before  
- [ ] Template properly displays
- [ ] No runtime errors in console
- [ ] UI interactions work correctly

---

## 🛠️ 5. Optimization Tools & Commands

### **VS Code Search & Replace Patterns**
```bash
# Find functions with generic names
\b(handle|process|manage)\w*\s*\(

# Find boolean fields without proper prefixes  
\b\w+Flag\b|\b\w+State\b

# Find redundant field patterns
\bselected\w+Id\b.*\bselected\w+\b
```

### **Quick Refactoring Steps**
1. **Use VS Code's "Rename Symbol"** (F2) for safe renaming
2. **Use "Find All References"** to verify all usages
3. **Use Multi-cursor editing** for batch pattern updates
4. **Use "Format Document"** after major changes

---

## 📋 6. Component Templates

### **Basic Component Template**
```typescript
import { Component, inject, input, Output, EventEmitter } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-feature-name',
  imports: [/* required imports */],
  providers: [/* required services */],
  templateUrl: './feature-name.component.html',
  styleUrl: './feature-name.component.css'
})
export class FeatureNameComponent {
  constructor(private requiredService: RequiredService) { }

  // ========================================
  // INITIALIZATION SECTION
  // ========================================
  
  @Output() entityUpdated = new EventEmitter<EntityType>();
  entityInput = input.required<EntityType | null>();

  currentEntityData: EntityType | null = null;
  entityCollections: EntityType[] = [];
  
  isLoadingData: boolean = false;
  showAdvancedOptions: boolean = false;
  
  private fb = inject(NonNullableFormBuilder);

  ngOnInit() { }
  ngOnChanges() { this.refreshEntityView(); }

  refreshEntityView(): void { /* implementation */ }
  selectEntityItem(entity: EntityType): void { /* implementation */ }

  // ========================================
  // ADD SECTION  
  // ========================================
  
  isAddMode: boolean = false;
  addForm = this.fb.group({ /* form fields */ });

  openEntityAddModal(): void { /* implementation */ }
  cancelEntityAdd(): void { /* implementation */ }
  confirmEntityAdd(): void { /* implementation */ }

  // ========================================
  // EDIT SECTION
  // ========================================
  
  isEditMode: boolean = false;
  editForm = this.fb.group({ /* form fields */ });

  openEntityEditModal(): void { /* implementation */ }
  cancelEntityEdit(): void { /* implementation */ }
  confirmEntityEdit(): void { /* implementation */ }
}
```

---

## 🎖️ 7. Quality Gates

### **Code Review Checklist**
Before code submission, verify:

#### **Organization**
- [ ] Clear section headers present
- [ ] Related code grouped together
- [ ] Logical section ordering

#### **Naming**  
- [ ] All fields follow naming conventions
- [ ] No redundant properties exist
- [ ] Function names are self-documenting
- [ ] Consistent patterns used throughout

#### **Functionality**
- [ ] Zero compilation errors
- [ ] All features work as expected
- [ ] No console errors
- [ ] Template properly updated

#### **Documentation**
- [ ] Complex sections have comments
- [ ] Public methods have JSDoc if needed
- [ ] README updated if public API changed

---

## 📚 8. Reference Examples

### **Good vs Bad Examples**

#### **Field Naming**
```typescript
// ❌ BAD
data: any[];
flag: boolean;
temp: string;
list: Item[];

// ✅ GOOD  
filteredUserAccounts: UserAccount[];
showAdvancedFilters: boolean;
currentSearchQuery: string;
flattenedMenuItems: MenuItem[];
```

#### **Function Naming**
```typescript
// ❌ BAD
handle($event: any): void { }
process(): void { }
contextMenu2($event: MouseEvent): void { }
doSomething(): void { }

// ✅ GOOD
onUserAccountClick($event: MouseEvent): void { }
refreshAccountData(): void { }
onTableContextMenu($event: MouseEvent): void { }
validateAccountForm(): void { }
```

---

## 🔄 9. Continuous Improvement

### **Regular Review Schedule**
- **Monthly**: Review new components for policy compliance
- **Quarterly**: Update policy based on new patterns discovered
- **Semi-Annually**: Full project consistency audit

### **Policy Updates**
- Document all policy changes with examples
- Communicate changes to all team members
- Update templates and tools accordingly

### **Team Training**
- New team members must review this policy
- Regular workshops on optimization techniques
- Code review sessions to reinforce standards

---

**Remember**: This policy is a living document. Update it as the project grows and new patterns emerge. The goal is to maintain high code quality while accelerating development velocity.
