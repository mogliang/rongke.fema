import { Component, OnInit } from '@angular/core';
import { FormsModule ,FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
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
import { NzListModule } from 'ng-zorro-antd/list';
import { CommonModule } from '@angular/common';
import { FMEADto2, FMEAService, TeamMemberDto, FMEAType } from '../../libs/api-client';
import { HelperService } from '../helper.service';
import { MockService, EmployeeModel } from '../mock.service';

@Component({
  selector: 'app-fmea-step1',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  selectedEmployee2: EmployeeModel | null = null;

  // Member management
  isAddingMember = false;
  isEditingMember = false;
  isCoreTeamTab = true;
  memberForm!: FormGroup;
  editNoteForm!: FormGroup;
  selectedEmployee: EmployeeModel | null = null;
  employees: EmployeeModel[] = [];
  filteredEmployees: EmployeeModel[] = [];
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
    this.filteredEmployees = [...this.employees];
  }

  searchEmployees(value: string): void {
    this.searchValue = value;
    this.filteredEmployees = this.mockService.searchEmployees(value);
  }

  test(){
    console.log('test');
  }

  selectEmployee(employee: EmployeeModel): void {
    this.selectedEmployee = employee;
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
    
    if (this.isCoreTeamTab) {
      if (!this.fmeaDoc.coreMembers) {
        this.fmeaDoc.coreMembers = [];
      }
      this.fmeaDoc.coreMembers.push(newMember);
    } else {
      if (!this.fmeaDoc.extendedMembers) {
        this.fmeaDoc.extendedMembers = [];
      }
      this.fmeaDoc.extendedMembers.push(newMember);
    }

    this.isAddingMember = false;
    this.selectedEmployee = null;
    this.message.success('成员已添加');
    
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
    
    // // Update the FMEA with the updated member
    // this.fmeaService.apiFMEADocPut(this.fmeaDoc).subscribe({
    //   next: (response) => {
    //     this.fmeaDoc = response;
    //     this.isEditingMember = false;
    //     this.message.success('成员备注已更新');
    //   },
    //   error: (err) => {
    //     this.message.error('更新成员备注失败');
    //   }
    // });
  }

  removeMember(isCoreTeam: boolean, index: number) {
    if (!this.fmeaDoc) return;
    
    const membersList = isCoreTeam ? this.fmeaDoc.coreMembers : this.fmeaDoc.extendedMembers;
    if (!membersList || index < 0 || index >= membersList.length) return;
    
    membersList.splice(index, 1);
    this.message.success('成员已删除');

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
