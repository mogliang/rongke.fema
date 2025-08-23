import { Component, Input, OnInit, ViewChild, ElementRef, OnChanges, SimpleChanges, Injector, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { AngularPlugin, Presets, AngularArea2D } from 'rete-angular-plugin/19';
import { AutoArrangePlugin, Presets as ArrangePresets } from 'rete-auto-arrange-plugin';
import { FMEADto2, FMStructureDto2, FMFunctionDto2 } from '../../libs/api-client/model/models';
import { HelperService } from '../helper.service';

// Custom node class with width and height for auto-arrange
class FunctionNode extends ClassicPreset.Node {
  width = 220;
  height = 140;
  functionData?: FMFunctionDto2;

  constructor(label: string) {
    super(label);
  }
}

// Custom connection class
class Connection extends ClassicPreset.Connection<FunctionNode, FunctionNode> {}

// Define the schemes for our function graph editor
type Schemes = GetSchemes<FunctionNode, Connection>;

type AreaExtra = any;

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
  private connection!: any;
  private render!: AngularPlugin<Schemes, AreaExtra>;
  private arrange!: AutoArrangePlugin<Schemes>;
  
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
        // Removed connection plugin to disable user interaction with connections
        // this.connection = new ConnectionPlugin() as any;
        this.render = new AngularPlugin<Schemes, AreaExtra>({ injector: this.injector });
        this.arrange = new AutoArrangePlugin<Schemes>();

        // Enable node selection and dragging
        AreaExtensions.selectableNodes(this.area, AreaExtensions.selector(), {
          accumulating: AreaExtensions.accumulateOnCtrl()
        });

        // Set up presets
        // Set up presets with default styling
        this.render.addPreset(Presets.classic.setup() as any);
        
        // Removed connection preset since connection plugin is disabled
        // this.connection.addPreset(ConnectionPresets.classic.setup() as any);

        // Set up auto-arrange plugin
        this.arrange.addPreset(ArrangePresets.classic.setup());

        // Set up the plugin chain (without connection plugin)
        this.editor.use(this.area);
        // this.area.use(this.connection); // Commented out to disable connection interactions
        this.area.use(this.render);
        this.area.use(this.arrange);

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

    node.addInput('target', new ClassicPreset.Input(socket, ''));
    node.addOutput('prerequisites', new ClassicPreset.Output(socket, '前置条件'));

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
            const connectionObj = new Connection(leftNode, 'prerequisites', rightNode, 'target');
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
    // Use auto-arrange plugin instead of manual layout
    await this.arrange.layout({
      options: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '80',
        'elk.layered.spacing.nodeNodeBetweenLayers': '120'
      }
    });
  }
}
