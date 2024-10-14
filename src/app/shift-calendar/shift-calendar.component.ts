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
  date: Date;
}

@Component({
  selector: 'app-shift-calendar',
  templateUrl: './shift-calendar.component.html',
  styleUrls: ['./shift-calendar.component.scss']
})
export class ShiftCalendarComponent implements OnInit {
  selectedDate: Date | null = new Date();
  shifts: Shift[] = [];
  displayedColumns: string[] = ['year', 'month', 'day', 'dayOfTheWeek', 'employeeId', 'employeeName', 'comment'];
  dataSource: Shift[] = [];  // Data source for the table
  employees: Employee[] = [];  // Declare the employees property here

  // Backend API URL

  constructor(public dialog: MatDialog, private http: HttpClient) {}

  ngOnInit() {
    this.getShifts();  // Fetch shifts on initialization
    this.loadEmployees();  // Fetch employees on initialization
  }

  // Method to get shifts from the backend
  getShifts() {
    this.http.get<Shift[]>( environment.apiUrl+'oncallshifts').subscribe((data: Shift[]) => {
      console.log(data);  // Log the fetched data for debugging
      this.shifts = data.map(shift => ({
        ...shift,
        // If you want to keep using the separate fields, you can,
        // or you can switch to using the combined date field.
        date: new Date(shift.date) // Use the combined Date field
      }));
      this.updateTableData();  // Update the table with fetched data
    });
  }
  
  
  loadEmployees() {
    this.http.get<Employee[]>( environment.apiUrl + 'oncallshifts/employees').subscribe({
      next: (data) => {
        this.employees = data;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  openShiftDialog(date: Date): void {
    const dialogRef = this.dialog.open(ShiftDialogComponent, {
      width: '300px',
      data: { comment: '' }  // Initialize with an empty comment
    });
  
    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.employeeId && result.comment) {
        console.log('Dialog result:', result);  // Log result for debugging
  
        // Find the employeeName by employeeId
        const selectedEmployee = this.employees.find(emp => emp.EmployeeID === Number(result.employeeId));
  
        console.log('Selected employee:', selectedEmployee);  // Log selected employee
  
        // Create shift object with employeeName
        const shift: Shift = {
          employeeId: Number(result.employeeId),  // Ensure employeeId is a number
          employeeName: result.employeeName,
          comment: result.comment,
          date: date
        };
  
        console.log('Shift object with employeeName:', shift);  // Verify employeeName is included
  
        this.addShiftToDate(shift, date);  // Add shift and send to the backend
      } else {
        console.log('No valid data returned or dialog was closed');
      }
    });
  }
  
  
  
  
  

  
  
  
  

  // Add a shift for the selected date
  addShiftToDate(shift: Shift, date: Date) {
    if (date) {
      shift.date = date;  // Assign the selected date to the shift
      this.shifts.push(shift);  // Add the shift to the array
  
      // Optionally make a POST request to the backend to save the shift
      this.http.post<Shift>( environment.apiUrl+ 'oncallshifts', shift).subscribe(() => {
        this.updateTableData();  // Refresh the table after saving
      });
    }
  }
  

  // Update the table data source
  updateTableData() {
    this.dataSource = [...this.shifts];  // Refresh the data source for the table
  }

  // When a date is selected
  onDateSelected(date: Date | null) {
    if (date) {
      this.selectedDate = date;
      this.openShiftDialog(date);  // Open dialog when a date is selected
    }
  }
}
