import { Injectable } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { FMEADto2, FMStructureDto2, FMFunctionDto2, FMFaultDto2 } from '../libs/api-client';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  // ========================================
  // STRUCTURE OPERATIONS
  // ========================================

  // Structure - Get operations (public)
  public getDecomposition(doc: FMEADto2, structure: FMStructureDto2): FMStructureDto2[] {
    if (!doc || !structure) {
      return [];
    }
    var decomp = doc.fmStructures.filter(s => structure.decomposition.includes(s.code)).sort((a, b) => a.seq - b.seq);

    if (decomp.length != structure.decomposition.length) {
      throw new Error(`Decomposition count mismatch: expected ${structure.decomposition.length}, found ${decomp.length}`);
    }

    return decomp;
  }

  public getParentStructure(doc: FMEADto2, structure: FMStructureDto2): FMStructureDto2 | null {
    if (!doc || !structure) {
      return null;
    }
    return doc.fmStructures.find(s => s.decomposition.includes(structure.code)) || null;
  }

  public flattenStructures(doc: FMEADto2): FMStructureDto2[] {
    var levelStructures = doc.fmStructures.filter(s => s.level === 1);
    return this.flattenStructuresImpl(doc, levelStructures);
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

  // Structure - Add operations (public)
  public createChildStructure(doc: FMEADto2, parent: FMStructureDto2, child: FMStructureDto2) {
    if (!doc || !parent) {
      throw new Error('Invalid document or parent structure');
    }

    child.level = parent.level + 1;
    parent.decomposition.push(child.code);
    doc.fmStructures.push(child);
    this.resortStructureSequence(doc, parent);
  }

  // Structure - Move operations (public)
  public moveStructure(doc: FMEADto2, structure: FMStructureDto2, isUp: boolean) {
    if (!doc || !structure) {
      throw new Error('Invalid document or structure');
    }

    var parent = this.getParentStructure(doc, structure);
    if (!parent) {
      throw new Error('Parent structure not found');
    }

    const currentIndex = parent.decomposition.indexOf(structure.code);
    var newIndex = isUp ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0) {
      newIndex = 0;
    }
    if (newIndex >= parent.decomposition.length) {
      newIndex = parent.decomposition.length - 1;
    }

    var tmp = parent.decomposition[newIndex]
    parent.decomposition[newIndex] = parent.decomposition[currentIndex];
    parent.decomposition[currentIndex] = tmp;

    this.resortStructureSequence(doc, parent);
  }

  // Structure - Delete operations (public)
  public deleteStructure(doc: FMEADto2, structure: FMStructureDto2, deleteChildren: boolean, deleteFunctions: boolean, deleteFaults: boolean, removeFromGraph: boolean, dryRun: boolean) {
    if (!doc || !structure) {
      throw new Error('Invalid document or structure');
    }

    if (doc.rootStructureCode == structure.code) {
      throw new Error('Cannot delete root structure');
    }

    if (structure.decomposition.length > 0) {
      if (!deleteChildren) {
        throw new Error('Cannot delete structure with children');
      }
    }

    var parent = this.getParentStructure(doc, structure);
    if (!parent) {
      throw new Error('Parent structure not found');
    }

    if (structure.functions.length > 0) {
      if (!deleteFunctions) {
        throw new Error('Cannot delete structure with functions');
      }
    }

    var funcs = this.getFunctions(doc, structure);
    funcs.forEach(func => {
      this.deleteFunction(doc, func, removeFromGraph, deleteFaults, true);
    });

    var children = this.getDecomposition(doc, structure);
    children.forEach(child => {
      this.deleteStructure(doc, child, deleteChildren, deleteFunctions, deleteFaults, removeFromGraph, true);
    });

    if (!dryRun) {
      funcs.forEach(func => {
        this.deleteFunction(doc, func, removeFromGraph, deleteFaults, true);
      });

      children.forEach(child => {
        this.deleteStructure(doc, child, deleteChildren, deleteFunctions, deleteFaults, removeFromGraph, false);
      });

      // Remove from document
      doc.fmStructures = doc.fmStructures.filter(s => s.code !== structure.code);

      // Remove from parent's decomposition
      parent.decomposition = parent.decomposition.filter(code => code !== structure.code);

      this.resortStructureSequence(doc, parent);
    }
  }

  // Structure - Private helper methods
  private flattenStructuresImpl(doc: FMEADto2, fmStructures: FMStructureDto2[]): FMStructureDto2[] {
    let flatList: FMStructureDto2[] = [];

    if (fmStructures == null) {
      return flatList;
    }

    for (let i = 0; i < fmStructures.length; i++) {
      flatList.push(fmStructures[i]);
      var children = this.getDecomposition(doc, fmStructures[i]);
      flatList.push(...this.flattenStructuresImpl(doc, children));
    }

    return flatList;
  }

  private resortStructureSequence(doc: FMEADto2, parentStructure: FMStructureDto2) {
    for (let i = 0; i < parentStructure.decomposition.length; i++) {
      var childCode = parentStructure.decomposition[i];
      var child = doc.fmStructures.find(s => s.code === childCode);
      if (!child) {
        throw new Error(`Child structure not found: ${childCode}`);
      }
      child.seq = i + 1;
    }
  }

  // ========================================
  // FUNCTION OPERATIONS
  // ========================================

  // Function - Get operations (public)
  public getFunctions(doc: FMEADto2, structure: FMStructureDto2): FMFunctionDto2[] {
    if (!doc || !structure) {
      return [];
    }
    var funcs = doc.fmFunctions.filter(f => structure.functions.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (funcs.length != structure.functions.length) {
      throw new Error(`Function count mismatch: expected ${structure.functions.length}, found ${funcs.length}`);
    }

    return funcs;
  }

  public getPrerequisites(doc: FMEADto2, func: FMFunctionDto2): FMFunctionDto2[] {
    if (!doc || !func) {
      return [];
    }
    var funcs = doc.fmFunctions.filter(f => func.prerequisites.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (funcs.length != func.prerequisites.length) {
      throw new Error(`Function count mismatch: expected ${func.prerequisites.length}, found ${funcs.length}`);
    }

    return funcs;
  }

  public getFunctionParentFunctions(doc: FMEADto2, func: FMFunctionDto2): FMFunctionDto2[] {
    if (!doc || !func) {
      return [];
    }
    return doc.fmFunctions.filter(f => f.prerequisites.includes(func.code)).sort((a, b) => a.seq - b.seq);
  }

  public getFunctionParentStructure(doc: FMEADto2, func: FMFunctionDto2) {
    if (!doc || !func) {
      return null;
    }
    return doc.fmStructures.find(s => s.functions.includes(func.code)) || null;
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

  // Function - Add operations (public)
  public createChildFunction(doc: FMEADto2, parent: FMStructureDto2, parentFunc: FMFunctionDto2 | null, child: FMFunctionDto2) {
    if (!doc || !parent) {
      throw new Error('Invalid document or parent structure');
    }

    child.level = parent.level;
    parent.functions.push(child.code);
    doc.fmFunctions.push(child);

    if (parentFunc) {
      parentFunc.prerequisites.push(child.code);
    }

    this.resortFunctionSequence(doc, parent);
  }

  public addFunctionParentFunction(doc: FMEADto2, func: FMFunctionDto2, parentFunc: FMFunctionDto2) {
    if (!doc || !func || !parentFunc) {
      throw new Error('Invalid document, function or parent function');
    }

    var funcParent = this.getFunctionParentStructure(doc, func);
    if (!funcParent) {
      throw new Error('Function parent structure not found');
    }

    var parentFuncParent = this.getFunctionParentStructure(doc, parentFunc);
    if (!parentFuncParent) {
      throw new Error('Parent structure not found');
    }

    if (!parentFuncParent.decomposition.includes(funcParent.code)) {
      throw new Error('Function parent is not a decomposition of parent function');
    }

    parentFunc.prerequisites.push(func.code);
  }

  // Function - Update operations (public)
  public removeFunctionParentFunction(doc: FMEADto2, func: FMFunctionDto2, parentFunc: FMFunctionDto2) {
    if (!doc || !func || !parentFunc) {
      throw new Error('Invalid document, function or parent function');
    }
    
    parentFunc.prerequisites = parentFunc.prerequisites.filter(code => code !== func.code);
  }

  // Function - Move operations (public)
  public moveFunction(doc: FMEADto2, func: FMFunctionDto2, isUp: boolean) {
    if (!doc || !func) {
      throw new Error('Invalid document or function');
    }

    var parent = this.getFunctionParentStructure(doc, func);
    if (!parent) {
      throw new Error('Parent structure not found');
    }

    const currentIndex = parent.functions.indexOf(func.code);
    var newIndex = isUp ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0) {
      newIndex = 0;
    }
    if (newIndex >= parent.functions.length) {
      newIndex = parent.functions.length - 1;
    }

    var tmp = parent.functions[newIndex];
    parent.functions[newIndex] = parent.functions[currentIndex];
    parent.functions[currentIndex] = tmp;

    this.resortFunctionSequence(doc, parent);
  }

  // Function - Delete operations (public)
  public deleteFunction(doc: FMEADto2, func: FMFunctionDto2, removeFromGraph: boolean, removeFaults: boolean, dryRun: boolean) {
    if (!doc || !func) {
      throw new Error('Invalid document or function');
    }

    if (func.faultRefs.length > 0) {
      throw new Error('TODO: Cannot delete function with fault references');
    }

    // Handle function Graph
    var parentFuncs = this.getFunctionParentFunctions(doc, func);
    if (parentFuncs.length > 0 && !removeFromGraph) {
      throw new Error('TODO: Cannot delete function with parent references');
    }

    if (func.prerequisites.length > 0 && !removeFromGraph) {
      throw new Error('TODO: Cannot delete function with child references');
    }

    // Handle faults
    if (func.faultRefs.length > 0) {
      throw new Error('TODO: Cannot delete function with faults');
    }

    var parent = this.getFunctionParentStructure(doc, func);
    if (!parent) {
      throw new Error('Parent structure not found');
    }

    if (!dryRun) {
      for (let i = 0; i < parentFuncs.length; i++) {
        var parentFunc = parentFuncs[i];
        parentFunc.prerequisites = parentFunc.prerequisites.filter(code => code !== func.code);
      }

      func.prerequisites = [];

      // Remove from document
      doc.fmFunctions = doc.fmFunctions.filter(f => f.code !== func.code);

      // Remove from parent's prerequisites
      parent.functions = parent.functions.filter(code => code !== func.code);

      // re-sequence siblings
      this.resortFunctionSequence(doc, parent);
    }
  }

  // Function - Private helper methods
  private resortFunctionSequence(doc: FMEADto2, parentStructure: FMStructureDto2) {
    for (let i = 0; i < parentStructure.functions.length; i++) {
      var childCode = parentStructure.functions[i];
      var child = doc.fmFunctions.find(f => f.code === childCode);
      if (!child) {
        throw new Error(`Child function not found: ${childCode}`);
      }
      child.seq = i + 1;
    }
  }

  // ========================================
  // FAULT OPERATIONS
  // ========================================

  // Fault - Get operations (public)
  public getFaults(doc: FMEADto2, func: FMFunctionDto2): FMFaultDto2[] {
    if (!doc || !func) {
      return [];
    }
    var faults = doc.fmFaults.filter(f => func.faultRefs.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (faults.length != func.faultRefs.length) {
      throw new Error(`Fault count mismatch: expected ${func.faultRefs.length}, found ${faults.length}`);
    }

    return faults;
  }

  public getCauses(doc: FMEADto2, fault: FMFaultDto2): FMFaultDto2[] {
    if (!doc || !fault) {
      return [];
    }
    var causes = doc.fmFaults.filter(f => fault.causes.includes(f.code)).sort((a, b) => a.seq - b.seq);

    if (causes.length != fault.causes.length) {
      throw new Error(`Fault count mismatch: expected ${fault.causes.length}, found ${causes.length}`);
    }

    return causes;
  }

  public getFaultParentFunction(doc: FMEADto2, fault: FMFaultDto2): FMFunctionDto2 | null {
    if (!doc || !fault) {
      return null;
    }
    return doc.fmFunctions.find(f => f.faultRefs.includes(fault.code)) || null;
  }

  public getFaultParentFaults(doc: FMEADto2, fault: FMFaultDto2): FMFaultDto2[] {
    if (!doc || !fault) {
      return [];
    }
    return doc.fmFaults.filter(f => f.causes.includes(fault.code)).sort((a, b) => a.seq - b.seq);
  }

  public generateNextFaultCode(doc: FMEADto2): string {
    if (!doc || !doc.fmFaults || doc.fmFaults.length === 0) {
      return 'T001-001';
    }

    let maxCode = '';
    let maxNumber = 0;

    // Find the biggest fault code
    for (const fault of doc.fmFaults) {
      if (fault.code) {
        const code = fault.code;

        // Extract the numeric part from codes like "T001-003"
        const match = code.match(/^(T\d{3}-?)(\d{3})$/);
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
      const match = maxCode.match(/^(T\d{3}-?)(\d{3})$/);
      if (match) {
        const prefix = match[1];
        const nextNumber = maxNumber + 1;
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      }
    }

    // Fallback if no valid codes found
    return 'T001-001';
  }

  // Fault - Add operations (public)
  public createChildFault(doc: FMEADto2, parentFunc: FMFunctionDto2, child: FMFaultDto2) {
    if (!doc || !parentFunc) {
      throw new Error('Invalid document or parent function');
    }

    // Fault level is determined by function level
    child.level = parentFunc.level;
    
    // Add fault to parent function's fault references
    parentFunc.faultRefs.push(child.code);
    
    // Add fault to document
    doc.fmFaults.push(child);
    
    this.resortFaultSequence(doc, parentFunc);
  }

  public addFaultCause(doc: FMEADto2, fault: FMFaultDto2, causeFault: FMFaultDto2) {
    if (!doc || !fault || !causeFault) {
      throw new Error('Invalid document, fault or cause fault');
    }

    // Validate that cause fault exists in document
    const causeExists = doc.fmFaults.some(f => f.code === causeFault.code);
    if (!causeExists) {
      throw new Error('Cause fault not found in document');
    }

    // Get parent functions for both faults
    const faultParentFunc = this.getFaultParentFunction(doc, fault);
    const causeFaultParentFunc = this.getFaultParentFunction(doc, causeFault);

    if (!faultParentFunc) {
      throw new Error('Parent function not found for fault');
    }

    if (!causeFaultParentFunc) {
      throw new Error('Parent function not found for cause fault');
    }

    // Check if causeFault's parent function is a prerequisite of fault's parent function
    if (!faultParentFunc.prerequisites.includes(causeFaultParentFunc.code)) {
      throw new Error('Cause fault\'s parent function must be a prerequisite of fault\'s parent function');
    }

    // Add cause relationship
    if (!fault.causes.includes(causeFault.code)) {
      fault.causes.push(causeFault.code);
    }
  }

  // Fault - Update operations (public)
  public removeFaultCause(doc: FMEADto2, fault: FMFaultDto2, causeFault: FMFaultDto2) {
    if (!doc || !fault || !causeFault) {
      throw new Error('Invalid document, fault or cause fault');
    }
    
    fault.causes = fault.causes.filter(code => code !== causeFault.code);
  }

  // Fault - Move operations (public)
  public moveFault(doc: FMEADto2, fault: FMFaultDto2, isUp: boolean) {
    if (!doc || !fault) {
      throw new Error('Invalid document or fault');
    }

    var parentFunc = this.getFaultParentFunction(doc, fault);
    if (!parentFunc) {
      throw new Error('Parent function not found');
    }

    const currentIndex = parentFunc.faultRefs.indexOf(fault.code);
    var newIndex = isUp ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0) {
      newIndex = 0;
    }
    if (newIndex >= parentFunc.faultRefs.length) {
      newIndex = parentFunc.faultRefs.length - 1;
    }

    var tmp = parentFunc.faultRefs[newIndex];
    parentFunc.faultRefs[newIndex] = parentFunc.faultRefs[currentIndex];
    parentFunc.faultRefs[currentIndex] = tmp;

    this.resortFaultSequence(doc, parentFunc);
  }

  // Fault - Delete operations (public)
  public deleteFault(doc: FMEADto2, fault: FMFaultDto2, removeCauses: boolean, dryRun: boolean) {
    if (!doc || !fault) {
      throw new Error('Invalid document or fault');
    }

    // Check if fault has dependent faults (faults that have this as a cause)
    var dependentFaults = this.getFaultParentFaults(doc, fault);
    if (dependentFaults.length > 0 && !removeCauses) {
      throw new Error('Cannot delete fault that is referenced as a cause by other faults');
    }

    if (fault.causes.length > 0 && !removeCauses) {
      throw new Error('Cannot delete fault that has causes');
    }

    var parentFunc = this.getFaultParentFunction(doc, fault);
    if (!parentFunc) {
      throw new Error('Parent function not found');
    }

    if (!dryRun) {
      // Remove this fault as a cause from all dependent faults
      for (let i = 0; i < dependentFaults.length; i++) {
        var dependentFault = dependentFaults[i];
        dependentFault.causes = dependentFault.causes.filter(code => code !== fault.code);
      }

      // Clear fault's own causes
      fault.causes = [];

      // Remove from document
      doc.fmFaults = doc.fmFaults.filter(f => f.code !== fault.code);

      // Remove from parent function's fault references
      parentFunc.faultRefs = parentFunc.faultRefs.filter(code => code !== fault.code);

      // Re-sequence siblings
      this.resortFaultSequence(doc, parentFunc);
    }
  }

  // Fault - Private helper methods
  private resortFaultSequence(doc: FMEADto2, parentFunction: FMFunctionDto2) {
    for (let i = 0; i < parentFunction.faultRefs.length; i++) {
      var childCode = parentFunction.faultRefs[i];
      var child = doc.fmFaults.find(f => f.code === childCode);
      if (!child) {
        throw new Error(`Child fault not found: ${childCode}`);
      }
      child.seq = i + 1;
    }
  }

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  public generateCrossSpanTable(left: string[], middle: string, right: string[]): CrossSpanTable {
    var middleSpan = 1;
    if (left.length > middleSpan) {
      middleSpan = left.length;
    }
    if (right.length > middleSpan) {
      middleSpan = right.length;
    }

    var leftSpan = null;
    if (left.length <= 1) {
      leftSpan = middleSpan;
    }

    var line1Left: CrossSpanCell = {
      content: left.length > 0 ? left[0] : "",
      rowSpan: leftSpan
    };

    var line1Middle: CrossSpanCell = {
      content: middle,
      rowSpan: middleSpan
    };

    var line1Right: CrossSpanCell = {
      content: right.length > 0 ? right[0] : "",
    };

    var firstRow: CrossSpanRow = {
      cells: [line1Left, line1Middle, line1Right]
    };

    var table: CrossSpanTable = {
      rows: [firstRow]
    };

    for (var i = 1; i < middleSpan; i++) {
      var cells = []

      if (leftSpan == null) {
        if (i < left.length) {
          cells.push({ content: left[i] });
        } else {
          cells.push({ content: "" });
        }
      }

      if (i<right.length) {
        cells.push({ content: right[i]});
      } else {
        cells.push({ content: ""});
      }
      table.rows.push({ cells });
    }

    return table;
  }

  public traverseTreeNodes(node: NzTreeNodeOptions, callback: (node: NzTreeNodeOptions) => void) {
    callback(node);
    if (node.children) {
      for (const child of node.children) {
        this.traverseTreeNodes(child, callback);
      }
    }
  }

  public generateTreeNodes(doc: FMEADto2, data: FMStructureDto2, includesFunc: boolean, includesFault: boolean, depth: number): NzTreeNodeOptions {
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

    if (depth != 0) {
      var decomposition = this.getDecomposition(doc, data);
      for (let i = 0; i < decomposition.length; i++) {
        var childNode = this.generateTreeNodes(doc, decomposition[i], includesFunc, includesFault, depth - 1);
        node.children!.push(childNode);
      }
    }

    return node
  }
}

export interface CrossSpanCell {
  content: string
  rowSpan?: number|null
}

export interface CrossSpanRow {
  cells: CrossSpanCell[];
}

export interface CrossSpanTable {
  rows: CrossSpanRow[];
}