import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ShiftDialogComponent } from '../shift-dialog/shift-dialog.component';
import { environment } from '../../environments/environment'; // Import environment
import { MatSnackBar } from '@angular/material/snack-bar'; // Snackbar for error messages

// Interfaces for Employee and Shift objects
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

// Interface for employee shift count model with previous and current month shift counts
// Interface for employee shift count model with previous and current month shift counts
export interface EmployeeShiftCountModel {
  EmployeeId: string;
  EmployeeName: string;
  ShiftsPreviousMonth2: number;
  ShiftsPreviousMonth1: number;
  ShiftsCurrentMonth: number;
  ShiftCount: number;
}

@Component({
  selector: 'app-shift-calendar',
  templateUrl: './shift-calendar.component.html',
  styleUrls: ['./shift-calendar.component.scss'],
})
export class ShiftCalendarComponent implements OnInit {
  selectedDate: Date | null = new Date(); // The currently selected date in the calendar
  shifts: Shift[] = []; // Array to store all the shift data
  employees: Employee[] = []; // Array to store employee data
  employeeShiftCounts: EmployeeShiftCountModel[] = []; // Array to store employee shift counts for the past two months and current month
  displayedColumns: string[] = [
    'employeeName',
    'shiftsPreviousMonth2',
    'shiftsPreviousMonth1',
    'shiftsCurrentMonth',
    'shiftCount',
  ]; // Table columns
  dataSource: Shift[] = []; // Data source for the shift table

  // Variables to store the month names for display in the table
  currentMonthName: string = '';
  previousMonth1Name: string = '';
  previousMonth2Name: string = '';

  formattedMonth: string; // For displaying the formatted current month
  selectedYear: number; // To store the selected year

  constructor(
    public dialog: MatDialog,
    private http: HttpClient,
    private snackBar: MatSnackBar // Snackbar for error messages
  ) {
    this.formattedMonth = this.formatMonth(new Date().getMonth() + 1); // Initialize with current month name
    this.selectedYear = new Date().getFullYear(); // Initialize with current year
  }

  // On initialization, load shifts, employees, and calculate shift counts
  ngOnInit() {
    const currentDate = new Date();
    this.currentMonthName = this.formatMonth(currentDate.getMonth() + 1); // Set current month name
    this.previousMonth1Name = this.formatMonth(currentDate.getMonth()); // Set previous month name
    this.previousMonth2Name = this.formatMonth(currentDate.getMonth() - 1); // Set month before last name

    this.getShifts(); // Fetch shifts on initialization
    this.loadEmployees(); // Fetch employees on initialization
    this.loadShiftCounts(); // Load shift counts for display
  }

  // Method to format month number into month name
  formatMonth(month: number): string {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[(month + 12) % 12]; // Handle negative month numbers for previous months
  }

  // Method to fetch shifts from the backend
  getShifts() {
    this.http
      .get<Shift[]>(environment.apiUrl + 'oncallshifts')
      .subscribe((data: Shift[]) => {
        this.shifts = data.map((shift) => ({
          ...shift,
          date: new Date(shift.Year, shift.Month - 1, shift.Day)
            .toISOString()
            .split('T')[0], // Format date as 'YYYY-MM-DD'
        }));
        this.updateTableData(); // Update the table data
        this.calculateEmployeeShiftCounts(); // Calculate employee shift counts
      });
  }

  // Method to load employee data from the backend
  loadEmployees() {
    this.http
      .get<Employee[]>(environment.apiUrl + 'oncallshifts/employees')
      .subscribe({
        next: (data) => {
          this.employees = data;
          this.calculateEmployeeShiftCounts(); // Ensure employee counts are calculated after employees are loaded
        },
        error: (error) => {
          console.error('Error loading employees:', error);
        },
      });
  }

  // Method to calculate how many shifts each employee has in the current and previous months
  calculateEmployeeShiftCounts() {
    const currentMonth = this.selectedDate
      ? this.selectedDate.getMonth() + 1
      : new Date().getMonth() + 1;
    const currentYear = this.selectedDate
      ? this.selectedDate.getFullYear()
      : new Date().getFullYear();

    // Filter shifts by current month and year
    const shiftsThisMonth = this.shifts.filter(
      (shift) => shift.Month === currentMonth && shift.Year === currentYear
    );

    // Reset the counts
    this.employeeShiftCounts = [];

    // Calculate the number of shifts for each employee
    this.employees.forEach((employee) => {
      const employeeShifts = shiftsThisMonth.filter(
        (shift) => shift.employeeId === employee.EmployeeID
      );
      this.employeeShiftCounts.push({
        EmployeeId: `${employee.EmployeeID}`,
        EmployeeName: `${employee.FirstName} ${employee.LastName}`,
        ShiftsPreviousMonth2: 0, // Add logic for shifts in the month before last if needed
        ShiftsPreviousMonth1: 0, // Add logic for shifts in the last month if needed
        ShiftsCurrentMonth: employeeShifts.length, // Shifts in the current month
        ShiftCount: employeeShifts.length, // Total shift count for the current month
      });
    });

    console.log('Employee shift counts:', this.employeeShiftCounts); // Log the shift counts for debugging
  }

