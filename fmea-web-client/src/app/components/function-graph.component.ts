import { Component, Input, OnInit, ViewChild, ElementRef, OnChanges, SimpleChanges, Injector, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { AngularPlugin, Presets, AngularArea2D } from 'rete-angular-plugin/19';
import { FMEADto2, FMStructureDto2, FMFunctionDto2 } from '../../libs/api-client/model/models';
import { HelperService } from '../helper.service';

// Define the schemes for our function graph editor
type FunctionNode = ClassicPreset.Node & { functionData?: FMFunctionDto2 };
type Schemes = GetSchemes<
  FunctionNode,
  ClassicPreset.Connection<FunctionNode, FunctionNode>
>;

type AreaExtra = AngularArea2D<Schemes>;

@Component({
  selector: 'app-function-graph',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="function-graph-container">
      <div class="graph-header">
        <h3>功能关系图</h3>
        <div class="structure-info" *ngIf="structure">
          <span class="structure-code">{{ structure.code }}</span>
          <span class="structure-name">{{ structure.longName }}</span>
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
  @Input() structure: FMStructureDto2 | null = null;
  @ViewChild('reteContainer', { static: true }) container!: ElementRef<HTMLElement>;

  private editor!: NodeEditor<Schemes>;
  private area!: AreaPlugin<Schemes, AreaExtra>;
  private connection!: ConnectionPlugin<Schemes, AreaExtra>;
  private render!: AngularPlugin<Schemes, AreaExtra>;
  
  loading = false;
  private initialized = false;

  constructor(private injector: Injector, private ngZone: NgZone, private helper: HelperService) {}

  async ngOnInit() {
    await this.initializeEditor();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if ((changes['fmeaDoc'] || changes['structure']) && this.initialized) {
      await this.updateGraph();
    }
  }

  private async initializeEditor() {
    this.ngZone.runOutsideAngular(async () => {
      try {
        this.editor = new NodeEditor<Schemes>();
        this.area = new AreaPlugin<Schemes, AreaExtra>(this.container.nativeElement);
        this.connection = new ConnectionPlugin<Schemes, AreaExtra>();
        this.render = new AngularPlugin<Schemes, AreaExtra>({ injector: this.injector });

        // Enable node selection and dragging
        AreaExtensions.selectableNodes(this.area, AreaExtensions.selector(), {
          accumulating: AreaExtensions.accumulateOnCtrl()
        });

        // Set up presets
        // Set up presets with default styling
        this.render.addPreset(Presets.classic.setup());
        
        this.connection.addPreset(ConnectionPresets.classic.setup());

        // Set up the plugin chain
        this.editor.use(this.area);
        this.area.use(this.connection);
        this.area.use(this.render);

        this.initialized = true;
        await this.updateGraph();
      } catch (error) {
        console.error('Error initializing function graph editor:', error);
      }
    });
  }

  private async updateGraph() {
    if (!this.initialized || !this.fmeaDoc || !this.structure) {
      return;
    }

    this.loading = true;
    
    try {
      // Clear existing nodes and connections
      await this.clearGraph();

      // Get all functions for this structure
      const functions = this.getFunctionsForStructure();
      
      if (functions.length === 0) {
        this.loading = false;
        return;
      }

      // Create nodes for each function
      const nodeMap = new Map<string, FunctionNode>();
      
      for (const func of functions) {
        const node = await this.createFunctionNode(func);
        nodeMap.set(func.code, node);
        await this.editor.addNode(node);
      }

      // Create connections based on prerequisites
      await this.createFunctionConnections(functions, nodeMap);

      // Position nodes in a hierarchical layout
      await this.layoutNodes(functions, nodeMap);

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
      await this.editor.removeNode(node.id);
    }
  }

  private getFunctionsForStructure(): FMFunctionDto2[] {
    if (!this.fmeaDoc || !this.structure) {
      return [];
    }

    try {
      // Get functions directly from this structure using helper service
      const directFunctions = this.helper.getFunctions(this.fmeaDoc, this.structure);
      
      // Also get functions from child structures recursively
      const allFunctions = new Set<FMFunctionDto2>(directFunctions);
      
      // Get child structures and their functions
      if (this.structure.decomposition && this.structure.decomposition.length > 0) {
        const childStructures = this.helper.getDecomposition(this.fmeaDoc, this.structure);
        
        for (const childStructure of childStructures) {
          try {
            const childFunctions = this.helper.getFunctions(this.fmeaDoc, childStructure);
            childFunctions.forEach(func => allFunctions.add(func));
            
            // Recursively get functions from deeper levels
            this.addFunctionsRecursively(childStructure, allFunctions);
          } catch (error) {
            console.warn(`Failed to get functions for child structure ${childStructure.code}:`, error);
          }
        }
      }
      
      return Array.from(allFunctions);
    } catch (error) {
      console.warn(`Failed to get functions for structure ${this.structure.code}, falling back to direct filtering:`, error);
      
      // Fallback to the original implementation if helper service fails
      const structureCodes = [this.structure.code, ...this.structure.decomposition];
      return (this.fmeaDoc.fmFunctions || []).filter((func: FMFunctionDto2) => 
        func.fmStructureCode && structureCodes.includes(func.fmStructureCode)
      );
    }
  }

  private addFunctionsRecursively(structure: FMStructureDto2, functionSet: Set<FMFunctionDto2>): void {
    if (!this.fmeaDoc || !structure.decomposition || structure.decomposition.length === 0) {
      return;
    }

    try {
      const childStructures = this.helper.getDecomposition(this.fmeaDoc, structure);
      
      for (const childStructure of childStructures) {
        try {
          const childFunctions = this.helper.getFunctions(this.fmeaDoc, childStructure);
          childFunctions.forEach(func => functionSet.add(func));
          
          // Recursively get functions from even deeper levels
          this.addFunctionsRecursively(childStructure, functionSet);
        } catch (error) {
          console.warn(`Failed to get functions for nested child structure ${childStructure.code}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Failed to get decomposition for structure ${structure.code}:`, error);
    }
  }

  private async createFunctionNode(func: FMFunctionDto2): Promise<FunctionNode> {
    const socket = new ClassicPreset.Socket('function');
    
    const node = new ClassicPreset.Node(func.code + " " + func.longName) as FunctionNode;
    node.functionData = func;

    node.addInput('target', new ClassicPreset.Input(socket, ''));
    node.addOutput('prerequisites', new ClassicPreset.Output(socket, '前置条件'));

    // Add function name if different from title
    // if (func.longName && func.longName !== (func.shortName || func.code)) {
    //   node.addControl('longName', new ClassicPreset.InputControl('text', {
    //     initial: `名称: ${func.longName}`,
    //     readonly: true
    //   }));
    // }

    return node;
  }

  private async createFunctionConnections(
    functions: FMFunctionDto2[], 
    nodeMap: Map<string, FunctionNode>
  ) {
    for (const func of functions) {
      if (func.prerequisites && func.prerequisites.length > 0) {
        const leftNode = nodeMap.get(func.code);
        if (!leftNode) continue;

        for (const prerequisiteCode of func.prerequisites) {
          const rightNode = nodeMap.get(prerequisiteCode);
          if (rightNode) {
            const connectionObj = new ClassicPreset.Connection(leftNode, 'prerequisites', rightNode, 'target');
            await this.editor.addConnection(connectionObj);
          }
        }
      }
    }
  }

  private async layoutNodes(
    functions: FMFunctionDto2[], 
    nodeMap: Map<string, FunctionNode>
  ) {
    // Group functions by level
    const functionsByLevel = new Map<number, FMFunctionDto2[]>();
    
    for (const func of functions) {
      if (!functionsByLevel.has(func.level)) {
        functionsByLevel.set(func.level, []);
      }
      functionsByLevel.get(func.level)!.push(func);
    }

    // Layout configuration
    const columnSpacing = 600; // Horizontal spacing between levels/columns
    const rowSpacing = 200;    // Vertical spacing between nodes in same level
    
    // Sort levels to ensure proper order (low to high, left to right)
    const sortedLevels = Array.from(functionsByLevel.keys()).sort((a, b) => a - b);

    for (let i = 0; i < sortedLevels.length; i++) {
      const level = sortedLevels[i];
      const levelFunctions = functionsByLevel.get(level)!;
      
      // Calculate column position (X coordinate)
      // Lower levels are on the left, higher levels on the right
      const columnX = i * columnSpacing;
      
      // Calculate vertical positions for functions in this level
      const totalHeight = (levelFunctions.length - 1) * rowSpacing;
      let startY = -totalHeight / 2; // Center the column vertically
      
      for (let j = 0; j < levelFunctions.length; j++) {
        const func = levelFunctions[j];
        const node = nodeMap.get(func.code);
        if (node) {
          const nodeY = startY + (j * rowSpacing);
          await this.area.translate(node.id, { x: columnX, y: nodeY });
        }
      }
    }
  }
}
