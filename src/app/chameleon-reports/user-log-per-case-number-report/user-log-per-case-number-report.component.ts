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

  searchForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.searchForm = this.createSearchForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    // Apply global filter when the filter input changes
    this.searchForm.get('globalFilter')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  private createSearchForm(): FormGroup {
    return this.fb.group({
      AdmissionNo: new FormControl(''),
      IDNo: new FormControl(''),
      UserCode: new FormControl(''),
      globalFilter: new FormControl('')
    });
  }

  fetchData() {
    const admissionNo = this.searchForm.get('AdmissionNo')?.value;
    const idNo = this.searchForm.get('IDNo')?.value;
    const userCode = this.searchForm.get('UserCode')?.value;

    if (!admissionNo && !idNo && !userCode) {
      alert('אנא הזן לפחות אחד מהשדות לחיפוש');
      return;
    }

    // Build query parameters
    let params = new URLSearchParams();

    if (admissionNo) {
      params.append('admissionNo', admissionNo);
    }

    if (idNo) {
      params.append('idNo', idNo);
    }

    if (userCode) {
      params.append('userCode', userCode);
    }

    this.http.get<any[]>(`${environment.apiUrl}UserLogPerCaseNumber?${params.toString()}`).subscribe(data => {
      this.handleResponseData(data);
    }, error => {
      // Handle error
      console.error('Error fetching data:', error);
    });
  }

  private handleResponseData(data: any[]) {
    this.dataSource = data.map(item => ({
      ...item,
      MedicalLicense: item.MedicalLicense ? item.MedicalLicense : '', // Handle null MedicalLicense
      RecordOpenTime: item.RecordOpenTime ? new Date(`1970-01-01T${item.RecordOpenTime}`) : null // Convert RecordOpenTime to date
    }));

    this.filteredData = [...this.dataSource];
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
    this.applyFilters();
  }

  applyFilters() {
    const globalFilter = (this.searchForm.get('globalFilter')?.value || '').toLowerCase();

    if (globalFilter) {
      this.filteredData = this.dataSource.filter((item) => {
        return this.columns.some((column) => {
          const value = item[column];
          return value && String(value).toLowerCase().includes(globalFilter);
        });
      });
    } else {
      this.filteredData = [...this.dataSource];
    }

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  resetFilters() {
    this.searchForm.reset();
    this.filteredData = [...this.dataSource];
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
  }

  exportToExcel() {
    const dataToExport = this.filteredData.length ? this.filteredData : this.dataSource;

    if (dataToExport.length === 0) {
      alert('אין נתונים לייצוא');
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
