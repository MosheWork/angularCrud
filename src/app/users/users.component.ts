import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import * as XLSX from 'xlsx';

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  Title1: string = 'רשימת משתמשים ';
  Title2: string = ' משה כללי';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  answerTextOptions: any[] = [];
  matTableDataSource: MatTableDataSource<any>; // Define MatTableDataSource

  columns: string[] = [
    // must be small letter on start to get  from back end
    'iD_No',
    'first_Name',
    'last_Name',
    //'sector',
    'login_Name',
    'answer_Text',
    'unit',
    //'profile_Code'
  ];

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
      iD_No: 'תעודת זהות',
      first_Name: ' שם פרטי',
      last_Name: 'שם משפחה ',
      //sector: 'סקטור',
      login_Name: 'שם משתמש',
      answer_Text: ' סקטור ',
      unit: ' הרשאה למחלקות ',
    };
    return columnLabels[column] || column;
  }

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }
  ngOnInit() {
    this.http
      .get<any[]>('http://localhost:7144/api/ChameleonAPI')
      .subscribe((data) => {
        //console.log('Received data:', data); // Log the data received from the API
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        this.columns.forEach((column) => {
          this.filterForm
            .get(column)
            ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(() => this.applyFilters());
        });
        this.fetchAnswerTextOptions();
        this.filterForm.valueChanges.subscribe(() => {
          this.applyFilters();
          this.paginator.firstPage();
        });

        // Call applyFilters initially to set the initial totalResults
        this.applyFilters();
      });
  }

  private createFilterForm() {
    const formControls: FormControls = {};

    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');

      if (column === 'enterance_Date' || column === 'departure_Date') {
        formControls[column] = new FormControl(null);
      }

      if (column === 'answer_Text') {
        formControls[column] = new FormControl('');
        formControls[column + 'Options'] = new FormControl([]);
      }
    });

    // Add a dummy control to handle potential null values
    //formControls['dummyControl'] = new FormControl('');

    formControls['pageSize'] = new FormControl(10);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');

    return this.fb.group(formControls);
  }

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

    //console.log('Filtered Data:', this.filteredData); // Log the filtered data

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;

    // Update the title with the total number of results
    this.Title2 = ` משה כללי - סה"כ תוצאות: ${this.totalResults}`;
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
    this.http
      .get<any[]>('http://localhost:7144/api/ChameleonAPI')
      .subscribe((data) => {
        // Extract distinct values from the 'answer_Text' column
        this.answerTextOptions = [
          ...new Set(data.map((item) => item.answer_Text)),
        ];
        console.log('Answer Text Options:', this.answerTextOptions);
      });
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }
}
