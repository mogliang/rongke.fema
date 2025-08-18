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
  public currentSelectedStructure: FMStructureDto2 = {
    code: '',
    longName: '',
    shortName: '',
    category: '',
    seq: 0,
    decomposition: [],
    functions: [],
    level: 0
  };
  public currentSelectedFunction: FMFunctionDto2 = {
    code: '',
    longName: '',
    shortName: '',
    seq: 0,
    level: 0,
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

    var root = this.currentFmeaDoc?.fmStructures.find(f => f.code === this.currentFmeaDoc?.rootStructureCode);
    var rootNode = this.helper.generateTreeNodes(this.currentFmeaDoc!, root!, true, false);
    this.childTreeNodes = rootNode.children || [];

    this.fmFunctions = this.currentFmeaDoc!.fmFunctions;
  }

  toggleRootTreeDisplay(): void {
    this.showRootInTree = !this.showRootInTree;
  }

  selectStructureNode(fmStructure: FMStructureDto2): void {
    this.currentSelectedStructure = fmStructure;
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
  openAddFunctionModal($event: MouseEvent, structure: FMStructureDto2 | null): void {
    if (structure != null) {
      this.selectStructureNode(structure);
    }

    this.isAddMode = true;
    this.addForm.reset();
    var newCode = this.helper.generateNextFunctionCode(this.currentFmeaDoc!)
    
    this.addForm.patchValue({ 
      code: newCode,
      fmStructureCode: structure?.code
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
        level:0,
        longName: this.addForm.value.longName!,
        shortName: this.addForm.value.shortName!,
        fmStructureCode: this.addForm.value.fmStructureCode!,
        parentFMFunctionCode: this.currentSelectedFunction.code || undefined,
        prerequisites: [],
        faultRefs: [],
      };

      this.helper.createChildFunction(this.currentFmeaDoc!, this.currentSelectedStructure!, this.currentSelectedFunction, newFunction);

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

    // TODO: implement

    this.refreshView();
    this.femaDocUpdated.emit(this.currentFmeaDoc!);
  }

  // Delete methods
  deleteFunctionNode($event: MouseEvent, fmFunction: FMFunctionDto2 | null): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    // TODO: implement

    this.refreshView();
    this.femaDocUpdated.emit(this.currentFmeaDoc!);
  }
}
