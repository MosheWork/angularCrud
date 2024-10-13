import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Import HttpClient
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-shift-table',
  templateUrl: './shift-table.component.html',
  styleUrls: ['./shift-table.component.scss']
})
export class ShiftTableComponent implements OnInit {
  displayedColumns: string[] = ['employeeName']; // Columns for the table
  dataSource: any[] = [];  // Data source for the table
  months: string[] = [];  // Dynamic months
  nextMonth: string = '';  // Initialize nextMonth as an empty string

  constructor(private http: HttpClient) {}  // Inject HttpClient

  ngOnInit(): void {
    this.loadShifts();  // Load shifts from API
  }

// Load shifts from the backend API and prepopulate the next month if available
loadShifts(): void {
  this.http.get<any[]>(environment.apiUrl + 'shifts').subscribe(
    (data) => {
      this.extractMonths(data);  // Extract month columns dynamically
      this.setNextMonth();  // Set the next month's name dynamically

      const transformedData = this.transformData(data);
      this.dataSource = transformedData;  // Populate data source with transformed data

      // Prepopulate next month data if available
      this.dataSource.forEach(employee => {
        employee.nextMonthStatus = employee[this.nextMonth] === 'כן' ? true : (employee[this.nextMonth] === 'לא' ? false : null);
      });

      // Recalculate the "לא" count in the last two months
      this.calculateNoCount();

      // Ensure the 'noCountLastTwoMonths' column is part of displayed columns
      this.displayedColumns = ['employeeName', ...this.months, 'noCountLastTwoMonths', 'nextMonth'];
    },
    (error) => {
      console.error('Error fetching shift data:', error);
    }
  );
}



  // Extract months dynamically from the data
  extractMonths(data: any[]): void {
    if (data.length > 0) {
      this.months = Object.keys(data[0]).filter(key => key !== 'EmployeeName'); // Extract month keys
      this.displayedColumns = ['employeeName', ...this.months, 'noCountLastTwoMonths', 'nextMonth'];
    }
  }

  // Dynamically set the next month
  setNextMonth(): void {
    const now = new Date();
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    this.nextMonth = `${nextMonthDate.getMonth() + 1}/${nextMonthDate.getFullYear()}`;
  }

  // Transform the API response data to match the table format
  transformData(data: any[]): any[] {
    const groupedData: any = {};

    // Group the data by EmployeeName and add month-year values as properties
    data.forEach((shift) => {
      const { EmployeeName, ...months } = shift;
      if (!groupedData[EmployeeName]) {
        groupedData[EmployeeName] = { employeeName: EmployeeName, nextMonthStatus: null };  // Add nextMonthStatus input field
      }
      Object.keys(months).forEach(month => {
        groupedData[EmployeeName][month] = months[month];
      });
    });

    // Convert the grouped data object into an array for the dataSource
    return Object.values(groupedData);
  }

  // Handle status change for the next month
  onStatusChange(element: any): void {
    console.log(`Status for ${element.employeeName} in ${this.nextMonth}: ${element.nextMonthStatus === null ? 'No selection' : (element.nextMonthStatus ? 'כן' : 'לא')}`);
  }

// Save all shifts (including existing and updated values)
saveAllShifts(): void {
  const shiftsToSave = this.dataSource.map((employee) => ({
    employeeName: employee.employeeName,
    nextMonth: this.nextMonth,
    // Send 1 for 'כן', 0 for 'לא', and null if not selected
    status: employee.nextMonthStatus != null ? (employee.nextMonthStatus ? 1 : 0) : null
  }));

  // Call the API to save shifts for all employees
  this.http.post(environment.apiUrl + 'shifts/AddNextMonth', shiftsToSave)
    .subscribe(
      () => {
        console.log('All shifts saved successfully');
        // Reload the entire page
        window.location.reload();
      },
      (error) => console.error('Error saving shifts:', error)
    );
}

// Add a method to calculate the count of 'לא' (No) in the last two months
calculateNoCount(): void {
  const now = new Date();  // Current date
  const currentMonthYear = `${now.getMonth() + 1}/${now.getFullYear()}`;  // Current month-year in the same format as the table

  // Filter to get only past months that are less than or equal to the current month
  const pastMonths = this.months.filter(month => {
    const [monthPart, yearPart] = month.split('/');
    const monthDate = new Date(parseInt(yearPart), parseInt(monthPart) - 1); // Convert month-year to Date object
    return monthDate <= now;  // Only include past months or the current month
  });

  // Get the last two past months
  const lastTwoMonths = pastMonths.slice(-2);  // Take the last two months

  // Calculate the "לא" count for the last two months
  this.dataSource.forEach(employee => {
    employee.noCountLastTwoMonths = lastTwoMonths.reduce((count, month) => {
      return count + (employee[month] === 'כן' ? 1 : 0);
    }, 0);
  });
}


}
