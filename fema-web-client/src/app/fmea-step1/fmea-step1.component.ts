import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { FMEADto2, FMEAService, TeamMemberDto, FMEAType } from '../../libs/api-client';

@Component({
  selector: 'app-fmea-step1',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzTabsModule,
    NzCardModule,
    NzSelectModule,
    NzDatePickerModule,
    NzDividerModule,
    NzIconModule,
    NzTableModule,
    NzModalModule
  ],
  templateUrl: './fmea-step1.component.html',
  styleUrls: ['./fmea-step1.component.css']
})
export class FmeaStep1Component implements OnInit {
  fmeaForm!: FormGroup;
  fmeaDoc: FMEADto2 | null = null;
  isLoading = true;
  isEditing = false;
  
  // Member management
  isAddingMember = false;
  isCoreTeamTab = true;
  memberForm!: FormGroup;
  
  fmeaTypes = [
    { label: 'DFMEA', value: FMEAType.Dfmea },
    { label: 'PFMEA', value: FMEAType.Pfmea }
  ];
  
  secretLevels = [
    { label: '绝密', value: '绝密' },
    { label: '机密', value: '机密' },
    { label: '秘密', value: '秘密' },
    { label: '内部', value: '内部' },
    { label: '公开', value: '公开' }
  ];
  
  accessLevels = [
    { label: '管理员', value: '管理员' },
    { label: '编辑者', value: '编辑者' },
    { label: '审阅者', value: '审阅者' },
    { label: '查看者', value: '查看者' }
  ];

  constructor(
    private fb: FormBuilder,
    private fmeaService: FMEAService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.initFmeaForm();
    this.initMemberForm();
    this.loadFmeaData();
  }

  initFmeaForm() {
    this.fmeaForm = this.fb.group({
      // Basic information
      code: ['', Validators.required],
      type: [FMEAType.Dfmea, Validators.required],
      name: ['', Validators.required],
      version: ['', Validators.required],
      fmeaVersion: ['', Validators.required],
      description: [''],
      stage: [''],
      
      // Planning information
      customerName: [''],
      companyName: [''],
      productType: [''],
      material: [''],
      project: [''],
      projectLocation: [''],
      planKickOff: [null],
      planDeadline: [null],
      secretLevel: ['内部'],
      accessLevel: ['编辑者'],
      designDepartment: [''],
      designOwner: ['']
    });
  }

  initMemberForm() {
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      employeeNo: ['', Validators.required],
      role: ['', Validators.required],
      department: [''],
      email: [''],
      phone: [''],
      note: ['']
    });
  }

  loadFmeaData() {
    this.isLoading = true;
    this.fmeaService.apiFMEACodeCodeGet("FMEA-0001").subscribe({
      next: (data) => {
        this.fmeaDoc = data;
        this.populateForm(data);
        this.isLoading = false;
      },
      error: (err) => {
        this.message.error('加载FMEA数据失败');
        this.isLoading = false;
      }
    });
  }

  populateForm(data: FMEADto2) {
    if (!data) return;

    this.fmeaForm.patchValue({
      code: data.code,
      type: data.type,
      name: data.name,
      version: data.version,
      fmeaVersion: data.fmeaVersion,
      description: data.description,
      stage: data.stage,
      customerName: data.customerName,
      companyName: data.companyName,
      productType: data.productType,
      material: data.material,
      project: data.project,
      projectLocation: data.projectLocation,
      planKickOff: data.planKickOff ? new Date(data.planKickOff) : null,
      planDeadline: data.planDeadline ? new Date(data.planDeadline) : null,
      secretLevel: data.secretLevel,
      accessLevel: data.accessLevel,
      designDepartment: data.designDepartment,
      designOwner: data.designOwner
    });
  }

  startEditing() {
    this.isEditing = true;
  }

  cancelEditing() {
    this.isEditing = false;
    this.populateForm(this.fmeaDoc!);
  }

  saveChanges() {
    if (this.fmeaForm.invalid) {
      Object.values(this.fmeaForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const updatedFmea = { ...this.fmeaDoc, ...this.fmeaForm.value };
    
    // Convert dates to ISO strings if they exist
    if (updatedFmea.planKickOff) {
      updatedFmea.planKickOff = new Date(updatedFmea.planKickOff).toISOString();
    }
    if (updatedFmea.planDeadline) {
      updatedFmea.planDeadline = new Date(updatedFmea.planDeadline).toISOString();
    }

    // this.fmeaService.apiFMEADocPut(updatedFmea).subscribe({
    //   next: (response) => {
    //     this.fmeaDoc = response;
    //     this.isEditing = false;
    //     this.message.success('FMEA信息已更新');
    //   },
    //   error: (err) => {
    //     this.message.error('保存FMEA信息失败');
    //   }
    // });
  }

  showAddMemberModal(isCoreTeam: boolean) {
    this.isCoreTeamTab = isCoreTeam;
    this.isAddingMember = true;
    this.memberForm.reset();
  }

  cancelAddMember() {
    this.isAddingMember = false;
  }

  addMember() {
    if (this.memberForm.invalid) {
      Object.values(this.memberForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const newMember: TeamMemberDto = this.memberForm.value;
    
    if (!this.fmeaDoc) return;
    
    if (this.isCoreTeamTab) {
      this.fmeaDoc.coreMembers!.push(newMember);
    } else {
      this.fmeaDoc.extendedMembers!.push(newMember);
    }

    // // Update the FMEA with the new member
    // this.fmeaService.apiFMEADocPut(this.fmeaDoc).subscribe({
    //   next: (response) => {
    //     this.fmeaDoc = response;
    //     this.isAddingMember = false;
    //     this.message.success('成员已添加');
    //   },
    //   error: (err) => {
    //     this.message.error('添加成员失败');
    //   }
    // });
  }

  removeMember(isCoreTeam: boolean, index: number) {
    if (!this.fmeaDoc) return;
    
    if (isCoreTeam) {
      this.fmeaDoc.coreMembers!.splice(index, 1);
    } else {
      this.fmeaDoc.extendedMembers!.splice(index, 1);
    }

    // // Update the FMEA after removing the member
    // this.fmeaService.apiFMEADocPut(this.fmeaDoc).subscribe({
    //   next: (response) => {
    //     this.fmeaDoc = response;
    //     this.message.success('成员已删除');
    //   },
    //   error: (err) => {
    //     this.message.error('删除成员失败');
    //   }
    // });
  }
}
