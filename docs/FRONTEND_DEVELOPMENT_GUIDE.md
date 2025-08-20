# Frontend Development Guide for FMEA Angular Client

## Overview
This guide provides detailed patterns and conventions for developing the Angular frontend of the FMEA system. Follow these guidelines for consistent, maintainable code generation.

## Project Structure

### Angular Application Architecture
```
src/
├── app/
│   ├── components/           # Reusable UI components
│   ├── services/            # Business logic and API services
│   ├── models/              # TypeScript interfaces and types
│   ├── fmea-step1/          # FMEA Planning & Metadata
│   ├── fmea-step2/          # Structure Analysis
│   ├── fmea-step3/          # Function Analysis
│   ├── fmea-step4/          # Fault Analysis (future)
│   └── libs/
│       └── api-client/      # Generated API client
├── environments/            # Environment configurations
└── assets/                  # Static resources
```

## Component Development Patterns

### Component Structure Template
```typescript
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzTreeModule, NzButtonModule, NzModalModule, NzFormModule, NzInputModule } from 'ng-zorro-antd';

@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Ant Design modules
    NzTreeModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule
  ],
  template: `
    <!-- Component template -->
  `,
  styles: [`
    /* Component styles */
  `]
})
export class YourComponent implements OnInit, OnDestroy {
  @Input() inputData: any;
  @Output() dataChanged = new EventEmitter<any>();
  
  form: FormGroup;
  loading = false;
  
  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }
  
  ngOnInit(): void {
    // Component initialization
  }
  
  ngOnDestroy(): void {
    // Cleanup logic
  }
  
  private initializeForm(): void {
    this.form = this.fb.group({
      // Form controls with validation
    });
  }
}
```

### Service Pattern
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class YourService {
  private apiUrl = 'http://localhost:5166/api';
  private dataSubject = new BehaviorSubject<any[]>([]);
  
  data$ = this.dataSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  getData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/your-endpoint`)
      .pipe(
        map(data => {
          this.dataSubject.next(data);
          return data;
        }),
        catchError(this.handleError)
      );
  }
  
  createData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/your-endpoint`, data)
      .pipe(catchError(this.handleError));
  }
  
  private handleError(error: any): Observable<never> {
    console.error('Service error:', error);
    throw error;
  }
}
```

## UI Component Patterns with Ant Design

### Tree Component for Hierarchical Data
```typescript
// Component
export class HierarchyTreeComponent {
  treeData: NzTreeNodeOptions[] = [];
  selectedNode: NzTreeNode | null = null;
  
  onTreeClick(event: NzFormatEmitEvent): void {
    this.selectedNode = event.node;
    if (event.node?.origin) {
      this.nodeSelected.emit(event.node.origin);
    }
  }
  
  buildTreeData(structures: FMStructureDto2[]): NzTreeNodeOptions[] {
    const rootNodes = structures.filter(s => s.Level === 0);
    return rootNodes.map(root => this.buildTreeNode(root, structures));
  }
  
  private buildTreeNode(structure: FMStructureDto2, allStructures: FMStructureDto2[]): NzTreeNodeOptions {
    const children = this.getChildren(structure, allStructures);
    return {
      title: structure.LongName,
      key: structure.Code,
      expanded: true,
      children: children.map(child => this.buildTreeNode(child, allStructures)),
      origin: structure
    };
  }
}
```

```html
<!-- Template -->
<nz-tree
  [nzData]="treeData"
  [nzShowLine]="true"
  [nzExpandedKeys]="expandedKeys"
  (nzClick)="onTreeClick($event)">
</nz-tree>
```

### Modal Dialog Pattern
```typescript
// Component
export class AddEditModalComponent {
  @Input() visible = false;
  @Input() editData: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() dataSubmitted = new EventEmitter<any>();
  
  form: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      longName: ['', [Validators.required]],
      shortName: [''],
      category: ['']
    });
  }
  
  onOk(): void {
    if (this.form.valid) {
      this.dataSubmitted.emit(this.form.value);
      this.closeModal();
    }
  }
  
  onCancel(): void {
    this.closeModal();
  }
  
  private closeModal(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.form.reset();
  }
}
```

```html
<!-- Modal Template -->
<nz-modal
  [(nzVisible)]="visible"
  nzTitle="Add/Edit Item"
  (nzOnCancel)="onCancel()"
  (nzOnOk)="onOk()">
  
  <form nz-form [formGroup]="form" *nzModalContent>
    <nz-form-item>
      <nz-form-label nzRequired>Long Name</nz-form-label>
      <nz-form-control nzErrorTip="Please input long name!">
        <input nz-input formControlName="longName" placeholder="Enter long name">
      </nz-form-control>
    </nz-form-item>
    
    <nz-form-item>
      <nz-form-label>Short Name</nz-form-label>
      <nz-form-control>
        <input nz-input formControlName="shortName" placeholder="Enter short name">
      </nz-form-control>
    </nz-form-item>
  </form>
</nz-modal>
```

### Table Component with Actions
```html
<nz-table #table [nzData]="data" [nzLoading]="loading">
  <thead>
    <tr>
      <th>Code</th>
      <th>Long Name</th>
      <th>Level</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let item of table.data">
      <td>{{ item.Code }}</td>
      <td>{{ item.LongName }}</td>
      <td>{{ item.Level }}</td>
      <td>
        <button nz-button nzType="link" (click)="editItem(item)">
          <i nz-icon nzType="edit"></i>
        </button>
        <button nz-button nzType="link" nzDanger (click)="deleteItem(item)">
          <i nz-icon nzType="delete"></i>
        </button>
      </td>
    </tr>
  </tbody>
