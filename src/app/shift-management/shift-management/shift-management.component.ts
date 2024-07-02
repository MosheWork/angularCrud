import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface EmployeeModel {
  id: number;
  name: string;
  employeeType: string;
  totalShifts: number;
}

interface ShiftModel {
  shiftID: number;
  shiftDate: string;
  shiftType: string;
  employeeID?: number;
  employeeName?: string;
}

interface DayModel {
  date: Date;
  shifts: ShiftModel[];
}

@Component({
  selector: 'app-shift-management',
  templateUrl: './shift-management.component.html',
  styleUrls: ['./shift-management.component.scss']
})
export class ShiftManagementComponent implements OnInit {
  employees: EmployeeModel[] = [];
  days: DayModel[] = [];

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadShifts();
  }

  loadEmployees(): void {
    this.http.get<EmployeeModel[]>(`${this.apiUrl}NightShiftsAPI/employees`).subscribe(employees => {
      this.employees = employees;
    });
  }

  loadShifts(): void {
    this.http.get<ShiftModel[]>(`${this.apiUrl}NightShiftsAPI/shifts`).subscribe(shifts => {
      this.processShifts(shifts);
    });
  }

  processShifts(shifts: ShiftModel[]): void {
    this.generateCalendarDays();
    const groupedShifts = this.groupBy(shifts, 'shiftDate');
    this.days.forEach(day => {
      const dateStr = day.date.toISOString().split('T')[0];
      day.shifts = groupedShifts[dateStr] || [];
    });
  }

  generateCalendarDays(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.days = [];
    for (let day = startOfMonth; day <= endOfMonth; day.setDate(day.getDate() + 1)) {
      this.days.push({ date: new Date(day), shifts: [] });
    }
  }

  groupBy(array: ShiftModel[], key: string): any {
    return array.reduce((result: { [key: string]: ShiftModel[] }, currentValue: ShiftModel) => {
      const value = (currentValue as any)[key];
      (result[value] = result[value] || []).push(currentValue);
      return result;
    }, {});
  }

  assignEmployee(shift: ShiftModel): void {
    const employee = this.employees.find(e => e.id === shift.employeeID);
    shift.employeeName = employee?.name;

    // Update total shifts for the employee in the UI
    if (employee) {
      employee.totalShifts++;
    }

    this.http.post<void>(`${this.apiUrl}NightShiftsAPI/assign`, { shiftID: shift.shiftID, employeeID: employee?.id }).subscribe();
  }
}
