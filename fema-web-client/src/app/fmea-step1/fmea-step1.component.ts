import { Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FMEADto2, FMEAService, TeamMemberDto, FMEAType } from '../../libs/api-client';
import { HelperService } from '../helper.service';
import { MockService } from '../mock.service';
import { Output, EventEmitter } from '@angular/core';
import { AddTeamMemberModalComponent } from '../components/add-team-member-modal.component';

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
    NzListModule,
    AddTeamMemberModalComponent
  ],
  providers: [HelperService, MockService],
  templateUrl: './fmea-step1.component.html',
  styleUrls: ['./fmea-step1.component.css']
})
export class FmeaStep1Component implements OnInit {

  // ========================================
  // INITIALIZATION SECTION
  // ========================================
  
  // Input/Output properties
  fmeaDoc = input.required<FMEADto2 | null>();
  @Output() femaDocUpdated = new EventEmitter<FMEADto2>();

  // Core data properties
  currentFmeaDoc: FMEADto2 | null = null;
  coreTeamMembers: TeamMemberDto[] = [];
  extendedTeamMembers: TeamMemberDto[] = [];

  // UI state properties
  isEditingBasicInfo: boolean = false;
  showEmployeeSearch: string = '';

  // Form builders
  fmeaBasicInfoForm!: FormGroup;
  
  // Static data collections
  fmeaTypeOptions = [
    { label: 'DFMEA', value: FMEAType.Dfmea },
    { label: 'PFMEA', value: FMEAType.Pfmea }
  ];
  
  secretLevelOptions = [
    { label: '绝密', value: '绝密' },
    { label: '机密', value: '机密' },
    { label: '秘密', value: '秘密' },
    { label: '内部', value: '内部' },
    { label: '公开', value: '公开' }
  ];
  
  accessLevelOptions = [
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

  // Lifecycle methods
  ngOnInit() {
  }

  ngOnChanges() {
    this.initializeFmeaBasicInfoForm();
    this.initializeMemberEditForm();
    if (this.fmeaDoc()) {
      this.currentFmeaDoc = this.fmeaDoc();
      this.populateBasicInfoForm();
      this.refreshTeamMemberLists();
    }
  }

  // General utility methods

  initializeFmeaBasicInfoForm() {
    this.fmeaBasicInfoForm = this.fb.group({
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

  initializeMemberEditForm() {
    this.memberEditForm = this.fb.group({
      note: ['']
    });
  }

  populateBasicInfoForm() {
    console.log('Populating form with FMEA data');
    var data = this.currentFmeaDoc
    if (!data) return;

    this.fmeaBasicInfoForm.patchValue({
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
    this.fmeaBasicInfoForm.disable();
  }

  // ========================================
  // BASIC INFO EDIT SECTION
  // ========================================
  
  startEditingBasicInfo() {
    this.isEditingBasicInfo = true;
    this.fmeaBasicInfoForm.enable();
  }

  cancelEditingBasicInfo() {
    this.isEditingBasicInfo = false;
    this.fmeaBasicInfoForm.disable();
    this.populateBasicInfoForm();
  }

  confirmBasicInfoChanges() {
    if (this.fmeaBasicInfoForm.invalid) {
      Object.values(this.fmeaBasicInfoForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    // Update currentFmeaDoc with form values
    if (this.currentFmeaDoc) {
      Object.assign(this.currentFmeaDoc, this.fmeaBasicInfoForm.value);
    }

    this.isEditingBasicInfo = false;
    this.fmeaBasicInfoForm.disable();
    this.populateBasicInfoForm();
    this.femaDocUpdated.emit(this.currentFmeaDoc!);
  }

  // ========================================
  // TEAM MEMBER ADD SECTION
  // ========================================

  // Team member add properties
  isAddingCoreTeamMember: boolean = false;
  isAddingExtendedTeamMember: boolean = false;

  openAddCoreTeamMemberModal() {
    this.isAddingCoreTeamMember = true;
  }

  openAddExtendedTeamMemberModal() {
    this.isAddingExtendedTeamMember = true;
  }

  onAddCoreTeamMemberCancel() {
    this.isAddingCoreTeamMember = false;
  }

  onAddExtendedTeamMemberCancel() {
    this.isAddingExtendedTeamMember = false;
  }

  onCoreTeamMemberAdd(updatedMemberList: TeamMemberDto[]) {
    if (!this.currentFmeaDoc) return;
    this.currentFmeaDoc.coreMembers = updatedMemberList;
    this.refreshTeamMemberLists();
    this.femaDocUpdated.emit(this.currentFmeaDoc);
  }

  onExtendedTeamMemberAdd(updatedMemberList: TeamMemberDto[]) {
    if (!this.currentFmeaDoc) return;
    this.currentFmeaDoc.extendedMembers = updatedMemberList;
    this.refreshTeamMemberLists();
    this.femaDocUpdated.emit(this.currentFmeaDoc);
  }

  // ========================================
  // TEAM MEMBER EDIT SECTION
  // ========================================

  // Team member edit properties
  isEditingTeamMember: boolean = false;
  isSelectingCoreTeamForEdit: boolean = true;
  memberEditForm!: FormGroup;
  currentEditMemberIndex: number = -1;
  currentEditMember: TeamMemberDto | null = null;

  openEditTeamMemberModal(isCoreTeam: boolean, index: number) {
    this.isSelectingCoreTeamForEdit = isCoreTeam;
    this.currentEditMemberIndex = index;
    
    const membersList = isCoreTeam ? this.currentFmeaDoc?.coreMembers : this.currentFmeaDoc?.extendedMembers;
    if (!membersList || index < 0 || index >= membersList.length) return;
    
    this.currentEditMember = membersList[index];
    this.memberEditForm.setValue({
      note: this.currentEditMember.note || ''
    });
    
    this.isEditingTeamMember = true;
  }

  cancelEditTeamMember() {
    this.isEditingTeamMember = false;
    this.currentEditMember = null;
    this.currentEditMemberIndex = -1;
  }

  confirmEditTeamMember() {
    if (this.memberEditForm.invalid || this.currentEditMemberIndex < 0 || !this.currentEditMember) {
      return;
    }

    if (!this.currentFmeaDoc) return;
    
    const membersList = this.isSelectingCoreTeamForEdit ? this.currentFmeaDoc?.coreMembers : this.currentFmeaDoc?.extendedMembers;
    if (!membersList || this.currentEditMemberIndex >= membersList.length) return;
    
    membersList[this.currentEditMemberIndex].note = this.memberEditForm.value.note || '';
    
    this.isEditingTeamMember = false;
    this.currentEditMember = null;
    this.currentEditMemberIndex = -1;
    this.message.success('成员备注已更新');
  }

  deleteTeamMember(isCoreTeam: boolean, index: number) {
    if (!this.currentFmeaDoc) return;
    
    const membersList = isCoreTeam ? this.currentFmeaDoc?.coreMembers : this.currentFmeaDoc?.extendedMembers;
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
        this.refreshTeamMemberLists();
      }
    });
  }

  // recreate array to refresh ui
  refreshTeamMemberLists() {
    this.coreTeamMembers = [...this.currentFmeaDoc?.coreMembers || []];
    this.extendedTeamMembers = [...this.currentFmeaDoc?.extendedMembers || []];
  }
}
