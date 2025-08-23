import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FunctionGraphComponent } from '../../components/function-graph.component';
import { FMEADto2, FMStructureDto2, FMFunctionDto2 } from '../../../libs/api-client/model/models';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-function-graph-demo',
  standalone: true,
  imports: [CommonModule, FunctionGraphComponent, NzButtonModule, NzSelectModule, FormsModule],
  template: `
    <div class="demo-container">
      <div class="demo-header">
        <h1>功能关系图演示</h1>
        <div class="controls">
          <label>选择结构:</label>
          <nz-select [(ngModel)]="selectedStructureCode" (ngModelChange)="onStructureChange()" style="width: 200px;">
            <nz-option *ngFor="let structure of mockFmea.fmStructures" 
                       [nzValue]="structure.code" 
                       [nzLabel]="structure.code + ' - ' + structure.shortName">
            </nz-option>
          </nz-select>
          <button nz-button nzType="primary" (click)="generateMockData()">生成测试数据</button>
        </div>
      </div>
      
      <div class="demo-content">
        <app-function-graph 
          [fmeaDoc]="mockFmea" 
          [structure]="selectedStructure">
        </app-function-graph>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      height: 100vh;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }

    .demo-header {
      margin-bottom: 20px;
    }

    .demo-header h1 {
      margin: 0 0 16px 0;
      color: #262626;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .controls label {
      font-weight: 500;
    }

    .demo-content {
      flex: 1;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
    }
  `]
})
export class FunctionGraphDemoComponent implements OnInit {
  mockFmea: FMEADto2 = {
    code: 'DEMO-001',
    name: '功能关系图演示',
    fmStructures: [],
    fmFunctions: [],
    fmFaults: [],
    rootStructureCode: 'S1'
  };

  selectedStructureCode = 'S1';
  selectedStructure: FMStructureDto2 | null = null;

  ngOnInit() {
    this.generateMockData();
  }

  generateMockData() {
    // Create mock structures
    this.mockFmea.fmStructures = [
      {
        code: 'S1',
        longName: '主系统',
        shortName: '主系统',
        category: 'System',
        seq: 1,
        level: 0,
        decomposition: ['S1.1', 'S1.2'],
        functions: ['F1', 'F2']
      },
      {
        code: 'S1.1',
        longName: '子系统A',
        shortName: '子系统A',
        category: 'Subsystem',
        seq: 2,
        level: 1,
        decomposition: ['S1.1.1'],
        functions: ['F1.1', 'F1.2']
      },
      {
        code: 'S1.2',
        longName: '子系统B',
        shortName: '子系统B',
        category: 'Subsystem',
        seq: 3,
        level: 1,
        decomposition: [],
        functions: ['F2.1', 'F2.2']
      },
      {
        code: 'S1.1.1',
        longName: '组件A1',
        shortName: '组件A1',
        category: 'Component',
        seq: 4,
        level: 2,
        decomposition: [],
        functions: ['F1.1.1']
      }
    ];

    // Create mock functions with prerequisites showing relationships
    this.mockFmea.fmFunctions = [
      {
        code: 'F1',
        longName: '提供系统初始化',
        shortName: '系统初始化',
        seq: 1,
        level: 1,
        fmStructureCode: 'S1',
        prerequisites: [],
        faultRefs: []
      },
      {
        code: 'F2',
        longName: '提供系统监控',
        shortName: '系统监控',
        seq: 2,
        level: 1,
        fmStructureCode: 'S1',
        prerequisites: ['F1'], // 依赖于系统初始化
        faultRefs: []
      },
      {
        code: 'F1.1',
        longName: '初始化子系统A',
        shortName: '初始化A',
        seq: 3,
        level: 2,
        fmStructureCode: 'S1.1',
        prerequisites: ['F1'],
        faultRefs: []
      },
      {
        code: 'F1.2',
        longName: '监控子系统A状态',
        shortName: '监控A',
        seq: 4,
        level: 2,
        fmStructureCode: 'S1.1',
        prerequisites: ['F1.1'], // 依赖于初始化
        faultRefs: []
      },
      {
        code: 'F2.1',
        longName: '初始化子系统B',
        shortName: '初始化B',
        seq: 5,
        level: 2,
        fmStructureCode: 'S1.2',
        prerequisites: ['F1'],
        faultRefs: []
      },
      {
        code: 'F2.2',
        longName: '监控子系统B状态',
        shortName: '监控B',
        seq: 6,
        level: 2,
        fmStructureCode: 'S1.2',
        prerequisites: ['F2.1'],
        faultRefs: []
      },
      {
        code: 'F1.1.1',
        longName: '组件A1自检',
        shortName: '自检A1',
        seq: 7,
        level: 3,
        fmStructureCode: 'S1.1.1',
        prerequisites: ['F1.1'],
        faultRefs: []
      }
    ];

    this.onStructureChange();
  }

  onStructureChange() {
    this.selectedStructure = this.mockFmea.fmStructures.find((s: FMStructureDto2) => s.code === this.selectedStructureCode) || null;
  }
}
