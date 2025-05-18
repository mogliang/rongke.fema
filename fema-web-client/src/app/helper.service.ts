import { Injectable } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { FMStructureDto, FMFunctionDto } from '../libs/api-client';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  public flattenFMStructures(fmStructures: FMStructureDto[]): FMStructureDto[] {
    let flatList: FMStructureDto[] = [];

    if (fmStructures == null) {
      return flatList;
    }

    for (let i = 0; i < fmStructures.length; i++) {
      flatList.push(fmStructures[i]);
      flatList.push(...this.flattenFunctions(fmStructures[i].childFMStructures || []));
    }

    return flatList;
  }

  public flattenFunctions(fmFunctions: FMFunctionDto[]): FMFunctionDto[] {
    let flatList: FMFunctionDto[] = [];

    if (fmFunctions == null) {
      return flatList;
    }

    for (let i = 0; i < fmFunctions.length; i++) {
      flatList.push(fmFunctions[i]);
      flatList.push(...this.flattenFunctions(fmFunctions[i].prerequisites || []));
    }

    return flatList;
  }

  public generateTreeNodes(data: FMStructureDto): NzTreeNodeOptions {
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

      if (data.seFunctions != null) {
        for (let i = 0; i < data.seFunctions?.length; i++) {
          var func = data.seFunctions[i];
          node.children.push({
            icon: 'aim',
            title: `${func.code}/${func.longName}`,
            key: String(func.code),
            expanded: true,
            isLeaf: true,
          })
        }
      }
    
      for (let i = 0; i < data.childFMStructures?.length; i++) {
        var childNode = this.generateTreeNodes(data.childFMStructures[i]);
        node.children.push(childNode);
      }
    }

    return node
  }

}
