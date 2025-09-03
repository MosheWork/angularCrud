import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-physiotherapy',
  templateUrl: './physiotherapy.component.html',
  styleUrls: ['./physiotherapy.component.scss']
})
export class PhysiotherapyComponent implements OnInit {
  loading = false;

  filterForm: FormGroup;
  availableYears: number[] = [2023, 2024, 2025];
  months = [
    { name: 'ינואר', value: 1 },
    { name: 'פברואר', value: 2 },
    { name: 'מרץ', value: 3 },
    { name: 'אפריל', value: 4 },
    { name: 'מאי', value: 5 },
    { name: 'יוני', value: 6 },
    { name: 'יולי', value: 7 },
    { name: 'אוגוסט', value: 8 },
    { name: 'ספטמבר', value: 9 },
    { name: 'אוקטובר', value: 10 },
    { name: 'נובמבר', value: 11 },
    { name: 'דצמבר', value: 12 }
  ];

  totalUniquePatientDays: number = 0;

  anamnesisResultsDataSource = new MatTableDataSource<any>([]);
  fullListDataSource = new MatTableDataSource<any>([]);

  // ⬇️ keys changed: first letter is lowercase
  anamnesisResultsColumns: string[] = [
    'iD_No',       // was ID_No
    'first_Name',  // was First_Name
    'last_Name',   // was Last_Name
    'simple',      // was Simple
    'complex',     // was Complex
    'group',       // was Group
    'session'      // was Session
  ];

  // ⬇️ keys changed: first letter is lowercase
  fullListColumns: string[] = [
    'admissionNo',   // was AdmissionNo
    'idNum',         // was IdNum
    'firstName',     // was FirstName
    'lastName',      // was LastName
    'employeeName',  // was EmployeeName
    'entry_Date',    // was Entry_Date
    'answerType'     // was AnswerType
  ];

  // ⬇️ display names now keyed by the new (lower-first) field names
  columnDisplayNames2: { [key: string]: string } = {
    iD_No: ' ת"ז',
    first_Name: 'שם פרטי',
    last_Name: 'שם משפחה',
    simple: 'טיפול פשוט',
    complex: 'טיפול מורכב',
    group: 'טיפול קבוצתי',
    session: 'ססיה'
  };

  columnDisplayNames: { [key: string]: string } = {
    admissionNo: 'מספר מקרה',
    idNum: 'מספר זהות',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    employeeName: 'שם העובד',
    entry_Date: 'תאריך כניסה',
    answerType: 'סוג תשובה'
  };

  @ViewChild('anamnesisResultsPaginator') anamnesisResultsPaginator!: MatPaginator;
  @ViewChild('anamnesisResultsSort') anamnesisResultsSort!: MatSort;

  @ViewChild('fullListPaginator') fullListPaginator!: MatPaginator;
  @ViewChild('fullListSort') fullListSort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      year: new FormControl(new Date().getFullYear()),
      month: new FormControl(null)
    });
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const { year, month } = this.filterForm.value;
    this.fetchAnamnesisResultsData(year, month);
    this.fetchFullListData(year, month);
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: null,
    });
    this.applyFilters();
  }

  fetchAnamnesisResultsData(year?: number, month?: number): void {
    this.loading = true;
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http.get<any[]>(`${environment.apiUrl}Physiotherapy/Summary`, { params }).subscribe(data => {
      // data is expected to already have lower-first keys
      this.anamnesisResultsDataSource.data = data;

      setTimeout(() => {
        this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
        this.anamnesisResultsDataSource.sort = this.anamnesisResultsSort;
      });

      this.loading = false;
    });
  }

  fetchFullListData(year?: number, month?: number): void {
    this.loading = true;
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http.get<any[]>(`${environment.apiUrl}Physiotherapy/Detailed`, { params }).subscribe(data => {
      // data is expected to already have lower-first keys
      this.fullListDataSource.data = data;

      if (this.fullListPaginator) {
        this.fullListDataSource.paginator = this.fullListPaginator;
      }
      if (this.fullListSort) {
        this.fullListDataSource.sort = this.fullListSort;
      }
      this.loading = false;
    });
  }

  exportAnamnesisResultsToExcel(): void {
    this.exportToExcel(this.anamnesisResultsDataSource, 'Physiotherapy_Summary.xlsx');
  }

  exportFullListToExcel(): void {
    this.exportToExcel(this.fullListDataSource, 'Physiotherapy_Details.xlsx');
  }

  private exportToExcel(dataSource: MatTableDataSource<any>, fileName: string): void {
    const data = dataSource.data;

    // merged display map
    const displayMap: { [key: string]: string } = {
      ...this.columnDisplayNames,
      ...this.columnDisplayNames2
    };

    const transformed = data.map(row => {
      const out: any = {};
      Object.keys(row).forEach(k => {
        out[displayMap[k] || k] = row[k];
      });
      return out;
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformed);
    ws['!cols'] = [{ width: 20 }];
    (ws as any)['!dir'] = 'rtl';

    const wb: XLSX.WorkBook = { Sheets: { 'נתונים': ws }, SheetNames: ['נתונים'] };
    XLSX.writeFile(wb, fileName);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
      this.anamnesisResultsDataSource.sort = this.anamnesisResultsSort;

      this.fullListDataSource.paginator = this.fullListPaginator;
      this.fullListDataSource.sort = this.fullListSort;
    });
  }
}
