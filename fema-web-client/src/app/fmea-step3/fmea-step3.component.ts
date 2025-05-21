import { Component } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FMFunctionDto, FMStructureDto, FMStructuresService, FMFunctionsService, TreeType } from '../../libs/api-client';
import { Observable } from 'rxjs';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { HelperService } from '../helper.service';

@Component({
  selector: 'app-fmea-step3',
  imports: [NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [FMStructuresService, FMFunctionsService, HelperService],
  templateUrl: './fmea-step3.component.html',
  styleUrl: './fmea-step3.component.css'
})
export class FmeaStep3Component {
  constructor(private fmFunctionService: FMFunctionsService, private fmStructureService: FMStructuresService, private helper: HelperService) { }

  ngOnInit() {
    var fmStructure = this.fmStructureService.apiFMStructuresTreeCodeGet("S001-001", TreeType.NUMBER_1);
    fmStructure.subscribe((data: FMStructureDto) => {
      var node = this.helper.generateTreeNodes(data);
      this.nodes = node.children || [];
    });

    var fmFunctions = this.fmFunctionService.apiFMFunctionsAllGet();
    fmFunctions.subscribe((data: FMFunctionDto[]) => {
      this.fmFunctions = data;
    });
  }

  public fmFunctions: FMFunctionDto[] = [];
  public nodes: NzTreeNodeOptions[] = [];
}
