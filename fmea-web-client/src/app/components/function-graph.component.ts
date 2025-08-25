import { Component, Input, OnInit, ViewChild, ElementRef, OnChanges, SimpleChanges, Injector, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { AngularPlugin, Presets, AngularArea2D } from 'rete-angular-plugin/19';
import { AutoArrangePlugin, Presets as ArrangePresets } from 'rete-auto-arrange-plugin';
import { ScopesPlugin, Presets as ScopesPresets } from 'rete-scopes-plugin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FMEADto2, FMStructureDto2, FMFunctionDto2 } from '../../libs/api-client/model/models';
import { HelperService } from '../helper.service';

// Custom node class with width and height for auto-arrange
class FunctionNode extends ClassicPreset.Node {
  width = 220;
  height = 140;
  layer = 0;
  parent?: string; // Parent node ID for nested structure
  functionData?: FMFunctionDto2;

  constructor(label: string) {
    super(label);
  }
}

// Custom structure node class for parent nodes
class StructureNode extends ClassicPreset.Node {
  width = 300;
  height = 200;
  structureData?: FMStructureDto2;

  constructor(label: string) {
    super(label);
  }
}

// Custom connection class
class Connection extends ClassicPreset.Connection<FunctionNode | StructureNode, FunctionNode | StructureNode> {}

// Define the schemes for our function graph editor
type Schemes = GetSchemes<FunctionNode | StructureNode, Connection>;

type AreaExtra = any;

@Component({
  selector: 'app-function-graph',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule],
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
                  [title]="showStructure ? '隐藏结构节点' : '显示结构节点'">
            <span nz-icon [nzType]="showStructure ? 'eye-invisible' : 'eye'"></span>
            {{ showStructure ? '隐藏结构' : '显示结构' }}
          </button>
        </div>
      </div>
      <div #reteContainer class="graph-content" [class.loading]="loading">
        <div class="loading-indicator" *ngIf="loading">
          <span>正在生成功能关系图...</span>
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

    .graph-content {
      flex: 1;
      position: relative;
      background: #f5f5f5;
      min-height: 400px;
    }

    .graph-content.loading {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-indicator {
      color: #8c8c8c;
      font-size: 14px;
    }
  `]
})
export class FunctionGraphComponent implements OnInit, OnChanges {
  @Input() fmeaDoc: FMEADto2 | null = null;
  @Input() selectedObject: FMStructureDto2 | FMFunctionDto2 | null = null;
  @ViewChild('reteContainer', { static: true }) container!: ElementRef<HTMLElement>;

  private editor!: NodeEditor<Schemes>;
  private area!: AreaPlugin<Schemes, AreaExtra>;
  private connection!: any;
  private render!: AngularPlugin<Schemes, AreaExtra>;
  private arrange!: AutoArrangePlugin<Schemes>;
  private scopes!: ScopesPlugin<Schemes>;
  
  loading = false;
  showStructure = true; // Toggle state for structure visibility
  private initialized = false;

  constructor(private injector: Injector, private ngZone: NgZone, private helper: HelperService) {}

  async ngOnInit() {
    await this.initializeEditor();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if ((changes['fmeaDoc'] || changes['selectedObject']) && this.initialized) {
      await this.updateGraph();
    }
  }

  private async initializeEditor() {
    this.ngZone.runOutsideAngular(async () => {
      try {
        this.editor = new NodeEditor<Schemes>();
        this.area = new AreaPlugin<Schemes, AreaExtra>(this.container.nativeElement);
        // Removed connection plugin to disable user interaction with connections
        // this.connection = new ConnectionPlugin() as any;
        this.render = new AngularPlugin<Schemes, AreaExtra>({ injector: this.injector });
        this.arrange = new AutoArrangePlugin<Schemes>();
        this.scopes = new ScopesPlugin<Schemes>();

        // Enable node selection and dragging
        AreaExtensions.selectableNodes(this.area, AreaExtensions.selector(), {
          accumulating: AreaExtensions.accumulateOnCtrl()
        });

        // Set up presets with default styling
        this.render.addPreset(Presets.classic.setup() as any);
        
        // Removed connection preset since connection plugin is disabled
        // this.connection.addPreset(ConnectionPresets.classic.setup() as any);

        // Set up auto-arrange plugin
        this.arrange.addPreset(ArrangePresets.classic.setup());
        
        // Set up scopes plugin for nested nodes
        this.scopes.addPreset(ScopesPresets.classic.setup());

        // Set up the plugin chain (without connection plugin)
        this.editor.use(this.area);
        // this.area.use(this.connection); // Commented out to disable connection interactions
        this.area.use(this.render);
        this.area.use(this.arrange);
        this.area.use(this.scopes);

        this.initialized = true;
        await this.updateGraph();
      } catch (error) {
        console.error('Error initializing function graph editor:', error);
      }
    });
  }

  private async updateGraph() {
    if (!this.initialized || !this.fmeaDoc || !this.selectedObject) {
      return;
    }

    this.loading = true;
    
    try {
      // Clear existing nodes and connections
      await this.clearGraph();

      var functions = new Set<FMFunctionDto2>();
      var structureNodes = new Map<string, StructureNode>();
      var funcNodes = new Map<string, FunctionNode>();


      if (this.selectedObject && 'prerequisites' in this.selectedObject) {
        // Selected object is a function
        await this.addFunctionNodesImpl(this.fmeaDoc, this.selectedObject as FMFunctionDto2, this.showStructure, functions, structureNodes, funcNodes);
      } else if (this.selectedObject && 'decomposition' in this.selectedObject) {
        // Selected object is a structure
        await this.addNodesImpl(this.fmeaDoc, this.selectedObject as FMStructureDto2, this.showStructure, functions, structureNodes, funcNodes);
      }

      for (const node of Array.from(structureNodes.values())) {
        await this.editor.addNode(node);
      }

      for (const node of Array.from(funcNodes.values())) {
        await this.editor.addNode(node);
      }

      // Create connections based on prerequisites
      await this.createFunctionConnections(functions, funcNodes);

      // Position nodes in a hierarchical layout
      await this.layoutNodes();

      // Fit view to show all nodes
      AreaExtensions.zoomAt(this.area, this.editor.getNodes());

    } catch (error) {
      console.error('Error updating function graph:', error);
    } finally {
      this.loading = false;
    }
  }

  private async clearGraph() {
    // Remove all connections first
    const connections = this.editor.getConnections();
    for (const connection of connections) {
      await this.editor.removeConnection(connection.id);
    }

    // Remove all nodes
    const nodes = this.editor.getNodes();
    for (const node of nodes) {
      if (node instanceof FunctionNode) {
        await this.editor.removeNode(node.id);
      }
    }
    for (const node of nodes) {
      if (node instanceof StructureNode) {
        await this.editor.removeNode(node.id);
      }
    }
  }

  private async addFunctionNodesImpl(doc: FMEADto2, targetFunc:FMFunctionDto2, showStructure:boolean, functionSet: Set<FMFunctionDto2>, structureNodeMap: Map<string, StructureNode>, funcNodeMap: Map<string, FunctionNode>): Promise<void> {
    const node = await this.createFunctionNode(targetFunc);
    functionSet.add(targetFunc);
    funcNodeMap.set(targetFunc.code, node);

    if (showStructure){
      var structure = this.helper.getFunctionParentStructure(doc, targetFunc)
      if (structure ){
        if (!structureNodeMap.has(structure.code)) {
          var structureNode = await this.createStructureNode(structure);
          structureNodeMap.set(structure.code, structureNode);
          node.parent = structureNode.id;
        } else{
          node.parent = structureNodeMap.get(structure.code)?.id;
        }
      }
    }

    var prerequisites = this.helper.getPrerequisites(doc, targetFunc);
    for (const preFunc of prerequisites) {
      if (!functionSet.has(preFunc)) {
        await this.addFunctionNodesImpl(doc, preFunc, showStructure, functionSet, structureNodeMap, funcNodeMap);
      }
    }
  }


  private async addNodesImpl(doc: FMEADto2, structure: FMStructureDto2, showStructure:boolean, functionSet: Set<FMFunctionDto2>, structureNodeMap: Map<string, StructureNode>, funcNodeMap: Map<string, FunctionNode>): Promise<void> {
    var parentId: string|undefined = undefined;
    if (showStructure) {
      var structureNode = await this.createStructureNode(structure);
      parentId= structureNode.id;
      structureNodeMap.set(structure.code, structureNode);
    }

    var funcs = this.helper.getFunctions(doc, structure);
    for (const func of funcs) {
      functionSet.add(func);
      const node = await this.createFunctionNode(func);
      node.parent = parentId;
      funcNodeMap.set(func.code, node);
    }

    for (const child of this.helper.getDecomposition(doc, structure)) {
      await this.addNodesImpl(doc, child, showStructure, functionSet, structureNodeMap, funcNodeMap);
    }
  }

  private async createFunctionNode(func: FMFunctionDto2): Promise<FunctionNode> {
    const socket = new ClassicPreset.Socket('function');
    
    const node = new FunctionNode(func.code + " " + func.longName);
    node.functionData = func;

    // Calculate node height based on text length
    // Optimized for Chinese characters - approximately 11 characters per line
    const displayText = func.code + " " + (func.longName || '');
    const charsPerLine = 11;
    const baseHeight = 80; // Base height for node structure (header, inputs, outputs, padding)
    const lineHeight = 24; // Height per text line
    const minLines = 1;
    
    // Count characters more accurately for mixed Chinese/English text
    const textLength = displayText.length;
    const textLines = Math.max(minLines, Math.ceil(textLength / charsPerLine));
    const calculatedHeight = baseHeight + (textLines * lineHeight);
    
    // Set reasonable bounds for node height
    const minHeight = 120; // Minimum height to accommodate basic node structure
    const maxHeight = 280; // Maximum height to prevent overly tall nodes
    node.height = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
    node.layer = func.level || 0;
    node.addInput('target', new ClassicPreset.Input(socket, ''));
    node.addOutput('prerequisites', new ClassicPreset.Output(socket, '前置条件'));

    return node;
  }

  private async createStructureNode(structure: FMStructureDto2): Promise<StructureNode> {
    const node = new StructureNode(`${structure.code} ${structure.longName || ''}`);
    node.structureData = structure;
    
    // Structure nodes are larger to accommodate their child function nodes
    node.width = 400;
    node.height = 300;
    
    return node;
  }

  private async createFunctionConnections(
    functions: Set<FMFunctionDto2>, 
    nodeMap: Map<string, FunctionNode>
  ) {
    for (const func of Array.from(functions)) {
      if (func.prerequisites && func.prerequisites.length > 0) {
        const leftNode = nodeMap.get(func.code);
        if (!leftNode) continue;

        for (const prerequisiteCode of func.prerequisites) {
          const rightNode = nodeMap.get(prerequisiteCode);
          if (rightNode) {
            const connectionObj = new Connection(leftNode, 'prerequisites', rightNode, 'target');
            await this.editor.addConnection(connectionObj);
          }
        }
      }
    }
  }

  private async layoutNodes() {
    // Use auto-arrange plugin instead of manual layout
    await this.arrange.layout({
      options: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '80',
        'elk.layered.spacing.nodeNodeBetweenLayers': '200'
      }
    });
  }

  toggleStructureVisibility() {
    this.showStructure = !this.showStructure;
    // Regenerate the entire graph with the new structure visibility setting
    this.updateGraph();
  }
}
