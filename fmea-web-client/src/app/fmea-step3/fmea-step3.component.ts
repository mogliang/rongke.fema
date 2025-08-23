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
import { ViewChild, Output, EventEmitter } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FunctionGraphComponent } from '../components/function-graph.component';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-fmea-step3',
  imports: [CommonModule, FunctionGraphComponent, NzFormModule, NzInputModule, ReactiveFormsModule, NzModalModule, NzButtonModule, NzIconModule, NzDropDownModule, NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
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
  @Output() fmeaDocUpdated = new EventEmitter<FMEADto2>();
  fmeaDoc = input.required<FMEADto2 | null>();

  @ViewChild('treeMenu1', { static: false }) treeMenu1!: NzDropdownMenuComponent;
  @ViewChild('treeMenu2', { static: false }) treeMenu2!: NzDropdownMenuComponent;

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
    prerequisites: [],
    faultRefs: [],
  };

  // Tree display properties
  public structureTreeNodes: NzTreeNodeOptions[] = [];

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
    this.structureTreeNodes = rootNode.children || [];

    this.fmFunctions = this.currentFmeaDoc!.fmFunctions;
  }

  selectStructureNode(fmStructure: FMStructureDto2): void {
    this.currentSelectedStructure = fmStructure;
  }

  selectFunctionNode(fmFunction: FMFunctionDto2): void {
    this.currentSelectedFunction = fmFunction;
  }

  onTreeContextMenu($event: NzFormatEmitEvent): void {
    if ($event.node) {
      const selectedCode = $event.node?.key!;
      
      // Check if this is a function node (functions should be in the fmFunctions array)
      var selectedFunction = this.currentFmeaDoc?.fmFunctions.find(func => func.code === selectedCode);
      if (selectedFunction) {
        // This is a function node - show context menu
        this.selectFunctionNode(selectedFunction);
        this.nzContextMenuService.create($event.event!, this.treeMenu2);
        return
      }
      
      var selectedStructure = this.currentFmeaDoc?.fmStructures.find(s=>s.code === selectedCode);
      if (selectedStructure) {
        // This is a structure node - show context menu and update function graph
        this.selectStructureNode(selectedStructure);
        this.nzContextMenuService.create($event.event!, this.treeMenu1);
        return;
      }
    }
  }

  // Add click handler for structure selection (non-context menu)
  onTreeClick($event: NzFormatEmitEvent): void {
    if ($event.node) {
      const selectedCode = $event.node?.key!;
      
      // Check if this is a structure node
      var selectedStructure = this.currentFmeaDoc?.fmStructures.find(s=>s.code === selectedCode);
      if (selectedStructure) {
        // Update the selected structure for the function graph
        this.selectStructureNode(selectedStructure);
      }
      
      // Check if this is a function node
      var selectedFunction = this.currentFmeaDoc?.fmFunctions.find(func => func.code === selectedCode);
      if (selectedFunction) {
        this.selectFunctionNode(selectedFunction);
      }
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
      fmStructureCode: this.currentSelectedStructure.code
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
        prerequisites: [],
        faultRefs: [],
      };

      this.helper.createChildFunction(this.currentFmeaDoc!, this.currentSelectedStructure!, null, newFunction);

      // Refresh view and emit update
      this.refreshView();
      this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
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
    shortName: ['', [Validators.required, Validators.maxLength(10)]]
  });

  // Edit methods
  openEditFunctionModal($event: MouseEvent, fmFunction: FMFunctionDto2 | null): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    this.editForm.setValue({
      code: this.currentSelectedFunction.code,
      longName: this.currentSelectedFunction.longName,
      shortName: this.currentSelectedFunction.shortName
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

      this.refreshView();
      this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
    }
  }

  // Move method 
  moveFunctionNode($event: MouseEvent, fmFunction: FMFunctionDto2 | null, isUp: boolean): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    this.helper.moveFunction(this.currentFmeaDoc!, this.currentSelectedFunction, isUp);

    this.refreshView();
    this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
  }

  // Delete methods
  deleteFunctionNode($event: MouseEvent, fmFunction: FMFunctionDto2 | null): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    this.helper.deleteFunction(this.currentFmeaDoc!, this.currentSelectedFunction, true, false, false);

    this.refreshView();
    this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
  }
}
