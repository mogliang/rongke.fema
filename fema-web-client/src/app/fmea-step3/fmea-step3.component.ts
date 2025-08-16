import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule, NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FMFunctionDto2, FMEADto2, FMEAService, FMStructureDto2 } from '../../libs/api-client';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { HelperService } from '../helper.service';
import { NzContextMenuService, NzDropdownMenuComponent, NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Output, EventEmitter } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-fmea-step3',
  imports: [CommonModule, NzFormModule, NzInputModule, ReactiveFormsModule, NzModalModule, NzButtonModule, NzIconModule, NzDropDownModule, NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [FMEAService, HelperService],
  templateUrl: './fmea-step3.component.html',
  styleUrl: './fmea-step3.component.css'
})
export class FmeaStep3Component {
  constructor(private nzContextMenuService: NzContextMenuService, private fmeaService: FMEAService, private message: NzMessageService, private helper: HelperService) { }

  // ========================================
  // INITIALIZATION SECTION
  // ========================================
  
  // Input/Output
  @Output() femaDocUpdated = new EventEmitter<FMEADto2>();
  fmeaDoc = input.required<FMEADto2 | null>();

  // Data properties
  currentFmeaDoc: FMEADto2 | null = null;
  public fmFunctions: FMFunctionDto2[] = [];
  public currentSelectedFunction: FMFunctionDto2 = {
    code: '',
    longName: '',
    shortName: '',
    seq: 0,
    fmStructureCode: '',
    parentFMFunctionCode: '',
    prerequisites: [],
    faultRefs: [],
  };

  // Tree display properties
  public childTreeNodes: NzTreeNodeOptions[] = [];
  public fullTreeNodes: NzTreeNodeOptions[] = [];
  public showRootInTree: boolean = false;

  // Form builders
  private fb = inject(NonNullableFormBuilder);

  // Lifecycle methods
  ngOnInit() {
  }

  ngOnChanges() {
    this.refreshView();
  }

  // General utility methods
  refreshView() {
    if (this.currentFmeaDoc == null && this.fmeaDoc() !== null) {
      this.currentFmeaDoc = this.fmeaDoc()!;
    }

    console.log('refreshView', this.currentFmeaDoc);
    if (this.currentFmeaDoc?.rootFMStructure) {
      var rootNode = this.helper.generateTreeNodes(this.currentFmeaDoc.rootFMStructure, true, false);
      this.fullTreeNodes = [rootNode];
      this.childTreeNodes = rootNode.children || [];
      console.log('refreshView', this.childTreeNodes);
    }

    var rootFMFunctions = this.currentFmeaDoc?.fmFunctions.filter(item => !item.parentFMFunctionCode);
    if (rootFMFunctions) {
      this.fmFunctions = this.helper.flattenFunctions(rootFMFunctions);
    }
  }

  toggleRootTreeDisplay(): void {
    this.showRootInTree = !this.showRootInTree;
  }

  selectFunctionNode(fmFunction: FMFunctionDto2): void {
    this.currentSelectedFunction = fmFunction;
  }

  onTreeContextMenu($event: NzFormatEmitEvent, menu: NzDropdownMenuComponent): void {
    if ($event.node) {
      const selectedCode = $event.node?.key!;
      
      // Check if this is a function node (functions should be in the fmFunctions array)
      var selectedFunction = this.currentFmeaDoc?.fmFunctions.find(func => func.code === selectedCode);
      
      if (selectedFunction) {
        // This is a function node - show context menu
        this.selectFunctionNode(selectedFunction);
        this.nzContextMenuService.create($event.event!, menu);
      }
      // If it's a structure node, do nothing (no context menu)
    }
  }

  // ========================================
  // ADD SECTION
  // ========================================
  
  // Add-related properties
  public isAddMode: boolean = false;
  public addForm = this.fb.group({
    code: ['', [Validators.required]],
    longName: ['', [Validators.required, Validators.maxLength(100)]],
    shortName: ['', [Validators.required, Validators.maxLength(10)]],
    fmStructureCode: ['', [Validators.required]],
  });

  // Add methods
  openAddFunctionModal($event: MouseEvent, fmFunction: FMFunctionDto2 | null): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    this.isAddMode = true;
    this.addForm.reset();
    var newCode = this.helper.generateNextFunctionCode(this.currentFmeaDoc!.fmFunctions)
    
    // If no function is selected (adding from tree context), try to use the first available structure
    let defaultStructureCode = this.currentSelectedFunction.fmStructureCode || '';
    if (!defaultStructureCode && this.currentFmeaDoc?.rootFMStructure) {
      defaultStructureCode = this.currentFmeaDoc.rootFMStructure.code;
    }
    
