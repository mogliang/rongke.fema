import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule, NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FMEADto2, FMEAService, FMStructureDto2 } from '../../libs/api-client';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule, NzFormTooltipIcon } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { HelperService } from '../helper.service';
import { NzContextMenuService, NzDropdownMenuComponent, NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Output, EventEmitter } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-fmea-step2',
  imports: [CommonModule, NzFormModule, NzInputModule, ReactiveFormsModule, NzModalModule, NzButtonModule, NzIconModule, NzDropDownModule, NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [HelperService],
  templateUrl: './fmea-step2.component.html',
  styleUrl: './fmea-step2.component.css'
})
export class FmeaStep2Component {
  constructor(private nzContextMenuService: NzContextMenuService, private fmeaService: FMEAService, private message: NzMessageService, private helper: HelperService) { }

  // ========================================
  // INITIALIZATION SECTION
  // ========================================

  // Input/Output
  @Output() fmeaDocUpdated = new EventEmitter<FMEADto2>();
  fmeaDoc = input.required<FMEADto2 | null>();

  // Data properties
  currentFmeaDoc: FMEADto2 | null = null;
  public flattenedStructures: FMStructureDto2[] = [];
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
    var root = this.currentFmeaDoc?.fmStructures.find(f => f.code === this.currentFmeaDoc?.rootStructureCode);
    var rootNode = this.helper.generateTreeNodes(this.currentFmeaDoc!, root!, false, false);

    this.fullTreeNodes = [rootNode];
    this.childTreeNodes = rootNode.children || [];
    this.flattenedStructures = this.helper.flattenStructures(this.currentFmeaDoc!);
  }

  toggleRootTreeDisplay(): void {
    this.showRootInTree = !this.showRootInTree;
  }

  selectStructureNode(fmStructure: FMStructureDto2): void {
    this.currentSelectedStructure = fmStructure;
  }

  onTreeContextMenu($event: NzFormatEmitEvent, menu: NzDropdownMenuComponent): void {
    if ($event.node) {
      const selectedCode = $event.node?.key!;
      var selectedNode = this.currentFmeaDoc?.fmStructures.find((item) => item.code === selectedCode);

      if (selectedNode) {
        this.selectStructureNode(selectedNode);
        this.nzContextMenuService.create($event.event!, menu);
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
    category: ['', [Validators.required]],
  });

  // Add methods
  openAddStructureModal($event: MouseEvent, fmStructure: FMStructureDto2 | null): void {
    if (fmStructure != null) {
      this.selectStructureNode(fmStructure);
    }

    this.isAddMode = true;
    this.addForm.reset();
    var newCode = this.helper.generateNextStructureCode(this.currentFmeaDoc!)
    this.addForm.patchValue({ code: newCode });
    console.log('Adding sub node for:', this.currentSelectedStructure.code);
  }

  cancelAddStructure(): void {
    this.isAddMode = false;
  }

  confirmAddStructure(): void {
    if (this.addForm.valid) {
      this.isAddMode = false;

      // Create new structure
      const newStructure: FMStructureDto2 = {
        code: this.addForm.value.code!,
        seq: 0,
        longName: this.addForm.value.longName!,
        shortName: this.addForm.value.shortName!,
        category: this.addForm.value.category!,
        level: this.currentSelectedStructure.level + 1,
        decomposition: [],
        functions: [],
      };

      this.helper.createChildStructure(this.currentFmeaDoc!, this.currentSelectedStructure, newStructure);
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
    shortName: ['', [Validators.required, Validators.maxLength(10)]],
    category: ['', [Validators.required]],
  });

  // Edit methods
  openEditStructureModal($event: MouseEvent, fmStructure: FMStructureDto2 | null): void {
    if (fmStructure != null) {
      this.selectStructureNode(fmStructure);
    }

    this.editForm.setValue({
      code: this.currentSelectedStructure.code,
      longName: this.currentSelectedStructure.longName,
      shortName: this.currentSelectedStructure.shortName,
      category: this.currentSelectedStructure.category,
    });

    this.isEditMode = true;
    console.log(this.currentSelectedStructure.code);
  }

  cancelEditStructure(): void {
    this.isEditMode = false;
  }

  confirmEditStructure(): void {
    if (this.editForm.valid) {
      this.isEditMode = false;
      this.currentSelectedStructure.longName = this.editForm.value.longName!;
      this.currentSelectedStructure.shortName = this.editForm.value.shortName!;
      this.currentSelectedStructure.category = this.editForm.value.category!;

      this.refreshView();
      this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
    }
  }

  // Move method 
  moveStructureNode($event: MouseEvent, fmStructure: FMStructureDto2 | null, isUp: boolean): void {
    if (fmStructure != null) {
      this.selectStructureNode(fmStructure);
    }

    this.helper.moveStructure(this.currentFmeaDoc!, this.currentSelectedStructure, isUp);
    this.refreshView();
    this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
  }

  // Delete methods (TODO: implement)
  deleteStructureNode($event: MouseEvent, fmStructure: FMStructureDto2 | null): void {
    if (fmStructure != null) {
      this.selectStructureNode(fmStructure);
    }

    try {
      this.helper.deleteStructure(this.currentFmeaDoc!, this.currentSelectedStructure, false, false, false, false, false);
      this.refreshView();
      this.fmeaDocUpdated.emit(this.currentFmeaDoc!);
    } catch (err) {
      this.message.error((err as Error).message || 'An error occurred');
    }
  }
}
