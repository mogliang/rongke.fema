import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

import { TeamMemberDto } from '../../libs/api-client';
import { EmployeeModel, MockService } from '../mock.service';

@Component({
  selector: 'app-add-team-member-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule
  ],
  template: `
    <nz-modal 
      [(nzVisible)]="visible" 
      [nzTitle]="title"
      (nzOnCancel)="onCancel()" 
      (nzOnOk)="onConfirm()">
      <ng-container *nzModalContent>
        <nz-form-label nzRequired nzFor="employee">选择员工</nz-form-label>
        <nz-form-control>
          <div>
            <nz-select 
              nzPlaceHolder="选择员工" 
              [(ngModel)]="selectedEmployee"
              (ngModelChange)="selectEmployee($event)">
              @for (emp of availableEmployees; track emp) {
                <nz-option [nzValue]="emp" [nzLabel]="emp.name + ' (' + emp.employeeNo + ')'"></nz-option>
              }
            </nz-select>
          </div>
        </nz-form-control>

        <form nz-form [formGroup]="memberForm">
          <nz-form-item>
            <nz-form-label [nzSpan]="6">姓名</nz-form-label>
            <nz-form-control [nzSpan]="18">
              <input nz-input formControlName="name" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label [nzSpan]="6">工号</nz-form-label>
            <nz-form-control [nzSpan]="18">
              <input nz-input formControlName="employeeNo" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label [nzSpan]="6">角色</nz-form-label>
            <nz-form-control [nzSpan]="18">
              <input nz-input formControlName="role" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label [nzSpan]="6">部门</nz-form-label>
            <nz-form-control [nzSpan]="18">
              <input nz-input formControlName="department" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label [nzSpan]="6">邮箱</nz-form-label>
            <nz-form-control [nzSpan]="18">
              <input nz-input formControlName="email" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label [nzSpan]="6">电话</nz-form-label>
            <nz-form-control [nzSpan]="18">
              <input nz-input formControlName="phone" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label [nzSpan]="6">备注</nz-form-label>
            <nz-form-control [nzSpan]="18">
              <textarea 
                nz-input 
                formControlName="note" 
                placeholder="请输入备注信息"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }">
              </textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>
  `,
  styleUrls: []
})
export class AddTeamMemberModalComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() title: string = '添加团队成员';
  @Input() memberList: TeamMemberDto[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() memberListUpdate = new EventEmitter<TeamMemberDto[]>();
  @Output() cancel = new EventEmitter<void>();

  memberForm!: FormGroup;
  selectedEmployee: EmployeeModel | null = null;
  availableEmployees: EmployeeModel[] = [];

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private mockService: MockService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadAvailableEmployees();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  private loadAvailableEmployees() {
    this.availableEmployees = this.mockService.getEmployees();
  }

  private initializeForm() {
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

  private resetForm() {
    this.selectedEmployee = null;
    this.memberForm.reset();
    
    // Reset form fields to disabled state (they'll be filled from employee selection)
    Object.keys(this.memberForm.controls).forEach(key => {
      if (key !== 'note') {
        this.memberForm.get(key)?.disable();
      }
    });
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

  onCancel() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  onConfirm() {
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

    // Check if member already exists
    if (this.memberList.some((member: TeamMemberDto) => member.employeeNo === this.selectedEmployee!.employeeNo)) {
      this.message.warning('该成员已存在于团队中');
      return;
    }

    // Create new team member from selected employee
    const newMember = this.mockService.convertToTeamMember(
      this.selectedEmployee,
      this.memberForm.value.note || ''
    );

    // Create updated member list
    const updatedList = [...this.memberList, newMember];

    this.visible = false;
    this.visibleChange.emit(false);
    this.memberListUpdate.emit(updatedList);
    this.message.success('成员已添加');
  }
}
