import { Component, inject, input } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule, NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FMEADto2, FMEAService, FMStructuresService, FMStructureDto2, TreeType } from '../../libs/api-client';
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
  imports: [NzFormModule, NzInputModule, ReactiveFormsModule, NzModalModule, NzButtonModule, NzIconModule, NzDropDownModule, NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [FMStructuresService, HelperService],
  templateUrl: './fmea-step2.component.html',
  styleUrl: './fmea-step2.component.css'
})
export class FmeaStep2Component {
  constructor(private nzContextMenuService: NzContextMenuService, private fmeaService: FMEAService, private message: NzMessageService, private helper: HelperService) { }

  // ========================================
  // INITIALIZATION SECTION
  // ========================================
  
  // Input/Output
  @Output() femaDocUpdated = new EventEmitter<FMEADto2>();
  fmeaDoc = input.required<FMEADto2 | null>();

  // Data properties
  currentFmeaDoc: FMEADto2 | null = null;
  public flattenedStructures: FMStructureDto2[] = [];
  public currentSelectedStructure: FMStructureDto2= {
    code: '',
    longName: '',
    shortName: '',
    category: '',
    seq: 0,
    childFMStructures: [],
    seFunctions: [],
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
      var rootNode = this.helper.generateTreeNodes(this.currentFmeaDoc.rootFMStructure, false);
      this.fullTreeNodes = [rootNode];
      this.childTreeNodes = rootNode.children || [];
      console.log('refreshView', this.childTreeNodes);
      this.flattenedStructures = this.helper.flattenFMStructures(this.currentFmeaDoc.rootFMStructure.childFMStructures);
    }
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
      var selectedNode: FMStructureDto2 | null | undefined = null;

      if (this.currentFmeaDoc!.rootFMStructure?.code == selectedCode) {
        selectedNode = this.currentFmeaDoc!.rootFMStructure;
      } else {
        selectedNode = this.flattenedStructures.find((item) => item.code === selectedCode);
      }

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
    var newCode = this.helper.generateNextStructureCode(this.currentFmeaDoc!.fmStructures)
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
        parentFMStructureCode: this.currentSelectedStructure.code,
        childFMStructures: [],
        seFunctions: [],
      };

      // Add to parent's children
      if (!this.currentSelectedStructure.childFMStructures) {
        this.currentSelectedStructure.childFMStructures = [];
      }
      this.currentSelectedStructure.childFMStructures.push(newStructure);

      // Add to the main fmStructures list as well
      if (!this.currentFmeaDoc?.fmStructures) {
        this.currentFmeaDoc!.fmStructures = [];
      }
      this.currentFmeaDoc!.fmStructures.push(newStructure);

      for (let i = 0; i < this.currentSelectedStructure.childFMStructures.length; i++) {
        this.currentSelectedStructure.childFMStructures[i].seq=i;
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
      this.femaDocUpdated.emit(this.currentFmeaDoc!);
    }
  }

  // Move method 
  moveStructureNode($event: MouseEvent, fmStructure: FMStructureDto2 | null, isUp: boolean): void {
    if (fmStructure != null) {
      this.selectStructureNode(fmStructure);
    }

    if (!this.currentSelectedStructure.parentFMStructureCode) {
      this.message.error('无法移动根FEMA结构');
      return;
    }

    var parentStructure = this.helper.findFMStructureByCode(this.currentFmeaDoc?.fmStructures!, this.currentSelectedStructure.parentFMStructureCode);
    if (!parentStructure) {
      this.message.error('无法找到父FEMA结构');
      return;
    }

    const idx=parentStructure.childFMStructures.findIndex(s=>s.code === this.currentSelectedStructure.code);
    if (idx == -1){
      this.message.error('无法找到当前FEMA结构');
      return;
    }

    if (isUp) {
      if (idx > 0) {
        const temp = parentStructure.childFMStructures[idx - 1];
        parentStructure.childFMStructures[idx - 1] = parentStructure.childFMStructures[idx];
        parentStructure.childFMStructures[idx] = temp;
      }
    } else {
      if (idx < parentStructure.childFMStructures.length - 1) {
        const temp = parentStructure.childFMStructures[idx + 1];
        parentStructure.childFMStructures[idx + 1] = parentStructure.childFMStructures[idx];
        parentStructure.childFMStructures[idx] = temp;
      }
    }

    for (let i = 0; i < parentStructure.childFMStructures.length; i++) {
      parentStructure.childFMStructures[i].seq = i;
    }

    this.refreshView();
    this.femaDocUpdated.emit(this.currentFmeaDoc!);
  }

  // Delete methods (TODO: implement)
  deleteStructureNode($event: MouseEvent, fmStructure: FMStructureDto2 | null): void {
    if (fmStructure != null) {
      this.selectStructureNode(fmStructure);
    }

    if (!this.currentSelectedStructure.parentFMStructureCode) {
      this.message.error('无法删除根FEMA结构');
      return
    }

    if (this.currentSelectedStructure.childFMStructures.length > 0) {
      this.message.error('无法删除FEMA结构，当前结构下存在子结构');
      return;
    }

    if (this.currentFmeaDoc?.fmFunctions.find(func=>func.fmStructureCode === fmStructure?.code)) {
      this.message.error('无法删除FEMA结构，当前结构下存在功能');
      return;
    }

    var parentStructure = this.helper.findFMStructureByCode(this.currentFmeaDoc?.fmStructures!, this.currentSelectedStructure.parentFMStructureCode);
    if (!parentStructure) {
      this.message.error('无法找到父FEMA结构');
      return;
    }

    this.currentFmeaDoc!.fmStructures = this.currentFmeaDoc!.fmStructures.filter(s => s.code !== this.currentSelectedStructure.code);
    parentStructure.childFMStructures = parentStructure.childFMStructures?.filter(s => s.code !== this.currentSelectedStructure.code);

    this.refreshView();
    this.femaDocUpdated.emit(this.currentFmeaDoc!);
  }
}
