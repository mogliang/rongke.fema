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
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';

import { FMEADto2, FMEAService, FMStructureDto2 } from '../../../libs/api-client';
import { HelperService } from '../../helper.service';
import { FmeaStep1Component } from '../../fmea-step1/fmea-step1.component';
import { FmeaStep2Component } from '../../fmea-step2/fmea-step2.component';
import { FmeaStep3Component } from '../../fmea-step3/fmea-step3.component';

@Component({
  selector: 'app-fmea',
  imports: [CommonModule, NzLayoutModule, NzGridModule, NzStepsModule, NzCardModule, NzFlexModule, NzButtonModule, NzTabsModule, NzRadioModule, NzTreeModule, NzTableModule, NzDividerModule, FmeaStep1Component, FmeaStep2Component, FmeaStep3Component],
  providers: [ HelperService, NzMessageService],
  templateUrl: './fmea.component.html',
  styleUrl: './fmea.component.css'
})
export class FmeaComponent {
  constructor(
    private fmeaService: FMEAService, 
    private helper: HelperService,
    private message: NzMessageService
  ) { }
  
  public fmeaDoc: FMEADto2 | null = null;
  public isLoading = false;
  public step = 0

  ngOnInit() {
    this.isLoading = true;
    this.fmeaService.apiFMEACodeCodeGet("FMEA-0001").subscribe({
      next: (data) => {
        this.fmeaDoc = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.message.error('加载FMEA数据失败');
        this.isLoading = false;
      }
    });
  }

  onIndexChange(index: number): void {
    this.step = index;
  }

  onFmeaDocUpdated($event: FMEADto2): void {
    this.fmeaDoc = $event;
  }

  onSaveFmeaDoc(): void {
    if (!this.fmeaDoc) {
      this.message.error('FMEA数据未加载');
      return;
    }
    this.isLoading = true;
    this.fmeaService.apiFMEACodeCodePut(this.fmeaDoc.code!, this.fmeaDoc).subscribe({
      next: (data) => {
        this.fmeaDoc = data;
        this.isLoading = false;
        this.message.success('FMEA数据已保存');
      },
      error: (err) => {
        this.message.error('保存FMEA数据失败');
        this.isLoading = false;
      }
    });
  }
}