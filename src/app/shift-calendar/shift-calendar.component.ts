import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ShiftDialogComponent } from '../shift-dialog/shift-dialog.component';
import { environment } from '../../environments/environment';  // Import environment

interface Shift {
  employeeName: string;
  shiftTime: string;
  date: Date;
  holiday?: string;  // Optional
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

  private apiUrl = environment.apiUrl + 'oncallshifts';  // Backend API URL

  constructor(public dialog: MatDialog, private http: HttpClient) {}

  ngOnInit() {
    this.getShifts();  // Fetch shifts on initialization
  }

  // Method to get shifts from the backend
  getShifts() {
    this.http.get<Shift[]>(this.apiUrl).subscribe((data: Shift[]) => {
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
  
  

  // Open the dialog to add a shift
  openShiftDialog(date: Date): void {
    const dialogRef = this.dialog.open(ShiftDialogComponent, {
      width: '300px',
      data: { employeeName: '', shiftTime: '' }
    });

    dialogRef.afterClosed().subscribe((result: Shift | undefined) => {
      if (result) {
        this.addShiftToDate(result, date);
      }
    });
  }

  // Add a shift for the selected date
  addShiftToDate(shift: Shift, date: Date) {
    if (date) {
      shift.date = date;  // Assign the date to the shift
      this.shifts.push(shift);  // Add the shift to the local array

      // Make POST request to save the shift
      this.http.post<Shift>(this.apiUrl, shift).subscribe(() => {
        this.updateTableData();  // Update the table after saving
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
