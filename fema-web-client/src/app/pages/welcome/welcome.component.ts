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



@Component({
  selector: 'app-welcome',
  imports: [NzLayoutModule, NzGridModule, NzStepsModule, NzCardModule, NzFlexModule, NzButtonModule,NzTabsModule, NzRadioModule,NzTreeModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  constructor() { }

  readonly nodes = [
    {
      title: 'FMEA编号/物料名',
      key: '00',
      expanded: true,
      children: [
        {
          title: '结构ID/结构名',
          key: '000',
          expanded: true,
          children: [
            { title: '213123/轴', key: '0000', isLeaf: true },
            { title: '213124/轴承', key: '0001', isLeaf: true },
            { title: '213124/轴承', key: '0002', isLeaf: true }
          ]
        },
        {
          title: '结构ID/结构名',
          key: '001',
          children: [
            { title: '213123/活塞筒', key: '0010', isLeaf: true },
            { title: '213123/曲轴箱', key: '0011', isLeaf: true },
          ]
        },
        {
          title: '0-0-2',
          key: '002'
        }
      ]
    },
  ];

}