</nz-table>
```

## State Management Patterns

### Service-Based State Management
```typescript
@Injectable({
  providedIn: 'root'
})
export class FmeaStateService {
  private currentFmeaSubject = new BehaviorSubject<FMEADto2 | null>(null);
  private structuresSubject = new BehaviorSubject<FMStructureDto2[]>([]);
  private functionsSubject = new BehaviorSubject<FMFunctionDto2[]>([]);
  
  currentFmea$ = this.currentFmeaSubject.asObservable();
  structures$ = this.structuresSubject.asObservable();
  functions$ = this.functionsSubject.asObservable();
  
  setCurrentFmea(fmea: FMEADto2): void {
    this.currentFmeaSubject.next(fmea);
    this.structuresSubject.next(fmea.FMStructures || []);
    this.functionsSubject.next(fmea.FMFunctions || []);
  }
  
  addStructure(structure: FMStructureDto2): void {
    const current = this.structuresSubject.value;
    this.structuresSubject.next([...current, structure]);
  }
  
  updateStructure(updated: FMStructureDto2): void {
    const current = this.structuresSubject.value;
    const index = current.findIndex(s => s.Id === updated.Id);
    if (index >= 0) {
      current[index] = updated;
      this.structuresSubject.next([...current]);
    }
  }
}
```

## Form Handling Patterns

### Reactive Forms with Validation
```typescript
export class FormComponent {
  form: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      longName: ['', [Validators.required, Validators.minLength(3)]],
      level: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      category: ['']
    });
  }
  
  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      // Process form data
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }
  
  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['pattern']) return `${fieldName} has invalid format`;
    }
    return '';
  }
}
```

## API Integration Patterns

### Using Generated API Client
```typescript
import { Configuration, FMEAControllerService } from '../libs/api-client';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private fmeaApi: FMEAControllerService;
  
  constructor() {
    const config = new Configuration({
      basePath: 'http://localhost:5166'
    });
    this.fmeaApi = new FMEAControllerService(undefined, config.basePath, undefined);
  }
  
  getFmeaByCode(code: string): Observable<FMEADto2> {
    return this.fmeaApi.getByCode(code);
  }
  
  saveFmea(code: string, fmea: FMEADto2): Observable<FMEADto2> {
    return this.fmeaApi.saveByCode(code, fmea);
  }
}
```

### Error Handling
```typescript
export class ErrorHandlerService {
  handleApiError(error: any): void {
    let message = 'An error occurred';
    
    if (error.status === 400) {
      message = error.error || 'Bad request';
    } else if (error.status === 404) {
      message = 'Resource not found';
    } else if (error.status === 500) {
      message = 'Server error';
    }
    
    // Show user-friendly message
    this.showNotification('error', message);
  }
  
  private showNotification(type: string, message: string): void {
    // Implementation depends on notification library
  }
}
```

## Routing Patterns

### Route Configuration
```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/fmea/list', pathMatch: 'full' },
  { path: 'fmea/list', component: FmeaListComponent },
  { path: 'fmea/:code/step1', component: FmeaStep1Component },
  { path: 'fmea/:code/step2', component: FmeaStep2Component },
  { path: 'fmea/:code/step3', component: FmeaStep3Component },
  { path: '**', component: NotFoundComponent }
];
```

### Route Navigation
```typescript
export class NavigationService {
  constructor(private router: Router) {}
  
  goToStep(fmeaCode: string, step: number): void {
    this.router.navigate(['/fmea', fmeaCode, `step${step}`]);
  }
  
  goToList(): void {
    this.router.navigate(['/fmea/list']);
  }
}
```

## Testing Patterns

### Component Testing
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('YourComponent', () => {
  let component: YourComponent;
  let fixture: ComponentFixture<YourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        YourComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(YourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form correctly', () => {
    // Test form validation logic
    component.form.patchValue({ longName: '' });
    expect(component.form.valid).toBeFalsy();
    
    component.form.patchValue({ longName: 'Valid Name' });
    expect(component.form.valid).toBeTruthy();
  });
});
```

## Build and Development Commands

### Development Server
```bash
npm start                    # Start dev server on port 4200
npm run build               # Build for production
npm run test               # Run unit tests
npm run generate-client-sdk # Generate API client from Swagger
```

### Code Generation
```bash
ng generate component your-component --standalone
ng generate service your-service
ng generate interface your-interface
```

## Performance Best Practices

### OnPush Change Detection
```typescript
@Component({
  selector: 'app-optimized-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class OptimizedComponent {
  constructor(private cdr: ChangeDetectorRef) {}
  
  updateData(): void {
    // Manual change detection trigger
    this.cdr.markForCheck();
  }
}
```

### Lazy Loading
```typescript
const routes: Routes = [
  {
    path: 'feature',
    loadChildren: () => import('./feature/feature.module').then(m => m.FeatureModule)
  }
];
```

This guide ensures consistent Angular development patterns and helps AI systems generate frontend code that integrates seamlessly with the FMEA system architecture.
