import { Component } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FMStructureDto, FMStructuresService, TreeType } from '../../libs/api-client';
import { Observable } from 'rxjs';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { HelperService } from '../helper.service';
import { NzContextMenuService, NzDropdownMenuComponent, NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
  selector: 'app-fmea-step2',
  imports: [NzIconModule, NzDropDownModule, NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [FMStructuresService, HelperService],
  templateUrl: './fmea-step2.component.html',
  styleUrl: './fmea-step2.component.css'
})
export class FmeaStep2Component {
  constructor(private nzContextMenuService: NzContextMenuService, private fmStructureService: FMStructuresService, private helper: HelperService) { }

  ngOnInit() {
    var fmStructure = this.fmStructureService.apiFMStructuresTreeCodeGet("S901002", TreeType.NUMBER_0);
    fmStructure.subscribe((data: FMStructureDto) => {
      var node = this.helper.generateTreeNodes(data);
      this.nodes = node.children || [];
      this.fmStructures = this.helper.flattenFMStructures(data.childFMStructures || []);
    });
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
    this.nzContextMenuService.create($event, menu);
  }

  selectDropdown(): void {
    // do something
  }

  public fmStructures: FMStructureDto[] = [];
  public nodes: NzTreeNodeOptions[] = [];
}
