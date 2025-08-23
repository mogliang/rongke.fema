import { Component, OnInit, ElementRef, ViewChild, Injector, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { AngularPlugin, Presets, AngularArea2D } from 'rete-angular-plugin/19';

// Define the schemes for our editor
type Schemes = GetSchemes<
  ClassicPreset.Node & { render?: 'classic' },
  ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;

type AreaExtra = AngularArea2D<Schemes>;

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-container">
      <h1>Rete.js Demo</h1>
      <p>A simple node editor with 2 nodes and 1 connection</p>
      <div #rete class="rete-container"></div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .rete-container {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      position: relative;
      background: #f5f5f5;
      overflow: hidden;
    }

    h1 {
      margin-bottom: 10px;
      color: #333;
    }

    p {
      margin-bottom: 20px;
      color: #666;
    }
  `]
})
export class DemoComponent implements OnInit {
  @ViewChild('rete', { static: true }) container!: ElementRef<HTMLElement>;

  private editor!: NodeEditor<Schemes>;
  private area!: AreaPlugin<Schemes, AreaExtra>;
  private connection!: ConnectionPlugin<Schemes, AreaExtra>;
  private render!: AngularPlugin<Schemes, AreaExtra>;

  constructor(private injector: Injector, private ngZone: NgZone) {}

  async ngOnInit() {
    // Run outside Angular zone for better performance
    this.ngZone.runOutsideAngular(async () => {
      await this.createEditor();
    });
  }

  private async createEditor() {
    try {
      const socket = new ClassicPreset.Socket('socket');

      this.editor = new NodeEditor<Schemes>();
      this.area = new AreaPlugin<Schemes, AreaExtra>(this.container.nativeElement);
      this.connection = new ConnectionPlugin<Schemes, AreaExtra>();
      this.render = new AngularPlugin<Schemes, AreaExtra>({ injector: this.injector });

      // Enable node selection
      AreaExtensions.selectableNodes(this.area, AreaExtensions.selector(), {
        accumulating: AreaExtensions.accumulateOnCtrl()
      });

      // Set up presets
      this.render.addPreset(Presets.classic.setup());
      this.connection.addPreset(ConnectionPresets.classic.setup());

      // Set up the plugin chain
      this.editor.use(this.area);
      this.area.use(this.connection);
      this.area.use(this.render);

      // Create the first node (Source Node)
      const nodeA = new ClassicPreset.Node('Source Node');
      nodeA.addControl('value', new ClassicPreset.InputControl('number', { initial: 5 }));
      nodeA.addOutput('output', new ClassicPreset.Output(socket, 'Output'));
      await this.editor.addNode(nodeA);

      // Create the second node (Target Node)
      const nodeB = new ClassicPreset.Node('Target Node');
      nodeB.addInput('input', new ClassicPreset.Input(socket, 'Input'));
      nodeB.addControl('result', new ClassicPreset.InputControl('number', { initial: 0, readonly: true }));
      await this.editor.addNode(nodeB);

      // Create a connection between the nodes
      const connectionObj = new ClassicPreset.Connection(nodeA, 'output', nodeB, 'input');
      await this.editor.addConnection(connectionObj);

      // Position the nodes
      await this.area.translate(nodeA.id, { x: 100, y: 150 });
      await this.area.translate(nodeB.id, { x: 400, y: 150 });

      // Fit the view to show all nodes
      AreaExtensions.zoomAt(this.area, this.editor.getNodes());

      console.log('Rete.js demo initialized successfully!');
    } catch (error) {
      console.error('Error initializing Rete.js demo:', error);
    }
  }
}
