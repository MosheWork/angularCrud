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
  date: string;  // If you still want to use the formatted date
  Year: number;  // Make Year optional
  Month: number; // Make Month optional
  Day: number;   // Make Day optional
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
    this.http.get<Shift[]>(environment.apiUrl + 'oncallshifts').subscribe((data: Shift[]) => {
      console.log(data);  // Log the fetched data for debugging
      
      this.shifts = data.map(shift => {
        // Construct a valid Date object from Year, Month, and Day
        const validDate = new Date(shift.Year, shift.Month - 1, shift.Day);  // Month is zero-indexed
        
        if (isNaN(validDate.getTime())) {
          console.error(`Invalid date detected for shift:`, shift);
          return { ...shift, date: 'Invalid Date' };  // Handle invalid date
        }
  
        // Convert valid Date to 'YYYY-MM-DD' string format
        return {
          ...shift,
          date: validDate.toISOString().split('T')[0]  // Format date as 'YYYY-MM-DD'
        };
      });
      
      this.updateTableData();  // Update the table with fetched data
    }, error => {
      console.error('Error fetching shifts:', error);  // Log any errors that occur during the request
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
  
        // Create shift object with employeeName and other necessary properties
        const shift: Shift = {
          employeeId: Number(result.employeeId),  // Ensure employeeId is a number
          employeeName: result.employeeName,  // Use employeeName passed from the dialog
          comment: result.comment,
          date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,  // Format date as 'YYYY-MM-DD'
          Year: date.getFullYear(),  // Add Year
          Month: date.getMonth() + 1,  // Add Month (0-indexed)
          Day: date.getDate()  // Add Day
        };
  
        console.log('Shift object with employeeName and formatted date:', shift);  // Verify employeeName is included
  
        this.addShiftToDate(shift, date);  // Add shift and send to the backend
      } else {
        console.log('No valid data returned or dialog was closed');
      }
    });
  }
  
  
  
  
  
  
  

  
  
  
  

  // Add a shift for the selected date
  addShiftToDate(shift: Shift, date: Date) {
    // Format the date to 'YYYY-MM-DD' to remove time and timezone issues
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    // Update the shift date to the formatted date (without time)
    shift.date = formattedDate;

  
    console.log('Corrected Shift Date (Formatted) being sent to backend:', shift.date);
  
    // Make a POST request to the backend to save the shift
    this.http.post<Shift>(environment.apiUrl + 'oncallshifts', shift).subscribe(() => {
      this.updateTableData();  // Refresh the table after saving
    }, error => {
      console.error('Error saving shift:', error);  // Log any errors that occur during the request
    });
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
