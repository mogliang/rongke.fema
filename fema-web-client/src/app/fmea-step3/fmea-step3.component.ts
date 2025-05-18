import { Component } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FMStructureDto, FMStructuresService, TreeType } from '../../libs/api-client';
import { Observable } from 'rxjs';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { HelperService } from '../helper.service';

@Component({
  selector: 'app-fmea-step3',
  imports: [NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [FMStructuresService, HelperService],
  templateUrl: './fmea-step3.component.html',
  styleUrl: './fmea-step3.component.css'
})
export class FmeaStep3Component {
  fmStructure: Observable<FMStructureDto> = new Observable<FMStructureDto>();

  constructor(private fmStructureService: FMStructuresService, private helper: HelperService) { }

  ngOnInit() {
    this.fmStructure = this.fmStructureService.apiFMStructuresTreeCodeGet("S901002", TreeType.NUMBER_1);
    this.fmStructure.subscribe((data: FMStructureDto) => {
      var node = this.helper.generateTreeNodes(data);
      this.nodes = node.children || [];
      this.fmStructures = this.helper.flattenFMStructures(data);
    });
  }

  public fmStructures: FMStructureDto[] = [];
  public nodes: NzTreeNodeOptions[] = [];
}
