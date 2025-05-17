import { Component } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeNodeOptions, NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { FMStructureDto, FMStructuresService } from '../../../libs/api-client';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-welcome',
  imports: [NzLayoutModule, NzGridModule, NzStepsModule, NzCardModule, NzFlexModule, NzButtonModule, NzTabsModule, NzRadioModule, NzTreeModule, NzTableModule, NzDividerModule],
  providers: [FMStructuresService],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
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

  public fmStructures: FMStructureDto[] = [];
  public nodes: NzTreeNodeOptions[] = [];
}