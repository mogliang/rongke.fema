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
import { FMStructuresService } from '../../../libs/api-client';
import { CommonModule } from '@angular/common';

import { FmeaStep1Component } from '../../fmea-step1/fmea-step1.component';
import { FmeaStep2Component } from '../../fmea-step2/fmea-step2.component';
import { FmeaStep3Component } from '../../fmea-step3/fmea-step3.component';

@Component({
  selector: 'app-fema',
  imports: [CommonModule, NzLayoutModule, NzGridModule, NzStepsModule, NzCardModule, NzFlexModule, NzButtonModule, NzTabsModule, NzRadioModule, NzTreeModule, NzTableModule, NzDividerModule, FmeaStep1Component, FmeaStep2Component, FmeaStep3Component],
  providers: [FMStructuresService],
  templateUrl: './fmea.component.html',
  styleUrl: './fmea.component.css'
})
export class FmeaComponent {
  constructor() { }

  ngOnInit() {
  }

  onIndexChange(index: number): void {
    this.step = index;
  }
  public step = 0
}