import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../environments/environment'
import * as XLSX from 'xlsx';

interface FormControls {
  [key: string]: FormControl;
}
@Component({
  selector: 'app-hospitalizations-list',
  templateUrl: './hospitalizations-list.component.html',
  styleUrls: ['./hospitalizations-list.component.scss'],
})
export class HospitalizationsListComponent implements OnInit {
  Title1: string = ' כמות מאושפזים';
  Title2: string = 'משה-כללי ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Form group for filtering controls

  filterForm: FormGroup;

  // Arrays to store data and options for dropdowns

  dataSource: any[] = [];
  filteredData: any[] = [];
  answerTextOptions: any[] = [];
  answerTextTypeOptions: any[] = []; // New array for 'answer_Text_Type'

  // MatTableDataSource for Angular Material table

  matTableDataSource: MatTableDataSource<any>; // Define MatTableDataSource

  // Column names for the table
  columns: string[] = ['name', 'admission_No'];

  // Add this method to reset filters
  resetFilters() {
    // Reset all form controls to their default values
    this.filterForm.reset();

    // Clear the global filter input separately
    this.filterForm.get('globalFilter')?.setValue('');

    // Trigger the applyFilters method to apply the changes
    this.applyFilters();

    // Set the filteredData to be the same as the original dataSource
    this.filteredData = [...this.dataSource];
    this.totalResults = this.filteredData.length;

    // Update the title and the MatTableDataSource
    this.Title2 = `משה כללי - סה"כ תוצאות: ${this.totalResults}`;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }
  // Method to parse a date string into a Date object or null

  parseDate(dateString: string | null): Date | null {
    if (!dateString) {
      return null; // Return null for empty or null date strings
    }

    const parsedDate = new Date(dateString);

    // Check if the parsedDate is a valid date
    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return null; // Return null for invalid date strings
    }

    return parsedDate;
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      name: ' מחלקה',
      admission_No: 'כמות מאושפזים ',
    };
    return columnLabels[column] || column;
  }
  // Constructor to initialize HttpClient and FormBuilder
  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'HostAPI').subscribe((data) => {
      //console.log('Received data:', data); // Log the data received from the API

      // Set up data sources and filters

      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
      // Set up form control change subscriptions for filtering

      this.columns.forEach((column) => {
        this.filterForm
          .get(column)
          ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => this.applyFilters());
      });

      // Fetch options for dropdowns

      this.fetchAnswerTextOptions();
      this.fetchAnswerTextTypeOptions(); // Fetch options for 'answer_Text_Type'

      // Set up form value change subscription for filtering
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });

      // Call applyFilters initially to set the initial totalResults
      this.applyFilters();
    });
  }
  // Method to create the filter form with form controls
  private createFilterForm() {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');

      if (column === 'enterance_Date' || column === 'departure_Date') {
        formControls[column] = new FormControl(null); // Initialize as null for date picker
      }
      if (column === 'answer_Text') {
        formControls[column] = new FormControl('');
        formControls[column + 'Options'] = new FormControl([]);
      }
    });

    formControls['pageSize'] = new FormControl(10);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');

    return this.fb.group(formControls);
  }
  // Method to apply filters based on form values

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter'].toLowerCase();

    this.filteredData = this.dataSource.filter(
      (item) =>
        this.columns.every((column) => {
          const value = String(item[column]).toLowerCase();

          if (column === 'enterance_Date' || column === 'departure_Date') {
            const dateValue = this.parseDate(item[column]);
            const filterDate = this.parseDate(filters[column]);

            return (
              !filterDate ||
              (dateValue && this.isDateInRange(dateValue, filterDate, column))
            );
          } else {
            return !filters[column] || value.includes(filters[column]);
          }
        }) &&
        (globalFilter === '' ||
          this.columns.some((column) =>
            String(item[column]).toLowerCase().includes(globalFilter)
          ))
    );
    // Sum up the values in the admission_No column
    const sumAdmissionNo = this.filteredData.reduce(
      (total, item) => total + (parseFloat(item.admission_No) || 0),
      0
    );
    // Update the totalResults and the title
    this.totalResults = this.filteredData.length;
    this.Title2 = `משה כללי - סה"כ מחלקות: ${this.totalResults}, סה"כ כמות מאושפזים: ${sumAdmissionNo}`;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    // Update the title with the total number of results
    //this.Title2 = ` משה כללי - סה"כ תוצאות: ${this.totalResults}`;
  }

  private isDateInRange(date: Date, filterDate: Date, column: string): boolean {
    if (column === 'enterance_Date') {
      return date >= filterDate;
    } else if (column === 'departure_Date') {
      return date <= filterDate;
    }
    return false;
  }

  exportToExcel() {
    // Assuming you have a method to convert the filtered data to Excel format
    const excelData = this.convertToExcelFormat(this.filteredData);

    // Create a Blob with the Excel data
    const blob = new Blob([excelData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Create a download link and trigger the download
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'filtered_data.xlsx';
    link.click();
  }

  // ...

  convertToExcelFormat(data: any[]) {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
  fetchAnswerTextOptions() {
    this.http.get<any[]>(environment.apiUrl + 'HostAPI').subscribe((data) => {
      // Extract distinct values from the 'answer_Text' column
      this.answerTextOptions = [...new Set(data.map((item) => item.name))];
      //console.log('Answer Text Options:', this.answerTextOptions);
    });
  }
  // Method to fetch options for 'answer_Text_Type' dropdown
  fetchAnswerTextTypeOptions() {
    // Fetch options specifically for 'answer_Text_Type'
    this.http.get<any[]>(environment.apiUrl + 'HostAPI').subscribe((data) => {
      this.answerTextTypeOptions = [
        ...new Set(data.map((item) => item.answer_Text_Type)),
      ];
    });
  }
  // Method to get a form control for a given column

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }
  fetchData() {
    this.http.get<any[]>(environment.apiUrl + 'HostAPI').subscribe((data) => {
      // Update your data source and apply filters if necessary
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource.data = this.filteredData;

      // Optional: Apply filters if needed
      this.applyFilters();
    });
  }
}
