import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule, NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FMFaultDto2, FMEADto2, FMEAService, FMFunctionDto2, FMStructureDto2 } from '../../libs/api-client';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { HelperService } from '../helper.service';
import { NzContextMenuService, NzDropdownMenuComponent, NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ViewChild, Output, EventEmitter } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-fmea-step4',
  imports: [CommonModule, NzFormModule, NzInputModule, NzInputNumberModule, ReactiveFormsModule, NzModalModule, NzButtonModule, NzIconModule, NzDropDownModule, NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [FMEAService, HelperService],
  templateUrl: './fmea-step4.component.html',
  styleUrl: './fmea-step4.component.css'
})
export class FmeaStep4Component {
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
  public fmFaults: FMFaultDto2[] = [];
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
  public currentSelectedFault: FMFaultDto2 = {
    code: '',
    longName: '',
    shortName: '',
    riskPriorityFactor: 1,
    seq: 0,
    level: 0,
    fmFunctionCode: '',
    fmFaultCode: '',
    causes: [],
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
    var rootNode = this.helper.generateTreeNodes(this.currentFmeaDoc!, root!, true, true);
    this.structureTreeNodes = rootNode.children || [];

    this.fmFaults = this.currentFmeaDoc!.fmFaults;
  }

  selectFunctionNode(fmFunction: FMFunctionDto2): void {
    this.currentSelectedFunction = fmFunction;
  }

  selectFaultNode(fmFault: FMFaultDto2): void {
    this.currentSelectedFault = fmFault;
  }

  onTreeContextMenu($event: NzFormatEmitEvent): void {
    if ($event.node) {
      const selectedCode = $event.node?.key!;
      
      // Check if this is a fault node (faults should be in the fmFaults array)
      var selectedFault = this.currentFmeaDoc?.fmFaults.find(fault => fault.code === selectedCode);
      if (selectedFault) {
        // This is a fault node - show fault context menu
        this.selectFaultNode(selectedFault);
        this.nzContextMenuService.create($event.event!, this.treeMenu2);
        return;
      }
      
      // Check if this is a function node (functions should be in the fmFunctions array)
      var selectedFunction = this.currentFmeaDoc?.fmFunctions.find(func => func.code === selectedCode);
      if (selectedFunction) {
        // This is a function node - show function context menu for adding faults
        this.selectFunctionNode(selectedFunction);
        this.nzContextMenuService.create($event.event!, this.treeMenu1);
        return;
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
    shortName: ['', [Validators.required, Validators.maxLength(20)]],
    fmFunctionCode: ['', [Validators.required]],
    riskPriorityFactor: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
  });

  // Add methods
  openAddFaultModal($event: MouseEvent, fmFunction: FMFunctionDto2 | null): void {
    if (fmFunction != null) {
      this.selectFunctionNode(fmFunction);
    }

    this.isAddMode = true;
    this.addForm.reset();
    var newCode = this.helper.generateNextFaultCode(this.currentFmeaDoc!);
    
    this.addForm.patchValue({ 
      code: newCode,
      fmFunctionCode: this.currentSelectedFunction.code,
      riskPriorityFactor: 1
    });
    console.log('Adding fault for function:', this.currentSelectedFunction.code);
  }

  cancelAddFault(): void {
    this.isAddMode = false;
  }

  confirmAddFault(): void {
    if (this.addForm.valid) {
      this.isAddMode = false;

      // Create new fault
      const newFault: FMFaultDto2 = {
        code: this.addForm.value.code!,
        seq: 0,
        level: 0,
        longName: this.addForm.value.longName!,
        shortName: this.addForm.value.shortName!,
        fmFunctionCode: this.addForm.value.fmFunctionCode!,
        fmFaultCode: '',
        riskPriorityFactor: this.addForm.value.riskPriorityFactor!,
        causes: [],
      };

      this.helper.createChildFault(this.currentFmeaDoc!, this.currentSelectedFunction!, newFault);

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
    shortName: ['', [Validators.required, Validators.maxLength(20)]],
    riskPriorityFactor: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
  });

  // Edit methods
  openEditFaultModal($event: MouseEvent, fmFault: FMFaultDto2 | null): void {
    if (fmFault != null) {
      this.selectFaultNode(fmFault);
    }

    this.editForm.setValue({
      code: this.currentSelectedFault.code,
      longName: this.currentSelectedFault.longName,
      shortName: this.currentSelectedFault.shortName,
      riskPriorityFactor: this.currentSelectedFault.riskPriorityFactor
    });

    this.isEditMode = true;
    console.log('Editing fault:', this.currentSelectedFault.code);
  }

  cancelEditFault(): void {
    this.isEditMode = false;
  }

  confirmEditFault(): void {
    if (this.editForm.valid) {
      this.isEditMode = false;
      this.currentSelectedFault.longName = this.editForm.value.longName!;
      this.currentSelectedFault.shortName = this.editForm.value.shortName!;
      this.currentSelectedFault.riskPriorityFactor = this.editForm.value.riskPriorityFactor!;

      this.refreshView();
      this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
    }
  }

  // Move method 
  moveFaultNode($event: MouseEvent, fmFault: FMFaultDto2 | null, isUp: boolean): void {
    if (fmFault != null) {
      this.selectFaultNode(fmFault);
    }

    this.helper.moveFault(this.currentFmeaDoc!, this.currentSelectedFault, isUp);

    this.refreshView();
    this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
  }

  // Delete methods
  deleteFaultNode($event: MouseEvent, fmFault: FMFaultDto2 | null): void {
    if (fmFault != null) {
      this.selectFaultNode(fmFault);
    }

    this.helper.deleteFault(this.currentFmeaDoc!, this.currentSelectedFault, true, false);

    this.refreshView();
    this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
  }
}
