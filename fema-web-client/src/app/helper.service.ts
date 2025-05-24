import { Injectable } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { FMStructureDto, FMFunctionDto, FMEADto2 ,FMStructureDto2, FMFunctionDto2, FMFaultDto2} from '../libs/api-client';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  public fillTreeLinks(doc: FMEADto2) :FMEADto2 {
    if (!doc || !doc.fmStructures || !doc.fmFunctions || !doc.fmFaults) {
      return doc;
    }

    // Step 1: Create lookup maps for quick access
    const structureMap = new Map<string, FMStructureDto2>();
    const functionMap = new Map<string, FMFunctionDto2>();
    const faultMap = new Map<string, FMFaultDto2>();

    // Build maps for each entity type
    doc.fmStructures.forEach(structure => {
      if (structure.code) {
        structureMap.set(structure.code, structure);
      }
    });

    doc.fmFunctions.forEach(func => {
      if (func.code) {
        functionMap.set(func.code, func);
      }
    });

    doc.fmFaults.forEach(fault => {
      if (fault.code) {
        faultMap.set(fault.code, fault);
      }
    });


    doc.fmStructures.forEach(structure => {
      // Link structure.childFMStructures
      if (structure.parentFMStructureCode) {
        const parentStructure = structureMap.get(structure.parentFMStructureCode);
        if (parentStructure) {
          if (!parentStructure.childFMStructures) {
            parentStructure.childFMStructures = [];
          }
          if (!parentStructure.childFMStructures.includes(structure)) {
            parentStructure.childFMStructures.push(structure);
          }
        }
      }
    });

    doc.fmFunctions.forEach(func => {
      // Link structure.seFunctions
      if (func.fmStructureCode) {
        const structure = structureMap.get(func.fmStructureCode);
        if (structure) {
          if (!structure.seFunctions) {
            structure.seFunctions = [];
          }
          if (!structure.seFunctions.includes(func)) {
            structure.seFunctions.push(func);
          }
        }
      }

      // Link function.prerequisites
      if (func.parentFMFunctionCode) {
        const parentFunction = functionMap.get(func.parentFMFunctionCode);
        if (parentFunction) {
          if (!parentFunction.prerequisites) {
            parentFunction.prerequisites = [];
          }
          if (!parentFunction.prerequisites.includes(func)) {
            parentFunction.prerequisites.push(func);
          }
        }
      }
    });

    doc.fmFaults.forEach(fault => {
      // Link faults to functions
      if (fault.fmFunctionCode) {
        const func = functionMap.get(fault.fmFunctionCode);
        if (func) {
          if (!func.faultRefs) {
            func.faultRefs = [];
          }
          if (!func.faultRefs.includes(fault)) {
            func.faultRefs.push(fault);
          }
        }
      }

      // Link fault.Causes
      if (fault.parentFaultCode) {
        const parentFault = faultMap.get(fault.parentFaultCode);
        if (parentFault) {
          if (!parentFault.causes) {
            parentFault.causes = [];
          }
          if (!parentFault.causes.includes(fault)) {
            parentFault.causes.push(fault);
          }
        }
      }
    });

    doc.rootFMStructure = doc.fmStructures!.find((s) => s.code === doc.rootFMStructure?.code); 
    return doc;
  }

  public flattenFMStructures(fmStructures: FMStructureDto2[]): FMStructureDto2[] {
    let flatList: FMStructureDto2[] = [];

    if (fmStructures == null) {
      return flatList;
    }

    for (let i = 0; i < fmStructures.length; i++) {
      flatList.push(fmStructures[i]);
      flatList.push(...this.flattenFMStructures(fmStructures[i].childFMStructures || []));
    }

    return flatList;
  }

  public flattenFunctions(fmFunctions: FMFunctionDto2[]): FMFunctionDto2[] {
    let flatList: FMFunctionDto2[] = [];

    if (fmFunctions == null) {
      return flatList;
    }

    for (let i = 0; i < fmFunctions.length; i++) {
      flatList.push(fmFunctions[i]);
      flatList.push(...this.flattenFunctions(fmFunctions[i].prerequisites || []));
    }

    return flatList;
  }

  public generateTreeNodes(data: FMStructureDto2, includesFunc: boolean): NzTreeNodeOptions {
    if (!data) {
      return {
        title: '',
        key: '',
      }
    }

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

      if(includesFunc) {
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
      }
    
      for (let i = 0; i < data.childFMStructures?.length; i++) {
        var childNode = this.generateTreeNodes(data.childFMStructures[i], includesFunc);
        node.children.push(childNode);
      }
    }

    return node
  }

}
