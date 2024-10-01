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

@Component({
  selector: 'app-user-log-per-case-number-report',
  templateUrl: './user-log-per-case-number-report.component.html',
  styleUrls: ['./user-log-per-case-number-report.component.scss']
})
export class UserLogPerCaseNumberReportComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'דוח לוגים על פי מספר מקרה';
  Title1: string = 'סה"כ תוצאות: ';
  Title2: string = '';
  showGraph: boolean = false;
  graphData: any[] = [];

  columns: string[] = [
    'AdmissionNo',
    'AnswerText10',
    'AnswerText398',
    'FirstName',
    'LastName',
    'IDNo',
    'MedicalLicense',
    'RecordName',
    'RecordOpenDate',
    'RecordOpenTime',
    'UnitName'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    // Initialize the form group in the constructor
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    // Fetch data on initialization
    this.http.get<any[]>(`${environment.apiUrl}UserLogPerCaseNumber`).subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      // Set up filters for each column
      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
      });

      // Watch for global filter changes
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });
    });
  }

  private createFilterForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['AdmissionNo'] = new FormControl(''); // Ensure AdmissionNo exists in form controls
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
    this.graphData = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'user_log_per_case_number.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }

  fetchData() {
    const admissionNo = this.filterForm.get('AdmissionNo')?.value;

    if (admissionNo) {
      this.http.get<any[]>(`${environment.apiUrl}UserLogPerCaseNumber/${admissionNo}`).subscribe((data) => {
        this.dataSource = data;
        this.matTableDataSource.data = data;
        this.totalResults = data.length;
      }, (error) => {
        console.error('Error fetching data:', error);
      });
    } else {
      alert('Please enter an Admission Number');
    }
  }
}
