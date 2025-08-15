import { Injectable } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { FMStructureDto, FMFunctionDto, FMEADto2 ,FMStructureDto2, FMFunctionDto2, FMFaultDto2 } from '../libs/api-client';

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

    // sort for structure
    doc.fmStructures.forEach(structure => {
      structure.childFMStructures = structure.childFMStructures?.sort((a, b) => a.seq - b.seq);
      structure.seFunctions = structure.seFunctions?.sort((a, b) => a.seq - b.seq);
    });

    doc.fmFunctions.forEach(func => {
      func.prerequisites = func.prerequisites?.sort((a, b) => a.seq - b.seq);
      func.faultRefs = func.faultRefs?.sort((a, b) => a.seq - b.seq);
    });

    doc.fmFaults.forEach(fault => {
      fault.causes = fault.causes?.sort((a, b) => a.seq - b.seq);
    });

    doc.rootFMStructure = doc.fmStructures!.find((s) => s.code === doc.rootFMStructure?.code); 
    return doc;
  }

  public findFMFaultByCode(faults: FMFaultDto2[], code: string): FMFaultDto2 | null {
    if (!faults || !code) {
      return null;
    }

    for (const fault of faults) {
      // Check if current fault matches the code
      if (fault.code === code) {
        return fault;
      }

      // Recursively search in child faults
      const found = this.findFMFaultByCode(fault.causes, code);
      if (found) {
        return found;
      }
    }

    // Not found
    return null;
  }

  public findFMFunctionByCode(functions: FMFunctionDto2[], code: string): FMFunctionDto2 | null {
    if (!functions || !code) {
      return null;
    }

    for (const func of functions) {
      // Check if current function matches the code
      if (func.code === code) {
        return func;
      }

      // Recursively search in child functions
      const found = this.findFMFunctionByCode(func.prerequisites, code);
      if (found) {
        return found;
      }
    }

    // Not found
    return null;
  }

  public findFMStructureByCode(structures: FMStructureDto2[], code: string): FMStructureDto2 | null {
    if (!structures || !code) {
      return null;
    }

    for (const structure of structures) {
      // Check if current structure matches the code
      if (structure.code === code) {
        return structure;
      }

      // Recursively search in child structures
      const found = this.findFMStructureByCode(structure.childFMStructures, code);
      if (found) {
        return found;
      }
    }

    // Not found
    return null;
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

    var hasChildrenStructures: boolean = data.childFMStructures != null && data.childFMStructures.length > 0;
    var hasChildrenFunctions: boolean = includesFunc && data.seFunctions != null && data.seFunctions.length > 0;

    var node: NzTreeNodeOptions = {
      icon: 'setting',
      title: `${data.code}/${data.longName}`,
      key: String(data.code),
      expanded: true,
      child: null,
      isLeaf: !hasChildrenStructures && !hasChildrenFunctions,
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

      const sortedStructures = data.childFMStructures.sort((a, b) => a.seq - b.seq);
      for (let i = 0; i < sortedStructures.length; i++) {
        var childNode = this.generateTreeNodes(sortedStructures[i], includesFunc);
        node.children.push(childNode);
      }
    }

    return node
  }

  public generateNextStructureCode(fmStructures: FMStructureDto2[]): string {
    if (!fmStructures || fmStructures.length === 0) {
      return 'S001-001';
    }

    let maxCode = '';
    let maxNumber = 0;

    // Find the biggest structure code
    for (const structure of fmStructures) {
      if (structure.code) {
        const code = structure.code;
        
        // Extract the numeric part from codes like "S001-003"
        const match = code.match(/^(S\d{3}-?)(\d{3})$/);
        if (match) {
          const prefix = match[1];
          const number = parseInt(match[2], 10);
          
          if (number > maxNumber) {
            maxNumber = number;
            maxCode = code;
          }
        }
      }
    }

    // Generate next code
    if (maxCode) {
      const match = maxCode.match(/^(S\d{3}-?)(\d{3})$/);
      if (match) {
        const prefix = match[1];
        const nextNumber = maxNumber + 1;
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      }
    }

    // Fallback if no valid codes found
    return 'S001-001';
  }

  public generateChildStructureCode(parentCode: string, existingChildren: FMStructureDto2[]): string {
    if (!parentCode) {
      return 'S001-001';
    }

    // Find the highest child number for this parent
    let maxChildNumber = 0;
    
    if (existingChildren && existingChildren.length > 0) {
      for (const child of existingChildren) {
        if (child.code && child.code.startsWith(parentCode + '.')) {
          // Extract child number from codes like "S001-001.1", "S001-001.2", etc.
          const childPart = child.code.substring(parentCode.length + 1);
          const childNumber = parseInt(childPart, 10);
          
          if (!isNaN(childNumber) && childNumber > maxChildNumber) {
            maxChildNumber = childNumber;
          }
        }
      }
    }

    // Generate next child code
    return `${parentCode}.${maxChildNumber + 1}`;
  }

}