    this.addForm.patchValue({ 
      code: newCode,
      fmStructureCode: defaultStructureCode
    });
    console.log('Adding sub function for:', this.currentSelectedFunction.code);
  }

  cancelAddFunction(): void {
    this.isAddMode = false;
  }

  confirmAddFunction(): void {
    if (this.addForm.valid) {
      this.isAddMode = false;

      // Create new function
      const newFunction: FMFunctionDto2 = {
        code: this.addForm.value.code!,
        seq: 0,
        longName: this.addForm.value.longName!,
        shortName: this.addForm.value.shortName!,
        fmStructureCode: this.addForm.value.fmStructureCode!,
        parentFMFunctionCode: this.currentSelectedFunction.code || undefined,
        prerequisites: [],
        faultRefs: [],
      };

      // Add to parent's prerequisites if this is a subfunc
      if (this.currentSelectedFunction.code) {
        if (!this.currentSelectedFunction.prerequisites) {
          this.currentSelectedFunction.prerequisites = [];
        }
        this.currentSelectedFunction.prerequisites.push(newFunction);
      }

      // Add to the main fmFunctions list
      if (!this.currentFmeaDoc?.fmFunctions) {
        this.currentFmeaDoc!.fmFunctions = [];
      }
      this.currentFmeaDoc!.fmFunctions.push(newFunction);

      // Update sequence numbers
      const parentCode = this.currentSelectedFunction.code || undefined;
      const siblings = this.currentFmeaDoc!.fmFunctions.filter(f => 
        f.parentFMFunctionCode === parentCode
      );
      for (let i = 0; i < siblings.length; i++) {
        siblings[i].seq = i;
      }

      // Refresh view and emit update
      this.refreshView();
      this.femaDocUpdated.emit(this.currentFmeaDoc!);
    }
  }

  // ========================================
  // EDIT SECTION
  // ========================================
  
  // Edit-related properties
  public isEditMode: boolean = false;
  public editForm = this.fb.group({
    code: ['', [Validators.required]],
    longName: ['', [Validators.required, Validators.maxLength(100)]],
    shortName: ['', [Validators.required, Validators.maxLength(10)]],
    fmStructureCode: ['', [Validators.required]],
  });

  // Edit methods
  openEditFunctionModal($event: MouseEvent, fmFunction: FMFunctionDto2 | null): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    this.editForm.setValue({
      code: this.currentSelectedFunction.code,
      longName: this.currentSelectedFunction.longName,
      shortName: this.currentSelectedFunction.shortName,
      fmStructureCode: this.currentSelectedFunction.fmStructureCode || '',
    });

    this.isEditMode = true;
    console.log(this.currentSelectedFunction.code);
  }

  cancelEditFunction(): void {
    this.isEditMode = false;
  }

  confirmEditFunction(): void {
    if (this.editForm.valid) {
      this.isEditMode = false;
      this.currentSelectedFunction.longName = this.editForm.value.longName!;
      this.currentSelectedFunction.shortName = this.editForm.value.shortName!;
      this.currentSelectedFunction.fmStructureCode = this.editForm.value.fmStructureCode!;

      this.refreshView();
      this.femaDocUpdated.emit(this.currentFmeaDoc!);
    }
  }

  // Move method 
  moveFunctionNode($event: MouseEvent, fmFunction: FMFunctionDto2 | null, isUp: boolean): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    // Find siblings (functions with the same parent)
    const siblings = this.currentFmeaDoc!.fmFunctions.filter(f => 
      f.parentFMFunctionCode === this.currentSelectedFunction.parentFMFunctionCode
    );

    const idx = siblings.findIndex(f => f.code === this.currentSelectedFunction.code);
    if (idx === -1) {
      this.message.error('无法找到当前功能');
      return;
    }

    if (isUp) {
      if (idx > 0) {
        const temp = siblings[idx - 1];
        siblings[idx - 1] = siblings[idx];
        siblings[idx] = temp;
      }
    } else {
      if (idx < siblings.length - 1) {
        const temp = siblings[idx + 1];
        siblings[idx + 1] = siblings[idx];
        siblings[idx] = temp;
      }
    }

    // Update sequence numbers
    for (let i = 0; i < siblings.length; i++) {
      siblings[i].seq = i;
    }

    this.refreshView();
    this.femaDocUpdated.emit(this.currentFmeaDoc!);
  }

  // Delete methods
  deleteFunctionNode($event: MouseEvent, fmFunction: FMFunctionDto2 | null): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    // Check if there are child functions
    const hasChildren = this.currentFmeaDoc?.fmFunctions.some(f => 
      f.parentFMFunctionCode === this.currentSelectedFunction.code
    );
    
    if (hasChildren) {
      this.message.error('无法删除功能，当前功能下存在子功能');
      return;
    }

    // Check if there are associated faults
    if (this.currentSelectedFunction.faultRefs && this.currentSelectedFunction.faultRefs.length > 0) {
      this.message.error('无法删除功能，当前功能下存在故障');
      return;
    }

    // Remove from main fmFunctions list
    this.currentFmeaDoc!.fmFunctions = this.currentFmeaDoc!.fmFunctions.filter(f => 
      f.code !== this.currentSelectedFunction.code
    );

    // Remove from parent's prerequisites if applicable
    if (this.currentSelectedFunction.parentFMFunctionCode) {
      const parentFunction = this.helper.findFMFunctionByCode(
        this.currentFmeaDoc!.fmFunctions, 
        this.currentSelectedFunction.parentFMFunctionCode
      );
      if (parentFunction && parentFunction.prerequisites) {
        parentFunction.prerequisites = parentFunction.prerequisites.filter(f => 
          f.code !== this.currentSelectedFunction.code
        );
      }
    }

    this.refreshView();
    this.femaDocUpdated.emit(this.currentFmeaDoc!);
  }
}
