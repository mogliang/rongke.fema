import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FMEADto2, FMEAService, TeamMemberDto, FMEAType } from '../../libs/api-client';
import { HelperService } from '../helper.service';
import { MockService, EmployeeModel } from '../mock.service';

// NG-ZORRO Modules
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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzListModule } from 'ng-zorro-antd/list';

@Component({
  selector: 'app-fmea-step1',
  standalone: true,
  imports: [
    FormsModule,
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
    NzModalModule,
    NzListModule
  ],
  providers: [HelperService, MockService],
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
  isEditingMember = false;
  isCoreTeamTab = true;
  memberForm!: FormGroup;
  editNoteForm!: FormGroup;
  selectedEmployee: EmployeeModel | null = null;
  employees: EmployeeModel[] = [];
  searchValue = '';
  currentEditIndex: number = -1;
  currentMember: TeamMemberDto | null = null;
  
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
    private message: NzMessageService,
    private modal: NzModalService,
    private helperService: HelperService,
    private mockService: MockService
  ) {}

  ngOnInit() {
    this.initFmeaForm();
    this.initMemberForm();
    this.initEditNoteForm();
    this.loadFmeaData();
    this.loadEmployees();
  }

  loadEmployees() {
    this.employees = this.mockService.getEmployees();
  }

  selectEmployee(employee: EmployeeModel): void {
    this.memberForm.patchValue({
      name: employee.name,
      employeeNo: employee.employeeNo,
      role: employee.role,
      department: employee.department,
      email: employee.email,
      phone: employee.phone
    });
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
      name: [{value: '', disabled: true}, Validators.required],
      employeeNo: [{value: '', disabled: true}, Validators.required],
      role: [{value: '', disabled: true}, Validators.required],
      department: [{value: '', disabled: true}],
      email: [{value: '', disabled: true}],
      phone: [{value: '', disabled: true}],
      note: ['']
    });
  }

  initEditNoteForm() {
    this.editNoteForm = this.fb.group({
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
    this.fmeaForm.disable();
  }

  startEditing() {
    this.isEditing = true;
    this.fmeaForm.enable();
  }

  cancelEditing() {
    this.isEditing = false;
    this.fmeaForm.disable();
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
    
    this.isLoading = true;
    this.fmeaService.apiFMEACodeCodePut(updatedFmea.code!, updatedFmea).subscribe({
      next: (data) => {
        this.fmeaDoc = data;
        this.message.success('保存成功');
        this.isEditing = false;
        this.fmeaForm.disable();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to save FMEA', err);
        this.message.error('保存失败: ' + (err.error || err.message || '未知错误'));
        this.isLoading = false;
      }
    });
  }

  showAddMemberModal(isCoreTeam: boolean) {
    this.isCoreTeamTab = isCoreTeam;
    this.isAddingMember = true;
    this.selectedEmployee = null;
    this.memberForm.reset();
    
    // Reset form fields to disabled state (they'll be filled from employee selection)
    Object.keys(this.memberForm.controls).forEach(key => {
      if (key !== 'note') {
        this.memberForm.get(key)?.disable();
      }
    });
  }

  showEditMemberModal(isCoreTeam: boolean, index: number) {
    this.isCoreTeamTab = isCoreTeam;
    this.currentEditIndex = index;
    
    const membersList = isCoreTeam ? this.fmeaDoc?.coreMembers : this.fmeaDoc?.extendedMembers;
    if (!membersList || index < 0 || index >= membersList.length) return;
    
    this.currentMember = membersList[index];
    this.editNoteForm.setValue({
      note: this.currentMember.note || ''
    });
    
    this.isEditingMember = true;
  }

  cancelAddMember() {
    this.isAddingMember = false;
    this.selectedEmployee = null;
  }

  cancelEditMember() {
    this.isEditingMember = false;
    this.currentMember = null;
    this.currentEditIndex = -1;
  }

  refreshMemberList() {
    if (this.fmeaDoc?.coreMembers) {
      this.fmeaDoc.coreMembers = [...this.fmeaDoc.coreMembers];
    }
    if (this.fmeaDoc?.extendedMembers) {
      this.fmeaDoc.extendedMembers = [...this.fmeaDoc.extendedMembers];
    }
  }

  addMember() {
    if (this.memberForm.invalid || !this.selectedEmployee) {
      if (!this.selectedEmployee) {
        this.message.warning('请先选择一名员工');
      } else {
        Object.values(this.memberForm.controls).forEach(control => {
          if (control.invalid) {
            control.markAsDirty();
            control.updateValueAndValidity({ onlySelf: true });
          }
        });
      }
      return;
    }

    const newMember = this.mockService.convertToTeamMember(
      this.selectedEmployee, 
      this.memberForm.value.note || ''
    );
    
    if (!this.fmeaDoc) return;
    if (!this.fmeaDoc.coreMembers) {
      this.fmeaDoc.coreMembers = [];
    }
    if (!this.fmeaDoc.extendedMembers) {
      this.fmeaDoc.extendedMembers = [];
    }

    if (this.fmeaDoc.coreMembers.some(member => member.employeeNo === newMember.employeeNo)) {
      this.message.warning('该成员已存在于核心团队中');
      return;
    }
    if (this.fmeaDoc.extendedMembers.some(member => member.employeeNo === newMember.employeeNo)) {
      this.message.warning('该成员已存在于扩展团队中');
      return;
    }

    if (this.isCoreTeamTab) {
      this.fmeaDoc.coreMembers.push(newMember);
    } else {
      this.fmeaDoc.extendedMembers.push(newMember);
    }

    this.isAddingMember = false;
    this.selectedEmployee = null;
    this.message.success('成员已添加');
    this.refreshMemberList();
  }

  updateMemberNote() {
    if (this.editNoteForm.invalid || this.currentEditIndex < 0 || !this.currentMember) {
      return;
    }

    if (!this.fmeaDoc) return;
    
    const membersList = this.isCoreTeamTab ? this.fmeaDoc.coreMembers : this.fmeaDoc.extendedMembers;
    if (!membersList || this.currentEditIndex >= membersList.length) return;
    
    membersList[this.currentEditIndex].note = this.editNoteForm.value.note || '';
    
    this.isEditingMember = false;
    this.currentMember = null;
    this.currentEditIndex = -1;
    this.message.success('成员备注已更新');
  }

  removeMember(isCoreTeam: boolean, index: number) {
    if (!this.fmeaDoc) return;
    
    const membersList = isCoreTeam ? this.fmeaDoc.coreMembers : this.fmeaDoc.extendedMembers;
    if (!membersList || index < 0 || index >= membersList.length) return;
    
    const member = membersList[index];
    const teamType = isCoreTeam ? '核心团队' : '扩展团队';
    
    this.modal.confirm({
      nzTitle: '确认删除',
      nzContent: `确定要从${teamType}中删除成员 "${member.name}" 吗？`,
      nzOkText: '确定',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: '取消',
      nzOnOk: () => {
        membersList.splice(index, 1);
        this.message.success('成员已删除');
        this.refreshMemberList();
      }
    });
  }
}
