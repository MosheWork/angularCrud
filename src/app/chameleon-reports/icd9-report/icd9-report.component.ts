import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-icd9-report',
  templateUrl: './icd9-report.component.html',
  styleUrls: ['./icd9-report.component.scss']
})
export class Icd9ReportComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'ICD9 Report';
  Title1: string = 'Total Results: ';
  Title2: string = '';

  columns: string[] = [
    'ICD9',
    'Name',
    'Admission_No',
    'First_Name',
    'Last_Name',
    'Id_Num',
    'Entry_Date'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;
  icd9Code: FormControl;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.icd9Code = new FormControl(''); // Single input for ICD9 code

  }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/ICD9`).subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
      });

      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });

      this.applyFilters();
    });
  }

  private createFilterForm(): FormGroup {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];

        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;

        return (!filterString || stringValue.includes(filterString)) &&
               (!globalFilter || this.columns.some((col) => String(item[col]).toLowerCase().includes(globalFilter)));
      })
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      ICD9: 'ICD9 Code',
      name: 'Procedure Name',
      admission_No: 'Admission Number',
      First_Name: 'First Name',
      Last_Name: 'Last Name',
      Id_Num: 'ID Number',
      Entry_Date: 'Entry Date'
    };
    return columnLabels[column] || column;
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'icd9_report.xlsx';
    link.click();
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }

   // Fetch data based on the ICD9 code entered
   fetchIcd9Data() {
    console.log("Button clicked, fetching data...");
  
    const icd9Codes = this.icd9Code.value;
  
    if (!icd9Codes) {
      console.error('Please enter an ICD9 code.');
      return;
    }
  
    // Handle newlines, spaces, and commas in the pasted input
    const icd9Array = icd9Codes
      .split(/[\s,]+/)  // Split by spaces, newlines, and commas
      .map((code: string) => code.trim())  // Trim each code to remove extra spaces
      .filter((code: string) => code.length > 0);  // Remove any empty values
  
    // Check if icd9Array is not empty
    if (icd9Array.length === 0) {
      console.error('No valid ICD9 codes found.');
      return;
    }
  
    console.log("ICD9 Codes to be sent:", icd9Array);  // Debugging
  
    // Make the API call
    this.http.get<any[]>(`${environment.apiUrl}/ICD9`, { params: { icd9Codes: icd9Array } })
      .subscribe((data) => {
        console.log("Data received:", data);  // Debugging
        this.dataSource = data;
        this.matTableDataSource = new MatTableDataSource(this.dataSource);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
      }, error => {
        console.error('Error fetching ICD9 data:', error);
      });
  }
  
}
