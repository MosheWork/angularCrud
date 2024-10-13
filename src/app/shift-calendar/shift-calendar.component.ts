import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShiftDialogComponent } from '../shift-dialog/shift-dialog.component';

interface Shift {
  employeeName: string;
  shiftTime: string;
  date: Date;
  days: string;
  holiday?: string;  // Optional
}

@Component({
  selector: 'app-shift-calendar',
  templateUrl: './shift-calendar.component.html',
  styleUrls: ['./shift-calendar.component.scss']
})
export class ShiftCalendarComponent {
  selectedDate: Date | null = new Date(); // Allow null
  shifts: Shift[] = [];  // Store shifts with employeeName, shiftTime, days, and optional holiday

  displayedColumns: string[] = ['date', 'days', 'employeeName', 'holiday'];  // Columns for the table
  dataSource: Shift[] = [];  // Data source for the table

  constructor(public dialog: MatDialog) {}

  // Open the dialog to add a shift
  openShiftDialog(date: Date): void {
    const dialogRef = this.dialog.open(ShiftDialogComponent, {
      width: '300px',
      data: { employeeName: '', shiftTime: '', days: '', holiday: '' }
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
      this.shifts.push(shift);  // Add the shift to the list
      this.updateTableData();  // Update the table data
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
