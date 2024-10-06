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
  Code: number;
  DisplayName: string;
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
    // Apply global filter when the filter input changes
    this.searchForm.get('globalFilter')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });

    // Apply date range filter when the date pickers value changes
    this.searchForm.get('StartDate')?.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    this.searchForm.get('EndDate')?.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Fetch all users for the autocomplete
    this.fetchAllUsers();

    // Initialize autocomplete options for UserCode
    this.userCodeControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        this.filteredUserOptions = this.allUsers.filter(option =>
          option.DisplayName.toLowerCase().includes(filterValue)
        );
      } else {
        this.filteredUserOptions = this.allUsers;
      }
    });
  }

  private fetchAllUsers() {
    this.http.get<UserAutocompleteModel[]>(`${environment.apiUrl}UserLogPerCaseNumber/GetAllUsers`).subscribe(users => {
      this.allUsers = users;
      this.filteredUserOptions = this.allUsers;
    }, error => {
      console.error('Error fetching users:', error);
    });
  }

  private createSearchForm(): FormGroup {
    return this.fb.group({
      AdmissionNo: new FormControl(''),
      IDNo: new FormControl(''),
      // Removed 'UserCode' from the form group
      StartDate: new FormControl(null),
      EndDate: new FormControl(null),
      globalFilter: new FormControl('')
    });
  }

  fetchData() {
    const admissionNo = this.searchForm.get('AdmissionNo')?.value;
    const idNo = this.searchForm.get('IDNo')?.value;
    let userCode = null;
    const selectedUser = this.userCodeControl.value;

    if (selectedUser && typeof selectedUser === 'object' && selectedUser.Code) {
      userCode = selectedUser.Code;
    } else if (selectedUser && typeof selectedUser === 'string') {
      // The user typed something manually; prompt them to select from the list
      alert('אנא בחר משתמש מהרשימה');
      return;
    }

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
      params.append('userCode', userCode.toString());
    }

    this.http.get<any[]>(`${environment.apiUrl}UserLogPerCaseNumber?${params.toString()}`).subscribe(data => {
      this.handleResponseData(data);
    }, error => {
      // Handle error
      console.error('Error fetching data:', error);
    });
  }

  displayUser(user: UserAutocompleteModel): string {
    return user && user.DisplayName ? user.DisplayName : '';
  }

  private handleResponseData(data: any[]) {
    this.dataSource = data.map(item => ({
      ...item,
      MedicalLicense: item.MedicalLicense ? item.MedicalLicense : '', // Handle null MedicalLicense
      RecordOpenTime: item.RecordOpenTime ? new Date(`1970-01-01T${item.RecordOpenTime}`) : null, // Convert RecordOpenTime to Date object
      RecordOpenDate: item.RecordOpenDate ? new Date(item.RecordOpenDate) : null // Ensure RecordOpenDate is a Date object
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
    const startDate: Date | null = this.searchForm.get('StartDate')?.value;
    const endDate: Date | null = this.searchForm.get('EndDate')?.value;

    this.filteredData = this.dataSource.filter((item) => {
      let matchesGlobalFilter = true;
      let matchesDateRangeFilter = true;

      // Apply global text filter
      if (globalFilter) {
        matchesGlobalFilter = this.columns.some((column) => {
          const value = item[column];
          return value && String(value).toLowerCase().includes(globalFilter);
        });
      }

      // Apply date range filter
      if (startDate || endDate) {
        const itemDate = item.RecordOpenDate;
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
    this.userCodeControl.reset(); // Reset the userCodeControl as well
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
