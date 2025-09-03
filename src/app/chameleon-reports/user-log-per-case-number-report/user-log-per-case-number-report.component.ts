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
import { Observable, of } from 'rxjs';

interface UserAutocompleteModel {
  code: number;
  displayName: string;
}

@Component({
  selector: 'app-user-log-per-case-number-report',
  templateUrl: './user-log-per-case-number-report.component.html',
  styleUrls: ['./user-log-per-case-number-report.component.scss']
})
export class UserLogPerCaseNumberReportComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'בטיחות הטיפול - לוגים קמיליון ';
  Title1: string = 'סה"כ תוצאות: ';
  showGraph: boolean = false;
  graphData: any[] = [];

  // 🔑 lower-first columns
  columns: string[] = [
    'admissionNo',
    'answerText10',
    'answerText398',
    'firstName',
    'lastName',
    'idNo',
    'medicalLicense',
    'recordName',
    'recordOpenDate',
    'recordOpenTime',
    'unitName'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  searchForm: FormGroup;
  userCodeControl = new FormControl();
  allUsers: UserAutocompleteModel[] = [];
  filteredUserOptions: UserAutocompleteModel[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.searchForm = this.createSearchForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    // global filter
    this.searchForm.get('globalFilter')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());

    // date range filters
    this.searchForm.get('startDate')?.valueChanges.subscribe(() => this.applyFilters());
    this.searchForm.get('endDate')?.valueChanges.subscribe(() => this.applyFilters());

    // fetch users for autocomplete
    this.fetchAllUsers();

    // autocomplete filtering
    this.userCodeControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {
        if (typeof value === 'string') {
          const filterValue = value.toLowerCase();
          this.filteredUserOptions = this.allUsers.filter(option =>
            option.displayName.toLowerCase().includes(filterValue)
          );
        } else {
          this.filteredUserOptions = this.allUsers;
        }
      });
  }

  private fetchAllUsers() {
    this.http.get<UserAutocompleteModel[]>(`${environment.apiUrl}UserLogPerCaseNumber/GetAllUsers`)
      .subscribe(users => {
        this.allUsers = users || [];
        this.filteredUserOptions = this.allUsers;
      }, error => {
        console.error('Error fetching users:', error);
      });
  }

  private createSearchForm(): FormGroup {
    return this.fb.group({
      admissionNo: new FormControl(''),
      idNo: new FormControl(''),
      // userCode handled via userCodeControl
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      globalFilter: new FormControl('')
    });
  }

  fetchData() {
    const admissionNo = this.searchForm.get('admissionNo')?.value;
    const idNo = this.searchForm.get('idNo')?.value;
    let userCode: number | null = null;

    const selectedUser = this.userCodeControl.value;

    if (selectedUser && typeof selectedUser === 'object' && selectedUser.code) {
      userCode = selectedUser.code;
    } else if (selectedUser && typeof selectedUser === 'string') {
      alert('אנא בחר משתמש מהרשימה');
      return;
    }

    if (!admissionNo && !idNo && !userCode) {
      alert('אנא הזן לפחות אחד מהשדות לחיפוש');
      return;
    }

    const params = new URLSearchParams();
    if (admissionNo) params.append('admissionNo', admissionNo);
    if (idNo) params.append('idNo', idNo);
    if (userCode !== null) params.append('userCode', String(userCode));

    this.http.get<any[]>(`${environment.apiUrl}UserLogPerCaseNumber?${params.toString()}`)
      .subscribe(data => this.handleResponseData(data),
        error => console.error('Error fetching data:', error));
  }

  displayUser(user: UserAutocompleteModel): string {
    return user && user.displayName ? user.displayName : '';
  }

  private handleResponseData(data: any[]) {
    // Expecting lower-first keys from backend
    this.dataSource = (data || []).map(item => ({
      ...item,
      medicalLicense: item.medicalLicense ?? '',
      recordOpenTime: item.recordOpenTime ? new Date(`1970-01-01T${item.recordOpenTime}`) : null,
      recordOpenDate: item.recordOpenDate ? new Date(item.recordOpenDate) : null
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
    const startDate: Date | null = this.searchForm.get('startDate')?.value;
    const endDate: Date | null = this.searchForm.get('endDate')?.value;

    this.filteredData = this.dataSource.filter((item) => {
      let matchesGlobalFilter = true;
      let matchesDateRangeFilter = true;

      if (globalFilter) {
        matchesGlobalFilter = this.columns.some((column) => {
          const value = item[column];
          return value && String(value).toLowerCase().includes(globalFilter);
        });
      }

      if (startDate || endDate) {
        const itemDate: Date | null = item.recordOpenDate;
        if (itemDate) {
          if (startDate && endDate) {
            matchesDateRangeFilter = itemDate >= startDate && itemDate <= endDate;
          } else if (startDate) {
            matchesDateRangeFilter = itemDate >= startDate;
          } else if (endDate) {
            matchesDateRangeFilter = itemDate <= endDate;
          }
        } else {
          matchesDateRangeFilter = false;
        }
      }

      return matchesGlobalFilter && matchesDateRangeFilter;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  resetFilters() {
    this.searchForm.reset();
    this.userCodeControl.reset();
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
