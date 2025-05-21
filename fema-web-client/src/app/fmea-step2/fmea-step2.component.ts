import { Component, inject } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule, NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FMStructureDto, FMStructuresService, TreeType } from '../../libs/api-client';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule, NzFormTooltipIcon } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { HelperService } from '../helper.service';
import { NzContextMenuService, NzDropdownMenuComponent, NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule ,
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
  constructor(private nzContextMenuService: NzContextMenuService, private fmStructureService: FMStructuresService, private helper: HelperService) { }

  ngOnInit() {
    var fmStructure = this.fmStructureService.apiFMStructuresTreeCodeGet("S001-001", TreeType.NUMBER_0);
    fmStructure.subscribe((data: FMStructureDto) => {
      var node = this.helper.generateTreeNodes(data);
      this.nodes = node.children || [];
      this.fmStructures = this.helper.flattenFMStructures(data.childFMStructures || []);
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
      this.selectedStructure = this.fmStructures.find((item) => item.code === this.selectedCode) || {};
      this.nzContextMenuService.create($event.event!, menu);
      this.editForm.setValue({
        code: this.selectedStructure.code!,
        longName: this.selectedStructure.longName!,
        shortName: this.selectedStructure.shortName!,
        category: this.selectedStructure.category!,
      });
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
    this.isEditMode = false;
  }

  deleteNode($event: MouseEvent): void {
    console.log(this.selectedCode);
  }

  deleteSubTree($event: MouseEvent): void {
    console.log(this.selectedCode);
  }


  public selectedStructure: FMStructureDto = {}
  public selectedCode: string = '';
  public fmStructures: FMStructureDto[] = [];
  public nodes: NzTreeNodeOptions[] = [];
}
