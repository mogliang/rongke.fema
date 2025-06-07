import { Component } from '@angular/core';
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
    var doc = this.fmeaService.apiFMEACodeCodeGet("FMEA-0001");
    doc.subscribe((data: FMEADto2) => {
      this.femaDoc = this.helper.fillTreeLinks(data);

      if (this.femaDoc.rootFMStructure) {
        var roots= this.femaDoc.fmFunctions.filter(item => !item.parentFMFunctionCode);
        this.fmFunctions = this.helper.flattenFunctions(roots);
        
        var rootNode = this.helper.generateTreeNodes(this.femaDoc.rootFMStructure, true);
        this.nodes = rootNode.children || [];
      }
    });
  }

    public femaDoc: FMEADto2|null = null;
  public fmFunctions: FMFunctionDto2[] = [];
  public nodes: NzTreeNodeOptions[] = [];
}
