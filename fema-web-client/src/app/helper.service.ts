import { Injectable } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { FMEADto2, FMStructureDto2, FMFunctionDto2, FMFaultDto2 } from '../libs/api-client';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  public getFunctions(doc:FMEADto2, structure: FMStructureDto2): FMFunctionDto2[] {
    if (!doc || !structure) {
      return [];
    }
    var funcs = doc.fmFunctions.filter(f => structure.functions.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (funcs.length != structure.functions.length) {
      throw new Error(`Function count mismatch: expected ${structure.functions.length}, found ${funcs.length}`);
    }

    return funcs;
  }

  public getDecomposition(doc:FMEADto2, structure: FMStructureDto2): FMStructureDto2[] {
    if (!doc || !structure) {
      return [];
    }
    var decomp = doc.fmStructures.filter(s => structure.decomposition.includes(s.code)).sort((a, b) => a.seq - b.seq);

    if (decomp.length != structure.decomposition.length) {
      throw new Error(`Decomposition count mismatch: expected ${structure.decomposition.length}, found ${decomp.length}`);
    }

    return decomp;
  }

  public getPrerequisites(doc:FMEADto2, func: FMFunctionDto2): FMFunctionDto2[] {
    if (!doc || !func) {
      return [];
    }
    var funcs = doc.fmFunctions.filter(f => func.prerequisites.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (funcs.length != func.prerequisites.length) {
      throw new Error(`Function count mismatch: expected ${func.prerequisites.length}, found ${funcs.length}`);
    }

    return funcs;
  }

  public getFaults(doc:FMEADto2, func:FMFunctionDto2): FMFaultDto2[] {
    if (!doc || !func) {
      return [];
    }
    var faults = doc.fmFaults.filter(f => func.faultRefs.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (faults.length != func.faultRefs.length) {
      throw new Error(`Fault count mismatch: expected ${func.faultRefs.length}, found ${faults.length}`);
    }

    return faults;
  }

  public getCauses(doc:FMEADto2, fault:FMFaultDto2):FMFaultDto2[] {
    if (!doc || !fault) {
      return [];
    }
    var causes = doc.fmFaults.filter(f => fault.causes.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (causes.length != fault.causes.length) {
      throw new Error(`Fault count mismatch: expected ${fault.causes.length}, found ${causes.length}`);
    }

    return causes;
  }

  public createChildStructure(doc:FMEADto2, parent:FMStructureDto2, child: FMStructureDto2) {
    if (!doc || !parent) {
      throw new Error('Invalid document or parent structure');
    }

    var children = this.getDecomposition(doc, parent);
    const maxSeq = children.length > 0 ? Math.max(...children.map(c => c.seq)) : 0;
    child.seq = maxSeq + 1;
    child.level = parent.level + 1;

    parent.decomposition.push(child.code);
    doc.fmStructures.push(child);
  }

  public createChildFunction(doc: FMEADto2, parent: FMStructureDto2, parentFunc: FMFunctionDto2|null, child: FMFunctionDto2) {
    if (!doc || !parent) {
      throw new Error('Invalid document or parent structure');
    }

    var children = this.getFunctions(doc, parent);
    const maxSeq = children.length > 0 ? Math.max(...children.map(c => c.seq)) : 0;
    child.seq = maxSeq + 1;
    child.level = parent.level;

    parent.decomposition.push(child.code);
    if (parentFunc) {
      if (child.level!=1){
        throw new Error('Child function missing parent function');
      }
      parentFunc.prerequisites.push(child.code);
    }

    doc.fmFunctions.push(child);
  }

  public deleteStructure(doc:FMEADto2, structure:FMStructureDto2) {
    if (!doc || !structure) {
      throw new Error('Invalid document or structure');
    }

    if (doc.rootStructureCode == structure.code){
      throw new Error('Cannot delete root structure');
    }

    if (structure.decomposition.length > 0) {
      throw new Error('Cannot delete structure with children');
    } 

    if (structure.functions.length > 0) {
      throw new Error('Cannot delete structure with functions');
    }

    // Remove from document
    doc.fmStructures = doc.fmStructures.filter(s => s.code !== structure.code);

    // Remove from parent's decomposition
    var parent = this.getParentStructure(doc, structure);
    if (!parent) {
      throw new Error('Parent structure not found');
    }
    parent.decomposition = parent.decomposition.filter(code => code !== structure.code);

    var siblings = this.getDecomposition(doc, parent);
    siblings.forEach(s => s.seq = siblings.indexOf(s) + 1);
  }

  public getParentStructure(doc:FMEADto2, structure:FMStructureDto2): FMStructureDto2 | null {
    if (!doc || !structure) {
      return null;
    }
    return doc.fmStructures.find(s => s.decomposition.includes(structure.code)) || null;
  }

  public moveStructure(doc:FMEADto2, structure:FMStructureDto2, isUp:boolean) {
    if (!doc || !structure) {
      throw new Error('Invalid document or structure');
    }

    var parent= this.getParentStructure(doc, structure);
    if (!parent) {
      throw new Error('Parent structure not found');
    }
    var siblings = this.getDecomposition(doc, parent);
    const currentIndex = siblings.findIndex(s => s.code === structure.code);
    if (currentIndex === -1) {
      throw new Error('Structure not found among siblings');
    }

    var newIndex = isUp ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0) {
      newIndex = 0;
    }
    if (newIndex >= siblings.length) {
      newIndex = siblings.length - 1;
    }
    // Swap the structures
    [siblings[currentIndex], siblings[newIndex]] = [siblings[newIndex], siblings[currentIndex]];

    siblings.forEach(s => s.seq = siblings.indexOf(s) + 1);
    parent.decomposition = siblings.map(s => s.code);
  }

  public flattenStructures(doc: FMEADto2): FMStructureDto2[] {
    var levelStructures = doc.fmStructures.filter(s => s.level === 1);
    return this.flattenStructuresImpl(doc, levelStructures);
  }

  private flattenStructuresImpl(doc: FMEADto2, fmStructures: FMStructureDto2[]): FMStructureDto2[] {
    let flatList: FMStructureDto2[] = [];

    if (fmStructures == null) {
      return flatList;
    }

    for (let i = 0; i < fmStructures.length; i++) {
      flatList.push(fmStructures[i]);
      var children = this.getDecomposition(doc, fmStructures[i]);
      flatList.push(...this.flattenStructuresImpl(doc,children));
    }

    return flatList;
  }

  public flattenFunctions(doc: FMEADto2, fmFunctions: FMFunctionDto2[]): FMFunctionDto2[] {
    let flatList: FMFunctionDto2[] = [];

    if (fmFunctions == null) {
      return flatList;
    }

    for (let i = 0; i < fmFunctions.length; i++) {
      flatList.push(fmFunctions[i]);
      var children = this.getPrerequisites(doc, fmFunctions[i]);
      flatList.push(...this.flattenFunctions(doc, children));
    }

    return flatList;
  }

  public generateTreeNodes(doc: FMEADto2, data: FMStructureDto2, includesFunc: boolean, includesFault: boolean): NzTreeNodeOptions {
    if (!data) {
      return {
        title: '',
        key: '',
      } as NzTreeNodeOptions;
    }

    var hasChildrenStructures = data.decomposition.length > 0;
    var hasChildrenFunctions = data.functions.length > 0;

    var node: NzTreeNodeOptions = {
      icon: 'setting',
      title: `${data.code}/${data.longName}`,
      key: String(data.code),
      expanded: true,
      child: null,
      isLeaf: !(hasChildrenStructures || (includesFunc && hasChildrenFunctions)),
      children: [],
    };

    if (includesFunc) {
      // add function nodes under each structure
      var funcs = this.getFunctions(doc, data)
      for (let i = 0; i < funcs.length; i++) {
        var func = funcs[i];
        const functionNode = {
          icon: 'aim',
          title: `${func.code}/${func.longName}`,
          key: String(func.code),
          expanded: true,
          isLeaf: !func.faultRefs || func.faultRefs.length === 0,
          children: [] as any[]
        };
        node.children!.push(functionNode);

        if (includesFault) {
          // Add fault nodes under each function
          var faults = this.getFaults(doc, func);
          for (let j = 0; j < faults.length; j++) {
            var fault = faults[j];
            functionNode.children.push({
              icon: 'warning',
              title: `${fault.code}/${fault.longName}`,
              key: String(fault.code),
              expanded: true,
              isLeaf: true,
            });
          }
        }
      }
    }

    var decomposition = this.getDecomposition(doc, data);
    for (let i = 0; i < decomposition.length; i++) {
      var childNode = this.generateTreeNodes(doc, decomposition[i], includesFunc, includesFault);
      node.children!.push(childNode);
    }

    return node
  }

  public generateNextStructureCode(doc: FMEADto2): string {
    if (!doc || !doc.fmStructures || doc.fmStructures.length === 0) {
      return 'S001-001';
    }

    let maxCode = '';
    let maxNumber = 0;

    // Find the biggest structure code
    for (const structure of doc.fmStructures) {
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

  public generateNextFunctionCode(doc: FMEADto2): string {
    if (!doc || !doc.fmFunctions || doc.fmFunctions.length === 0) {
      return 'F001-001';
    }

    let maxCode = '';
    let maxNumber = 0;

    // Find the biggest function code
    for (const func of doc.fmFunctions) {
      if (func.code) {
        const code = func.code;

        // Extract the numeric part from codes like "F001-003"
        const match = code.match(/^(F\d{3}-?)(\d{3})$/);
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
      const match = maxCode.match(/^(F\d{3}-?)(\d{3})$/);
      if (match) {
        const prefix = match[1];
        const nextNumber = maxNumber + 1;
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      }
    }

    // Fallback if no valid codes found
    return 'F001-001';
  }
}
