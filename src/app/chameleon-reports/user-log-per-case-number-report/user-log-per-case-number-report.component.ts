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
  showGraph: boolean = false;
  graphData: any[] = [];

  selectedFilter: string = 'admissionNo'; // Default filter option

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
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.filterForm.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.applyFilters(); // Apply filters when form values change
    });
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      AdmissionNo: new FormControl(''),
      IDNo: new FormControl(''), // Add IDNo field for filtering
      globalFilter: new FormControl('') // Global search field
    });
  }

  fetchData() {
    const admissionNo = this.filterForm.get('AdmissionNo')?.value;
    const idNo = this.filterForm.get('IDNo')?.value;

    if (this.selectedFilter === 'admissionNo' && admissionNo) {
      this.http.get<any[]>(`${environment.apiUrl}UserLogPerCaseNumber?admissionNo=${admissionNo}`).subscribe(data => {
        this.handleResponseData(data);
      });
    } else if (this.selectedFilter === 'idNo' && idNo) {
      this.http.get<any[]>(`${environment.apiUrl}UserLogPerCaseNumber?idNo=${idNo}`).subscribe(data => {
        this.handleResponseData(data);
      });
    } else {
      alert('Please enter a value for the selected filter');
    }
  }

  private handleResponseData(data: any[]) {
    this.dataSource = data.map(item => ({
      ...item,
      MedicalLicense: item.MedicalLicense ? item.MedicalLicense : '', // Handle null MedicalLicense
      RecordOpenTime: new Date(`1970-01-01T${item.RecordOpenTime}`) // Convert RecordOpenTime to date
    }));

    this.filteredData = [...this.dataSource];
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
    this.applyFilters();
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();

    this.filteredData = this.dataSource.filter((item) => {
      return this.columns.some((column) => {
        const value = item[column];
        return String(value).toLowerCase().includes(globalFilter);
      });
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filteredData = [...this.dataSource];
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
  }

  exportToExcel() {
    const dataToExport = this.filteredData.length ? this.filteredData : this.dataSource;

    if (dataToExport.length === 0) {
      alert('No data available for export');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'user_log_per_case_number.xlsx';
    link.click();
  }
}
