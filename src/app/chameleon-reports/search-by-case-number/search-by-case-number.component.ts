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
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-search-by-case-number',
  templateUrl: './search-by-case-number.component.html',
  styleUrls: ['./search-by-case-number.component.scss']
})
export class SearchByCaseNumberComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'חיפוש על פי מספרי מקרה-מחלקה משחררת';
  Title1: string = 'סה"כ תוצאות: ';
  Title2: string = '';

  columns: string[] = ['PMCaseNumber', 'PMMoveDate',  'DepartName'];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;
  caseNumbersControl: FormControl;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar // Add MatSnackBar here
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.caseNumbersControl = new FormControl('');
  }
  
  ngOnInit() {
    this.fetchCaseNumberData();  // Fetch data when the component initializes
    this.setupFormValueChanges();  // Set up dynamic filtering on value changes
  }

  // Fetch data based on the case numbers entered
  fetchCaseNumberData() {
    const caseNumbers = this.caseNumbersControl.value;
  
    if (!caseNumbers) {
      console.error('Please enter case numbers.');
      return;
    }
  
    const caseNumbersArray = caseNumbers.split(/[\s,]+/)
      .map((code: string) => code.trim())
      .filter((code: string) => code.length > 0)
      .map((code: string) => code.startsWith('00') ? code : '00' + code); // Add '00' if missing
  
    // Check if the number of case numbers exceeds 75
    if (caseNumbersArray.length > 75) {
      this.snackBar.open('You can enter a maximum of 75 case numbers.', 'Close', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return; // Prevent the request from being sent
    }
  
    if (caseNumbersArray.length === 0) {
      console.error('No valid case numbers found.');
      return;
    }
  
    // API call to fetch data
    this.http.get<any[]>(`${environment.apiUrl}SearchByCaseNumber/latestRecords`, { params: { caseNumbers: caseNumbersArray } })
      .subscribe((data) => {
        // Remove '00' prefix from PMCaseNumber in each item
        this.dataSource = data.map(item => ({
          ...item,
          PMCaseNumber: item.PMCaseNumber.startsWith('00') ? item.PMCaseNumber.slice(2) : item.PMCaseNumber
        }));
        
        this.filteredData = [...this.dataSource];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.applyFilters();  // Apply initial filters
      }, error => {
        console.error('Error fetching data:', error);
      });
  }
  
  
  
  

  // Create form group with global filter and column-specific filters
  createFilterForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl(''); // Add form controls for each column
    });
    formControls['globalFilter'] = new FormControl(''); // Add global filter form control

    return this.fb.group({
      globalFilter: [''],
      startDischargeDate: [''],  // Form control for start date
      endDischargeDate: [''],    // Form control for end date
    });
  }

  // Set up form control value changes to trigger filtering
  setupFormValueChanges() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();  // Reset to first page after filtering
      });
  }

  // Apply global and column-specific filters
  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
    const startDischargeDate = filters['startDischargeDate'] ? new Date(filters['startDischargeDate']) : null;
    const endDischargeDate = filters['endDischargeDate'] ? new Date(filters['endDischargeDate']) : null;
  
    this.filteredData = this.dataSource.filter((item) => {
      const globalMatch = this.columns.some((column) => {
        const value = (item[column] || '').toString().toLowerCase();
        return value.includes(globalFilter);
      });
  
      // Date filter: check if DischargeDate is within range
      let dateMatch = true;  // Default to true if no date range provided
      if (startDischargeDate || endDischargeDate) {
        const dischargeDate = new Date(item.PMDischargeDate);
        if (startDischargeDate && dischargeDate < startDischargeDate) {
          dateMatch = false;
        }
        if (endDischargeDate && dischargeDate > endDischargeDate) {
          dateMatch = false;
        }
      }
  
      return (globalFilter === '' || globalMatch) && dateMatch;
    });
  
    // Update total results and table
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  
    console.log('Filtered Data:', this.filteredData);
  }

  resetFilters() {
    this.filterForm.reset(); // Reset all form controls
    this.caseNumbersControl.reset(); // Reset the case numbers input
    this.applyFilters(); // Reapply filters after reset
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'case_number_report.xlsx';
    link.click();
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