  // Update the table data source based on selected date
  updateTableData() {
    const selectedMonth = this.selectedDate
      ? this.selectedDate.getMonth() + 1
      : new Date().getMonth() + 1;
    const selectedYear = this.selectedDate
      ? this.selectedDate.getFullYear()
      : new Date().getFullYear();

    // Filter shifts by selected month and year
    this.dataSource = this.shifts.filter(
      (shift) => shift.Month === selectedMonth && shift.Year === selectedYear
    );
    console.log('Filtered shifts for table:', this.dataSource); // Debugging
  }

  // When a date is selected, open the shift dialog and update data
  onDateSelected(date: Date | null) {
    if (date) {
      this.selectedDate = date;
      this.calculateEmployeeShiftCounts(); // Recalculate employee shift counts for the selected month
      this.updateTableData(); // Recalculate table data for the selected month
      this.openShiftDialog(date); // Open dialog when a date is selected
      this.loadShiftCounts();
    }
  }

  // When the user changes the month, recalculate shifts and employee counts
  onMonthSelected(event: Date) {
    this.selectedDate = event; // Update the selected date when the user changes the month
    this.calculateEmployeeShiftCounts(); // Recalculate counts for the selected month
    this.updateTableData(); // Update the shift table for the selected month
    this.loadShiftCounts();
  }

  // Open a dialog to add a shift for the selected date
  openShiftDialog(date: Date): void {
    const dialogRef = this.dialog.open(ShiftDialogComponent, {
      width: '300px',
      data: { comment: '' }, // Initialize with an empty comment
    });

    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.employeeId && result.comment) {
        const shift: Shift = {
          employeeId: Number(result.employeeId),
          employeeName: result.employeeName,
          comment: result.comment,
          date: `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
          Year: date.getFullYear(),
          Month: date.getMonth() + 1, // Month is zero-indexed in JS
          Day: date.getDate(),
        };

        this.addShiftToDate(shift, date);
      }
    });
  }

  // Add a shift to the selected date
  addShiftToDate(shift: Shift, date: Date) {
    this.http
      .post<Shift>(environment.apiUrl + 'oncallshifts', shift)
      .subscribe({
        next: () => {
          this.getShifts(); // Refresh the shifts table after saving
          this.loadShiftCounts();
        },
        error: (error) => {
          // Check if the error contains a specific message about primary key violation
          const errorMessage = error.error.ExceptionMessage;

          // Display custom error message for specific case
          if (
            errorMessage &&
            errorMessage.includes('Violation of PRIMARY KEY')
          ) {
            this.snackBar.open(
              'אין אפשרות לעדכן 2 עובדים על אותו יום בכוננות',
              'Close',
              {
                duration: 5000,
              }
            );
          } else {
            // For other errors, display a generic message
            this.snackBar.open(
              'Error adding shift. Please try again.',
              'Close',
              {
                duration: 5000,
              }
            );
          }

          console.error('Error adding shift:', error); // Log error for debugging purposes
        },
      });
  }

  // Load shift counts for the selected month
  loadShiftCounts() {
    const selectedMonth = this.selectedDate?.getMonth()! + 1; // Get month of the selected date
    const selectedYear = this.selectedDate?.getFullYear(); // Get year of the selected date

    this.http
      .get<EmployeeShiftCountModel[]>(
        `${environment.apiUrl}oncallshifts/countShifts?year=${selectedYear}&month=${selectedMonth}`
      )
      .subscribe({
        next: (data) => {
          console.log('Shift count data from API:', data); // Debugging

          // Correct mapping for the loadShiftCounts method
          this.employeeShiftCounts = data.map((shift) => ({
            EmployeeId: shift.EmployeeId, // Correct case-sensitive field name
            EmployeeName: shift.EmployeeName, // Correct case-sensitive field name
            ShiftsCurrentMonth: shift.ShiftsCurrentMonth || 0, // Handle undefined values
            ShiftsPreviousMonth1: shift.ShiftsPreviousMonth1 || 0,
            ShiftsPreviousMonth2: shift.ShiftsPreviousMonth2 || 0,
            ShiftCount:
              (shift.ShiftsCurrentMonth || 0) +
              (shift.ShiftsPreviousMonth1 || 0) +
              (shift.ShiftsPreviousMonth2 || 0), // Calculate total shifts
          }));
        },
        error: (error) => {
          console.error('Error loading shift counts:', error);
        },
      });
  }

  // Listen for changes when the visible month or year changes
  onViewChange(event: any) {
    if (event && event.start) {
      const newMonth = event.start.getMonth() + 1; // Get the new visible month (add 1 since months are zero-indexed)
      const newYear = event.start.getFullYear(); // Get the new visible year

      // Update the displayed month and year
      this.formattedMonth = this.formatMonth(newMonth);
      this.selectedYear = newYear;

      // Update the shift data based on the new month and year
      this.updateTableData(); // Re-filter shifts for the selected month and year
      this.loadShiftCounts(); // Load shift counts for the new month
    }
  }
}
