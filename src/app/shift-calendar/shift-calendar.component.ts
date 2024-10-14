import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ShiftDialogComponent } from '../shift-dialog/shift-dialog.component';
import { environment } from '../../environments/environment';  // Import environment

interface Employee {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
}

interface Shift {
  employeeId: number;
  employeeName: string;
  comment: string;
  date: string;
  Year: number;
  Month: number;
  Day: number;
}
interface EmployeeShiftCountModel {
  EmployeeId: string;
  EmployeeName: string;
  ShiftCount: number;
}

@Component({
  selector: 'app-shift-calendar',
  templateUrl: './shift-calendar.component.html',
  styleUrls: ['./shift-calendar.component.scss']
})
export class ShiftCalendarComponent implements OnInit {
  selectedDate: Date | null = new Date();
  shifts: Shift[] = [];
  employees: Employee[] = [];
  employeeShiftCounts: { employeeName: string, shiftCount: number }[] = []; // List to store employee shift counts
  displayedColumns: string[] = ['year', 'month', 'day', 'dayOfTheWeek', 'employeeId', 'employeeName', 'comment'];
  dataSource: Shift[] = [];  // Data source for the table

  formattedMonth: string;  // For displaying the month name
  selectedYear: number;    // For displaying the selected year

  constructor(public dialog: MatDialog, private http: HttpClient) {
    this.formattedMonth = this.formatMonth(new Date().getMonth() + 1);  // Initialize with current month
    this.selectedYear = new Date().getFullYear();  // Initialize with current year
  }

  ngOnInit() {
    this.getShifts();  // Fetch shifts on initialization
    this.loadEmployees();  // Fetch employees on initialization
    this.loadShiftCounts();
  }

  // Method to format month number into month name
  formatMonth(month: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  }

  // Method to fetch shifts
  getShifts() {
    this.http.get<Shift[]>(environment.apiUrl + 'oncallshifts').subscribe((data: Shift[]) => {
      this.shifts = data.map(shift => ({
        ...shift,
        date: new Date(shift.Year, shift.Month - 1, shift.Day).toISOString().split('T')[0]  // Format date as 'YYYY-MM-DD'
      }));
      this.updateTableData();  // Update the table with fetched data
      this.calculateEmployeeShiftCounts();  // Calculate shift counts for the current month
      this.loadShiftCounts();

    });
  }

  // Method to load employees
  loadEmployees() {
    this.http.get<Employee[]>(environment.apiUrl + 'oncallshifts/employees').subscribe({
      next: (data) => {
        this.employees = data;
        this.calculateEmployeeShiftCounts(); // Ensure employee counts are calculated after employees are loaded
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  // Method to calculate how many shifts each employee has in the current month
  calculateEmployeeShiftCounts() {
    const currentMonth = this.selectedDate ? this.selectedDate.getMonth() + 1 : new Date().getMonth() + 1;
    const currentYear = this.selectedDate ? this.selectedDate.getFullYear() : new Date().getFullYear();

    // Filter shifts by current month and year
    const shiftsThisMonth = this.shifts.filter(shift => shift.Month === currentMonth && shift.Year === currentYear);

    // Reset the counts
    this.employeeShiftCounts = [];

    // Calculate the number of shifts for each employee
    this.employees.forEach(employee => {
      const employeeShifts = shiftsThisMonth.filter(shift => shift.employeeId === employee.EmployeeID);
      this.employeeShiftCounts.push({
        employeeName: `${employee.FirstName} ${employee.LastName}`,
        shiftCount: employeeShifts.length
      });
    });

    console.log('Employee shift counts:', this.employeeShiftCounts);  // Log the shift counts for debugging
  }

  // Update the table data source
  updateTableData() {
    const currentMonth = this.selectedDate ? this.selectedDate.getMonth() + 1 : new Date().getMonth() + 1;
    const currentYear = this.selectedDate ? this.selectedDate.getFullYear() : new Date().getFullYear();

    // Filter shifts by current month and year
    this.dataSource = this.shifts.filter(shift => shift.Month === currentMonth && shift.Year === currentYear);  // Refresh the data source for the table
  }

  // When a date is selected
  onDateSelected(date: Date | null) {
    if (date) {
      this.selectedDate = date;
      this.calculateEmployeeShiftCounts(); // Recalculate employee shift counts for the selected month
      this.updateTableData();  // Recalculate table data for the selected month
      this.openShiftDialog(date);  // Open dialog when a date is selected
      this.loadShiftCounts();
    }
  }

  // When the user changes the month, recalculate shifts and employee counts
  onMonthSelected(event: Date) {
    this.selectedDate = event;  // Update the selected date when the user changes the month
    this.calculateEmployeeShiftCounts();  // Recalculate counts for the selected month
    this.updateTableData();  // Update the shift table for the selected month
    this.loadShiftCounts();
  }

  openShiftDialog(date: Date): void {
    const dialogRef = this.dialog.open(ShiftDialogComponent, {
      width: '300px',
      data: { comment: '' }  // Initialize with an empty comment
    });

    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.employeeId && result.comment) {
        const shift: Shift = {
          employeeId: Number(result.employeeId),
          employeeName: result.employeeName,
          comment: result.comment,
          date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
          Year: date.getFullYear(),
          Month: date.getMonth() + 1,  // Month is zero-indexed in JS
          Day: date.getDate()
        };

        this.addShiftToDate(shift, date);
      }
    });
  }

  addShiftToDate(shift: Shift, date: Date) {
    this.http.post<Shift>(environment.apiUrl + 'oncallshifts', shift).subscribe(() => {
      this.getShifts();  // Refresh the shifts table after saving
    });

    this.loadShiftCounts();

  }

  loadShiftCounts() {
    const selectedMonth = this.selectedDate?.getMonth()! + 1;
    const selectedYear = this.selectedDate?.getFullYear();
  
    this.http.get<EmployeeShiftCountModel[]>(`${environment.apiUrl}oncallshifts/countShifts?year=${selectedYear}&month=${selectedMonth}`)
      .subscribe({
        next: (data) => {
          console.log('Shift count data from API:', data);  // Log the data received from the API
          this.employeeShiftCounts = data.map(shift => ({
            employeeName: shift.EmployeeName,
            shiftCount: shift.ShiftCount
          }));
        },
        error: (error) => {
          console.error('Error loading shift counts:', error);
        }
      });
  }
  
  
}
