import { Component, inject } from '@angular/core';
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
    var doc = this.fmeaService.apiFMEADocGet();
    doc.subscribe((data: FMEADto2) => {
      this.femaDoc = this.helper.fillTreeLinks(data);

      if (this.femaDoc.rootFMStructure) {
        this.fmStructures = this.helper.flattenFMStructures(this.femaDoc.rootFMStructure.childFMStructures);
        var rootNode = this.helper.generateTreeNodes(this.femaDoc.rootFMStructure, false);
        this.nodes = rootNode.children || [];
      }
    });
  }

  private fb = inject(NonNullableFormBuilder);
  public editForm = this.fb.group({
    code: ['', [Validators.required]],
    longName: ['', [Validators.required]],
    shortName: ['', [Validators.required]],
    category: ['', [Validators.required]],
  });
  contextMenu2($event: NzFormatEmitEvent, menu: NzDropdownMenuComponent): void {
    if ($event.node) {
      this.selectedCode = $event.node?.key!;
      var selectedNode = this.fmStructures.find((item) => item.code === this.selectedCode);
      if (selectedNode) {
        this.selectedStructure = selectedNode;
        this.nzContextMenuService.create($event.event!, menu);
        this.editForm.setValue({
          code: this.selectedStructure.code,
          longName: this.selectedStructure.longName,
          shortName: this.selectedStructure.shortName,
          category: this.selectedStructure.category,
        });
      }
    }
  }

  addSubNode($event: MouseEvent): void {
    console.log(this.selectedCode);
  }

  // edit modal
  public isEditMode: boolean = false;
  editNode($event: MouseEvent): void {
    this.isEditMode = true;
    console.log(this.selectedCode);
  }
  handleEditCancel(): void {
    this.isEditMode = false;
  }
  handleEditOk(): void {
    if (this.editForm.valid) {
      this.selectedStructure.longName = this.editForm.value.longName!;
      this.selectedStructure.shortName = this.editForm.value.shortName!;
      this.selectedStructure.category = this.editForm.value.category!;
    }
    this.isEditMode = false;
  }

  deleteNode($event: MouseEvent): void {
    console.log(this.selectedCode);
  }

  deleteSubTree($event: MouseEvent): void {
    console.log(this.selectedCode);
  }


  public femaDoc: FMEADto2 | null = null;
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
}
