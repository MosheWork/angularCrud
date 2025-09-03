// occupational-therapy.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-occupational-therapy',
  templateUrl: './occupational-therapy.component.html',
  styleUrls: ['./occupational-therapy.component.scss']
})
export class OccupationalTherapyComponent implements OnInit {
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

  // ⬇️ lower-first keys
  anamnesisResultsColumns: string[] = ['employeeName', 'simple', 'complex', 'group'];
  fullListColumns: string[] = ['admissionNo', 'idNum', 'firstName', 'lastName', 'employeeName', 'entry_Date', 'answerType'];

  // ⬇️ display maps keyed by the new lower-first names
  columnDisplayNames2: { [key: string]: string } = {
    employeeName: 'שם עובד',
    simple: 'טיפול פשוט',
    complex: 'טיפול מורכב',
    group: 'טיפול קבוצתי'
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
    this.fetchUniquePatientDays(year, month);
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: null
    });
    this.applyFilters();
  }

  fetchUniquePatientDays(year?: number, month?: number): void {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http
      .get<{ TotalUniquePatientDays: number }>(`${environment.apiUrl}OccupationalTherapy/CountUniquePatientDays`, { params })
      .subscribe(
        res => (this.totalUniquePatientDays = res.TotalUniquePatientDays),
        err => console.error('Error fetching unique patient days:', err)
      );
  }

  fetchAnamnesisResultsData(year?: number, month?: number): void {
    this.loading = true;
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http.get<any[]>(`${environment.apiUrl}OccupationalTherapy/Summary`, { params }).subscribe(data => {
      // expecting lower-first keys coming from backend
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

    this.http.get<any[]>(`${environment.apiUrl}OccupationalTherapy/Detailed`, { params }).subscribe(data => {
      // expecting lower-first keys coming from backend
      this.fullListDataSource.data = data;
      if (this.fullListPaginator) this.fullListDataSource.paginator = this.fullListPaginator;
      if (this.fullListSort) this.fullListDataSource.sort = this.fullListSort;
      this.loading = false;
    });
  }

  exportAnamnesisResultsToExcel(): void {
    this.exportToExcel(this.anamnesisResultsDataSource, 'Occupational_Therapy_Summary.xlsx');
  }

  exportFullListToExcel(): void {
    this.exportToExcel(this.fullListDataSource, 'Occupational_Therapy_Details.xlsx');
  }

  private exportToExcel(dataSource: MatTableDataSource<any>, fileName: string): void {
    const data = dataSource.data;

    // merged display map for both tables (lower-first keys)
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

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformed);
    worksheet['!cols'] = [{ width: 20 }];
    (worksheet as any)['!dir'] = 'rtl';

    const workbook: XLSX.WorkBook = { Sheets: { 'נתונים': worksheet }, SheetNames: ['נתונים'] };
    XLSX.writeFile(workbook, fileName);
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
