import { Component, OnInit, ElementRef, ViewChild, Injector, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { AngularPlugin, Presets, AngularArea2D } from 'rete-angular-plugin/19';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';

// Define the schemes for our editor
type Schemes = GetSchemes<
  ClassicPreset.Node & { render?: 'classic' },
  ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;

type AreaExtra = AngularArea2D<Schemes>;

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzCardModule],
  template: `
    <div class="demo-container">
      <h1>Rete.js 演示中心</h1>
      
      <div class="demo-cards">
        <nz-card nzTitle="基础节点编辑器" style="width: 300px">
          <p>演示基本的节点编辑器功能，包含2个节点和1个连接。</p>
          <div class="card-actions">
            <button nz-button nzType="primary" (click)="showBasicDemo = !showBasicDemo">
              {{ showBasicDemo ? '隐藏演示' : '显示演示' }}
            </button>
          </div>
        </nz-card>

        <nz-card nzTitle="功能关系图" style="width: 300px">
          <p>根据FMEA文档和结构数据，显示功能之间的关系图。</p>
          <div class="card-actions">
            <a nz-button nzType="primary" routerLink="function-graph">查看演示</a>
          </div>
        </nz-card>
      </div>

      <div class="basic-demo" *ngIf="showBasicDemo">
        <h2>基础节点编辑器演示</h2>
        <p>一个简单的节点编辑器，包含2个节点和1个连接</p>
        <div #rete class="rete-container"></div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      min-height: 100vh;
    }

    h1 {
      margin-bottom: 30px;
      color: #333;
    }

    .demo-cards {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .card-actions {
      margin-top: 16px;
    }

    .basic-demo {
      border-top: 1px solid #f0f0f0;
      padding-top: 30px;
    }

    .basic-demo h2 {
      margin-bottom: 10px;
      color: #333;
    }

    .basic-demo p {
      margin-bottom: 20px;
      color: #666;
    }

    .rete-container {
      height: 500px;
      border: 1px solid #ccc;
      border-radius: 4px;
      position: relative;
      background: #f5f5f5;
      overflow: hidden;
    }
  `]
})
export class DemoComponent implements OnInit {
  @ViewChild('rete', { static: false }) container?: ElementRef<HTMLElement>;

  private editor!: NodeEditor<Schemes>;
  private area!: AreaPlugin<Schemes, AreaExtra>;
  private connection!: ConnectionPlugin<Schemes, AreaExtra>;
  private render!: AngularPlugin<Schemes, AreaExtra>;

  showBasicDemo = false;
  private demoInitialized = false;

  constructor(private injector: Injector, private ngZone: NgZone) {}

  async ngOnInit() {
    // Demo is loaded on demand when showBasicDemo becomes true
  }

  async ngAfterViewChecked() {
    if (this.showBasicDemo && !this.demoInitialized && this.container) {
      await this.createEditor();
      this.demoInitialized = true;
    }
  }

  private async createEditor() {
    if (!this.container) return;

    // Run outside Angular zone for better performance
    this.ngZone.runOutsideAngular(async () => {
      try {
        const socket = new ClassicPreset.Socket('socket');

        this.editor = new NodeEditor<Schemes>();
        this.area = new AreaPlugin<Schemes, AreaExtra>(this.container!.nativeElement);
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

        console.log('Rete.js basic demo initialized successfully!');
      } catch (error) {
        console.error('Error initializing Rete.js basic demo:', error);
      }
    });
  }
}
