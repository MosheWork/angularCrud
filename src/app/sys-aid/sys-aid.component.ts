import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router'; // Import the Router
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment'
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';


interface FormControls {
  [key: string]: FormControl;
}
@Component({
  selector: 'app-sys-aid',
  templateUrl: './sys-aid.component.html',
  styleUrls: ['./sys-aid.component.scss'],
})
export class SysAidComponent implements OnInit {
  // Properties for titles, data sources, options, and more
  filteredResponsibilities: Observable<string[]> | undefined;
  showGraph: boolean = false;
  Title1: string = '  רשימת קריאות  - ';
  Title2: string = 'סה"כ תוצאות   ';
  titleUnit: string = 'SysAid ';
  totalResults: number = 0;

  // ViewChild decorators for accessing Angular Material components

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Form group for filtering controls

  filterForm: FormGroup;

  // Arrays to store data and options for dropdowns

  graphData!: any[]; // Using non-null assertion operator

  dataSource: any[] = [];
  filteredData: any[] = [];
  answerTextOptions: any[] = [];
  answerTextTypeOptions: any[] = []; // New array for 'answer_Text_Type'

  // MatTableDataSource for Angular Material table

  matTableDataSource: MatTableDataSource<any>; // Define MatTableDataSource

  // Column names for the table

  columns: string[] = [
    'id',
    'assigned_group',
    'problem_type',
    'problem_sub_type',
    'third_level_category',
    'title',
    'description',
    'status',
    'responsibility',
    'insert_time',
    'update_time',

    // 'departure_Date',
  ];
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
    // this.Title2 = ` ${this.totalResults}`;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }
  // Method to get display-friendly column labels

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      id: 'id',
      assigned_group: ' קבוצה אחראית ',
      problem_type: ' קטגוריה 1',
      problem_sub_type: 'קטגוריה 2',
      title: 'כותרת הקריאה',
      description: 'פירוט הקריאה',
      status: 'סטטוס',
      responsibility: ' אחראי על הקריאה',
      insert_time: ' זמן פתיחת הקריאה',
      update_time: 'זמן סגירת הקריאה',
      third_level_category: ' קטגוריה 3   ',
      //  login_Name: 'שם משתמש',
    };
    return columnLabels[column] || column;
  }

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private datePipe: DatePipe // Inject DatePipe
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.graphData = []; // Initialize graphData in the constructor
  }
  
  // OnInit lifecycle hook

  ngOnInit() {
    // Fetch data from the API when the component initializes

    this.http.get<any[]>(environment.apiUrl + 'SysAidAPI').subscribe((data) => {
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
    this.filteredResponsibilities = this.getFormControl(
      'responsibility'
    ).valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value)),
      tap((filteredValues) => console.log('Filtered Values:', filteredValues))
    );
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const filteredOptions = this.answerTextTypeOptions.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
    console.log('Filtered Options:', filteredOptions);
    return filteredOptions;
  }
  // Method to create the filter form with form controls
  private createFilterForm() {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      if (column === 'responsibility') {
        formControls[column] = new FormControl([]); // Initialize as an empty array for multiple selection
      } else formControls[column] = new FormControl('');

      if (column === 'insert_time' || column === 'update_time') {
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
          let value = String(item[column]).toLowerCase();
  
          if (column === 'insert_time' || column === 'update_time') {
            const dateValue = this.parseDate(item[column]);
            const filterDate = this.parseDate(filters[column]);
  
            if (dateValue) {
              value = this.datePipe.transform(dateValue, 'yyyy-MM-dd HH:mm:ss') || value;
            }
  
            return (
              !filterDate ||
              (dateValue && this.isDateInRange(dateValue, filterDate, column))
            );
          } else if (column === 'name') {
            const selectedValue = filters[column];
            return (
              !selectedValue ||
              String(item[column]).toLowerCase() ===
                String(selectedValue).toLowerCase()
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
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  
    this.graphData = this.filteredData;
    // Update graphData with the filtered data
    console.log(this.graphData);
  }
  

  // Method to check if a date is in a specified range
  private isDateInRange(date: Date, filterDate: Date, column: string): boolean {
    if (column === 'insert_time') {
      return date >= filterDate;
    } else if (column === 'update_time') {
      return date <= filterDate;
    }
    return false;
  }

  // Method to export filtered data to Excel
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

  // Method to convert data to Excel format

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
  // Method to fetch options for 'answer_Text' dropdown

  fetchAnswerTextOptions() {
    this.http.get<any[]>(environment.apiUrl + 'SysAidAPI').subscribe((data) => {
      // Extract distinct values from the 'answer_Text' column
      this.answerTextOptions = [...new Set(data.map((item) => item.status))];
      //console.log('Answer Text Options:', this.answerTextOptions);
    });
  }
  // Method to fetch options for 'answer_Text_Type' dropdown
  fetchAnswerTextTypeOptions() {
    this.http.get<any[]>(environment.apiUrl + 'SysAidAPI').subscribe((data) => {
      /// debugger;
      // this.answerTextTypeOptions = [
      //   ...new Set(data.map((item) => item.responsibility)),
      // ];
      this.answerTextTypeOptions = [];
      data.forEach((item: any) => {
        if (
          this.answerTextTypeOptions.indexOf(item.responsibility) < 0 &&
          item.responsibility
        ) {
          this.answerTextTypeOptions.push(item.responsibility);
        }
      });
      console.log('Responsibility Options:', this.answerTextTypeOptions);
    });
  }
  // Method to get a form control for a given column

  getFormControl(column: string): FormControl {
    if (column == 'responsibility') {
      // debugger;
    }
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }
  // MedicalDevicesComponent class
  navigateToGraphPage() {
    this.showGraph = !this.showGraph; // Toggle the state
  }
  goToHome() {
    this.router.navigate(['/MainPageReports']); // replace '/home' with your desired route
  }
}
