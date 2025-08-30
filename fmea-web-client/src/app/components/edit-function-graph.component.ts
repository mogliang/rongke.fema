import { Component, Input, OnInit, ViewChild, OnChanges, SimpleChanges, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTreeNodeOptions, NzTreeModule, NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { FMEADto2, FMFunctionDto2 } from '../../libs/api-client/model/models';
import { HelperService } from '../helper.service';
import { FunctionGraphComponent } from './function-graph.component';

@Component({
  selector: 'app-edit-function-graph',
  standalone: true,
  imports: [CommonModule, NzTreeModule, NzButtonModule, NzIconModule, NzGridModule, FunctionGraphComponent],
  template: `
    <div class="function-graph-container">
      <div class="graph-header">
        <div class="header-left">
          <h3>功能关系图</h3>
          <div class="structure-info" *ngIf="selectedObject">
            <span class="structure-code">{{ selectedObject.code }}</span>
            <span class="structure-name">{{ selectedObject.longName }}</span>
          </div>
        </div>
        <div class="header-right">
          <button nz-button 
                  nzType="default" 
                  nzSize="small"
                  (click)="toggleStructureVisibility()"
                  [title]="showStructureVisibility ? '隐藏结构节点' : '显示结构节点'">
            <span nz-icon [nzType]="showStructureVisibility ? 'eye-invisible' : 'eye'"></span>
            {{ showStructureVisibility ? '隐藏结构' : '显示结构' }}
          </button>
        </div>
      </div>
      <div nz-row class="graph-main">
        <div nz-col nzSpan="4" class="graph-sidebar">
          <nz-tree 
            [nzData]="parentFunctionTree" 
            nzShowIcon 
            [nzTreeTemplate]="nzTreeNodeTemplate"
            nzMultiple="false" 
            nzCheckable
            (nzCheckboxChange)="onParentTreeCheckChange($event)">
            <ng-template #nzTreeNodeTemplate let-node>
              <div>
                <nz-icon [nzType]="node.icon" nzTheme="outline" class="tree-icon" />
                <span [ngClass]="{
                  'function-node': node.icon === 'aim', 
                  'structure-node': node.icon === 'setting',
                  'fault-node': node.icon === 'warning'
                }">{{ node.title }}</span>
              </div>
            </ng-template>
          </nz-tree>
        </div>
        <div nz-col nzSpan="16" class="graph-center">
          <app-function-graph 
            #functionGraph
            [fmeaDoc]="fmeaDoc"
            [selectedObject]="selectedObject"
            [focus]="true"
            [showHeader]="false"
            [showStructure]="showStructureVisibility">
          </app-function-graph>
        </div>
        <div nz-col nzSpan="4" class="graph-sidebar">
          <nz-tree 
            [nzData]="childrenFunctionTree" 
            nzShowIcon 
            [nzTreeTemplate]="childTreeNodeTemplate"
            nzMultiple="false" 
            nzCheckable
            (nzCheckboxChange)="onChildTreeCheckChange($event)">
            <ng-template #childTreeNodeTemplate let-node>
              <div>
                <nz-icon [nzType]="node.icon" nzTheme="outline" class="tree-icon" />
                <span [ngClass]="{
                  'function-node': node.icon === 'aim', 
                  'structure-node': node.icon === 'setting',
                  'fault-node': node.icon === 'warning'
                }">{{ node.title }}</span>
              </div>
            </ng-template>
          </nz-tree>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .function-graph-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      background: #fff;
    }

    .graph-header {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .graph-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #262626;
    }

    .structure-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .structure-code {
      font-weight: 500;
      color: #1890ff;
    }

    .structure-name {
      color: #595959;
    }

    .graph-main {
      flex: 1;
      height: calc(100% - 60px);
    }

    .graph-sidebar {
      background: #f9f9f9;
      border-right: 1px solid #f0f0f0;
      padding: 12px;
      overflow-y: auto;
      max-height: 100%;
    }

    .graph-center {
      position: relative;
      height: 100%;
    }

    .graph-center app-function-graph {
      display: block;
      height: 100%;
    }
  `]
})
export class EditFunctionGraphComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() fmeaDoc: FMEADto2 | null = null;
  @Input() selectedObject: FMFunctionDto2 | null = null;
  @Output() functionRelationshipChanged =  new EventEmitter<FMEADto2>();
  @ViewChild('functionGraph') functionGraph!: FunctionGraphComponent;

  parentFunctionTree: NzTreeNodeOptions[] = [];
  childrenFunctionTree: NzTreeNodeOptions[] = [];
  showStructureVisibility = true; // Toggle state for structure visibility

  constructor(private helper: HelperService) { }

  async ngOnInit() {
    this.initializeTree();
  }

  async ngAfterViewInit() {
    // Refresh layout after view is fully initialized
    setTimeout(async () => {
      await this.refreshGraphLayout();
    }, 100);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['fmeaDoc'] || changes['selectedObject']) {
      this.initializeTree();
    }
  }

  private initializeTree() {
    if (!this.fmeaDoc || !this.selectedObject) {
      return;
    }

    // Set left parent funcs
    var parentStructure = this.helper.getFunctionParentStructure(this.fmeaDoc, this.selectedObject!);
    if (parentStructure) {
      var parentParentStructure = this.helper.getParentStructure(this.fmeaDoc, parentStructure);
      if (parentParentStructure) {
        var root = this.helper.generateTreeNodes(this.fmeaDoc!, parentParentStructure, true, false, 0);
        var funcParents = this.helper.getFunctionParentFunctions(this.fmeaDoc!, this.selectedObject!).map(f => f.code);
        this.helper.traverseTreeNodes(root, n => {
          n.selectable = false;
          n.disableCheckbox = true;
          var func = this.fmeaDoc?.fmFunctions.find(f => f.code === n.key);
          if (func) {
            n.disableCheckbox = false;
            if (funcParents.includes(func.code)) {
              n.checked = true;
            }
          }
        });
        this.parentFunctionTree = [root];
      }
    }

    // set right tree
    if (parentStructure) {
      var prerequisites = this.selectedObject!.prerequisites;
      var root = this.helper.generateTreeNodes(this.fmeaDoc!, parentStructure, true, false, 1);
      this.helper.traverseTreeNodes(root, n => {
        n.selectable = false;
        n.disableCheckbox = true;
        var func = this.fmeaDoc?.fmFunctions.find(f => f.code === n.key);
        if (func) {
          n.disableCheckbox = false;
          if (prerequisites.includes(func.code)) {
            n.checked = true;
          }
        }
      });
      this.childrenFunctionTree = root.children?.filter(c => c.icon === 'setting') || [];
    }
  }

  toggleStructureVisibility() {
    this.showStructureVisibility = !this.showStructureVisibility;
    // The wrapped component will automatically update through the input binding
  }

  // Public method to refresh layout - delegates to the wrapped component
  async refreshGraphLayout() {
    if (this.functionGraph) {
      await this.functionGraph.refreshLayout();
    }
  }

  // Event handler for parent tree node check/uncheck
  onParentTreeCheckChange(event: any): void {
    const node = event.node!;
    const functionCode = node.key;
    const isChecked = node.isChecked;
    this.updateParentFunctionRelationship(functionCode, isChecked);
  }

  private updateParentFunctionRelationship(functionCode: string, isChecked: boolean): void {
    if (!this.selectedObject) {
      return
    }

    var parentFunc = this.fmeaDoc?.fmFunctions.find(f => f.code == functionCode);
    if (parentFunc) {
      if (isChecked) {
        parentFunc.prerequisites.push(this.selectedObject!.code);
      } else {
        parentFunc.prerequisites = parentFunc.prerequisites.filter(p => p !== this.selectedObject!.code);
      }
    }

    // Emit event for parent component to handle
    if (this.selectedObject && this.fmeaDoc) {
      this.functionRelationshipChanged.emit(this.fmeaDoc);
    }

    this.functionGraph.updateGraph();
  } 

  // Event handler for child tree node check/uncheck
  onChildTreeCheckChange(event: any): void {
    const node = event.node!;
    const functionCode = node.key;
    const isChecked = node.isChecked;
    this.updatePrerequisiteRelationship(functionCode, isChecked);
  }

   private updatePrerequisiteRelationship(functionCode: string, isChecked: boolean): void {
    if (!this.selectedObject) {
      return
    }

    var childFunc = this.fmeaDoc?.fmFunctions.find(f => f.code == functionCode);
    if (childFunc) {
      if (isChecked){
        this.selectedObject.prerequisites.push(functionCode);
      } else {
        this.selectedObject.prerequisites = this.selectedObject!.prerequisites.filter(p => p !== functionCode);
      }
    }

    // Emit event for parent component to handle persistence
    if (this.selectedObject && this.fmeaDoc) {
      this.functionRelationshipChanged.emit(this.fmeaDoc);
    }

    this.functionGraph.updateGraph();
  }
}
