import { Injectable } from '@angular/core';
import { TeamMemberDto } from '../libs/api-client';

// Employee interface for mock data
export interface EmployeeModel {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
  role: string;
  email: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockService {

  constructor() { }

  // Mock employee data that can be used for FMEA team members and owners
  private mockEmployees: EmployeeModel[] = [
    {
      id: '1',
      employeeNo: 'EMP001',
      name: '张三',
      department: '研发部',
      role: '设计工程师',
      email: 'zhangsan@example.com',
      phone: '13800138001'
    },
    {
      id: '2',
      employeeNo: 'EMP002',
      name: '李四',
      department: '质量部',
      role: '质量工程师',
      email: 'lisi@example.com',
      phone: '13800138002'
    },
    {
      id: '3',
      employeeNo: 'EMP003',
      name: '王五',
      department: '生产部',
      role: '制造工程师',
      email: 'wangwu@example.com',
      phone: '13800138003'
    },
    {
      id: '4',
      employeeNo: 'EMP004',
      name: '赵六',
      department: '技术部',
      role: '技术专家',
      email: 'zhaoliu@example.com',
      phone: '13800138004'
    },
    {
      id: '5',
      employeeNo: 'EMP005',
      name: '钱七',
      department: '产品部',
      role: '产品经理',
      email: 'qianqi@example.com',
      phone: '13800138005'
    },
    {
      id: '6',
      employeeNo: 'EMP006',
      name: '孙八',
      department: '采购部',
      role: '采购专员',
      email: 'sunba@example.com',
      phone: '13800138006'
    },
    {
      id: '7',
      employeeNo: 'EMP007',
      name: '周九',
      department: '市场部',
      role: '市场专员',
      email: 'zhoujiu@example.com',
      phone: '13800138007'
    },
    {
      id: '8',
      employeeNo: 'EMP008',
      name: '吴十',
      department: '研发部',
      role: '软件工程师',
      email: 'wushi@example.com',
      phone: '13800138008'
    },
    {
      id: '9',
      employeeNo: 'EMP009',
      name: '郑十一',
      department: '质量部',
      role: '可靠性工程师',
      email: 'zhengshiyi@example.com',
      phone: '13800138009'
    },
    {
      id: '10',
      employeeNo: 'EMP010',
      name: '王十二',
      department: '研发部',
      role: '系统工程师',
      email: 'wangshier@example.com',
      phone: '13800138010'
    }
  ];

  // Method to get all employees
  public getEmployees(): EmployeeModel[] {
    return [...this.mockEmployees];
  }

  // Method to search employees by keyword
  public searchEmployees(keyword: string): EmployeeModel[] {
    if (!keyword) return this.getEmployees();
    
    keyword = keyword.toLowerCase();
    return this.mockEmployees.filter(employee => 
      employee.name.toLowerCase().includes(keyword) || 
      employee.employeeNo.toLowerCase().includes(keyword) ||
      employee.department.toLowerCase().includes(keyword) ||
      employee.role.toLowerCase().includes(keyword)
    );
  }

  // Method to convert EmployeeModel to TeamMemberDto
  public convertToTeamMember(employee: EmployeeModel, note: string = ''): TeamMemberDto {
    return {
      name: employee.name,
      employeeNo: employee.employeeNo,
      role: employee.role,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      note: note
    };
  }
}