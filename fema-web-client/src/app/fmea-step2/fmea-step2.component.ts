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
  constructor(private nzContextMenuService: NzContextMenuService, private fmeaService: FMEAService, private helper: HelperService) { }

  ngOnInit() {
  }

  ngOnChanges() {
    this.refreshView();
  }

  internalFmeaDoc: FMEADto2 | null = null;
  private fb = inject(NonNullableFormBuilder);
  public editForm = this.fb.group({
    code: ['', [Validators.required]],
    longName: ['', [Validators.required, Validators.maxLength(100)]],
    shortName: ['', [Validators.required, Validators.maxLength(10)]],
    category: ['', [Validators.required]],
  });

  public addForm = this.fb.group({
    code: ['', [Validators.required]],
    longName: ['', [Validators.required, Validators.maxLength(100)]],
    shortName: ['', [Validators.required, Validators.maxLength(10)]],
    category: ['', [Validators.required]],
  });
  
  contextMenu2($event: NzFormatEmitEvent, menu: NzDropdownMenuComponent): void {
    if ($event.node) {
      this.selectedCode = $event.node?.key!;
      var selectedNode: FMStructureDto2 | null | undefined = null;

      if (this.internalFmeaDoc!.rootFMStructure?.code == this.selectedCode) {
        selectedNode = this.internalFmeaDoc!.rootFMStructure;
      } else {
        selectedNode = this.fmStructures.find((item) => item.code === this.selectedCode);
      }

      if (selectedNode) {
        this.setSelectedNode(selectedNode);
        this.nzContextMenuService.create($event.event!, menu);
      }
    }
  }

  refreshView() {
    if (this.internalFmeaDoc == null && this.fmeaDoc() !== null) {
      this.internalFmeaDoc = this.fmeaDoc()!;
    }

    console.log('refreshView', this.internalFmeaDoc);
    if (this.internalFmeaDoc?.rootFMStructure) {
      var rootNode = this.helper.generateTreeNodes(this.internalFmeaDoc.rootFMStructure, false);
      this.rootNodes = [rootNode];
      this.nodes = rootNode.children || [];
      console.log('refreshView', this.nodes);
      this.fmStructures = this.helper.flattenFMStructures(this.internalFmeaDoc.rootFMStructure.childFMStructures);
    }
  }

  showRootTree(): void {
    this.showRootTreeFlag = !this.showRootTreeFlag;
  }

  setSelectedNode(fmStructure: FMStructureDto2): void {
    this.selectedStructure = fmStructure;
    this.editForm.setValue({
      code: this.selectedStructure.code,
      longName: this.selectedStructure.longName,
      shortName: this.selectedStructure.shortName,
      category: this.selectedStructure.category,
    });
  }

  addSubNode($event: MouseEvent, fmStructure: FMStructureDto2 | null): void {
    if (fmStructure != null) {
      this.setSelectedNode(fmStructure);
    }

    this.isAddMode = true;
    this.addForm.reset();
    var newCode = this.helper.generateNextStructureCode(this.internalFmeaDoc!.fmStructures)
    this.addForm.patchValue({ code: newCode });
    console.log('Adding sub node for:', this.selectedCode);
  }

  // edit modal
  public isEditMode: boolean = false;
  // add modal
  public isAddMode: boolean = false;
  editNode($event: MouseEvent, fmStructure: FMStructureDto2 | null): void {
    if (fmStructure != null) {
      this.setSelectedNode(fmStructure);
    }

    this.isEditMode = true;
    console.log(this.selectedCode);
  }
  handleEditCancel(): void {
    this.isEditMode = false;
  }
  handleEditOk(): void {
    if (this.editForm.valid) {
      this.isEditMode = false;
      this.selectedStructure.longName = this.editForm.value.longName!;
      this.selectedStructure.shortName = this.editForm.value.shortName!;
      this.selectedStructure.category = this.editForm.value.category!;
      this.refreshView();

      this.femaDocUpdated.emit(this.internalFmeaDoc!);
    }
  }

  // add modal methods
  handleAddCancel(): void {
    this.isAddMode = false;
  }

  handleAddOk(): void {
    if (this.addForm.valid) {
      this.isAddMode = false;

      // Create new structure
      const newStructure: FMStructureDto2 = {
        code: this.addForm.value.code!,
        longName: this.addForm.value.longName!,
        shortName: this.addForm.value.shortName!,
        category: this.addForm.value.category!,
        parentFMStructureCode: this.selectedStructure.code,
        childFMStructures: [],
        seFunctions: [],
      };

      // Add to parent's children
      if (!this.selectedStructure.childFMStructures) {
        this.selectedStructure.childFMStructures = [];
      }
      this.selectedStructure.childFMStructures.push(newStructure);

      // Add to the main fmStructures list as well
      if (!this.internalFmeaDoc?.fmStructures) {
        this.internalFmeaDoc!.fmStructures = [];
      }
      this.internalFmeaDoc!.fmStructures.push(newStructure);

      // Refresh view and emit update
      this.refreshView();
      this.femaDocUpdated.emit(this.internalFmeaDoc!);
    }
  }

  deleteNode($event: MouseEvent): void {
    console.log(this.selectedCode);
  }

  deleteSubTree($event: MouseEvent): void {
    console.log(this.selectedCode);
  }


  @Output() femaDocUpdated = new EventEmitter<FMEADto2>();
  fmeaDoc = input.required<FMEADto2 | null>();
  public selectedStructure: FMStructureDto2 = {
    code: '',
    longName: '',
    shortName: '',
    category: '',
    parentFMStructureCode: '',
    childFMStructures: [],
    seFunctions: [],
  }
  public selectedCode: string = '';
  public fmStructures: FMStructureDto2[] = [];

  public nodes: NzTreeNodeOptions[] = [];
  public rootNodes: NzTreeNodeOptions[] = [];
  public showRootTreeFlag: boolean = false;
}
