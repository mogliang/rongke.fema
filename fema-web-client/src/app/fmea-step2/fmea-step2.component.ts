import { Component } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FMStructureDto, FMStructuresService } from '../../libs/api-client';
import { Observable } from 'rxjs';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';


@Component({
  selector: 'app-fmea-step2',
  imports: [NzTabsModule, NzTreeModule, NzTableModule, NzDividerModule, NzCardModule,NzSplitterModule],
  providers: [FMStructuresService],
  templateUrl: './fmea-step2.component.html',
  styleUrl: './fmea-step2.component.css'
})
export class FmeaStep2Component {
  fmStructure: Observable<FMStructureDto> = new Observable<FMStructureDto>();

  constructor(private fmStructureService: FMStructuresService) { }

  ngOnInit() {
    this.fmStructure = this.fmStructureService.apiFMStructuresTreeCodeGet("S901002");
    this.fmStructure.subscribe((data: FMStructureDto) => {
      var node = this.generateTreeNodes(data);
      this.nodes = node.children || [];
      this.fmStructures = this.flattenFMStructures(data)
    });
  }

  flattenFMStructures(fmStructure: FMStructureDto): FMStructureDto[] {
    let flatList: FMStructureDto[] = [];
    if (fmStructure.childFMStructures !=null) {
      for (let i = 0; i < fmStructure.childFMStructures.length; i++) {
        flatList.push(fmStructure.childFMStructures[i]);
        flatList.push(...this.flattenFMStructures(fmStructure.childFMStructures[i]));
      }
    }
    return flatList;
  }

  generateTreeNodes(data: FMStructureDto): NzTreeNodeOptions {
    var node: NzTreeNodeOptions = {
      icon: 'setting',
      title: `${data.code}/${data.longName}`,
      key: String(data.code),
      expanded: true,
      child: null,
      isLeaf: data.childFMStructures == null || data.childFMStructures.length == 0
    };

    if (data.childFMStructures != null) {
      node.children = [];
      for (let i = 0; i < data.childFMStructures?.length; i++) {
        var childNode = this.generateTreeNodes(data.childFMStructures[i]);
        node.children.push(childNode);
      }
    }

    return node
  }

  onIndexChange(index: number): void {
    this.step = index;
  }

  public fmStructures: FMStructureDto[] = [];
  public nodes: NzTreeNodeOptions[] = [];
  public step = 0
}
