import { Component } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-welcome',
  imports: [NzLayoutModule, NzGridModule, NzStepsModule, NzCardModule, NzFlexModule, NzButtonModule, NzTabsModule, NzRadioModule, NzTreeModule, NzTableModule, NzDividerModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  constructor() { }

  readonly nodes = [
    {
      icon: 'setting',
      title: 'S0001/仓储',
      key: '00',
      expanded: true,
      children: [
        {
          icon: 'setting',
          title: 'S0002/入库',
          key: '000',
          expanded: true,
          children: [
            { icon: 'setting', title: 'S0003/仓储员', key: '0000', isLeaf: true },
            { icon: 'setting', title: 'S0003/物料管控系统', key: '0000', isLeaf: true },
          ]
        },
        {
          icon: 'setting',
          title: 'S0004/存储',
          key: '001',
          children: [
            { icon: 'setting', title: 'S0005/环境', key: '0010', isLeaf: true },
            { icon: 'setting', title: 'S0006/储位', key: '0011', isLeaf: true },
            { icon: 'setting', title: 'S0006/堆叠高度', key: '0011', isLeaf: true },
            { icon: 'setting', title: 'S0006/叉车', key: '0011', isLeaf: true },
            { icon: 'setting', title: 'S0006/保质期', key: '0011', isLeaf: true },
            { icon: 'setting', title: 'S0006/油漆仓温湿度管控', key: '0011', isLeaf: true },
          ]
        },
        {
          icon: 'setting',
          title: '0-0-2',
          key: '002'
        }
      ]
    },
  ];

  listOfData: Person[] = [
    {
      key: '1',
      name: '1',
      age: 32,
      address: '轴'
    },
    {
      key: '2',
      name: '2',
      age: 42,
      address: '轴承'
    },
    {
      key: '3',
      name: '2',
      age: 32,
      address: '结构名'
    }
  ];

}

interface Person {
  key: string;
  name: string;
  age: number;
  address: string;
}