import { Component ,input} from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FMFunctionDto2, FMEADto2, FMEAService, TreeType } from '../../libs/api-client';
import { Observable } from 'rxjs';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { HelperService } from '../helper.service';

@Component({
  selector: 'app-fmea-step3',
  imports: [NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule, NzSplitterModule],
  providers: [FMEAService, HelperService],
  templateUrl: './fmea-step3.component.html',
  styleUrl: './fmea-step3.component.css'
})
export class FmeaStep3Component {
  constructor(private fmeaService: FMEAService, private helper: HelperService) { }

  ngOnInit() {
  }

  ngOnChanges(){
    this.refreshView();
  }

  refreshView() {
    var rootFMStructure = this.fmeaDoc()?.rootFMStructure;
    if (rootFMStructure) {
      var rootNode = this.helper.generateTreeNodes(rootFMStructure, true);
      this.nodes = rootNode.children || [];
    }

    var rootFMFunctions = this.fmeaDoc()?.fmFunctions.filter(item => !item.parentFMFunctionCode);
    if (rootFMFunctions) {
      this.fmFunctions = this.helper.flattenFunctions(rootFMFunctions);
    }
  }

  fmeaDoc = input.required<FMEADto2 | null>();
  public fmFunctions: FMFunctionDto2[] = [];
  public nodes: NzTreeNodeOptions[] = [];
}
