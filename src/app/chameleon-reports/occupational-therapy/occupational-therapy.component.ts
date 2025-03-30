// 🔧 Updated component code for OccupationalTherapyComponent
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 },
  ];

  anamnesisResultsDataSource = new MatTableDataSource<any>([]);
  fullListDataSource = new MatTableDataSource<any>([]);

  anamnesisResultsColumns: string[] = ['EmployeeName', 'Simple', 'Complex', 'VeryComplex'];
  fullListColumns: string[] = ['AdmissionNo', 'IdNum', 'FirstName', 'LastName', 'EmployeeName', 'Entry_Date', 'AnswerType'];

  columnDisplayNames2: { [key: string]: string } = {
    'EmployeeName': 'שם עובד',
    'Simple': 'טיפול פשוט',
    'Complex': 'טיפול מורכב',
    'VeryComplex': 'טיפול קבוצתי'
  };

  columnDisplayNames: { [key: string]: string } = {
    AdmissionNo: 'מספר מקרה',
    IdNum: 'מספר זהות',
    FirstName: 'שם פרטי',
    LastName: 'שם משפחה',
    EmployeeName: 'שם העובד',
    Entry_Date: 'תאריך כניסה',
    AnswerType: 'סוג תשובה'
  
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
    const filters = this.filterForm.value;
    const year = filters.year;
    const month = filters.month;

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

    this.http.get<any[]>(`${environment.apiUrl}OccupationalTherapy/Summary`, { params }).subscribe(data => {
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
    this.exportToExcel(this.anamnesisResultsDataSource, 'Occupational_Therapy_Summary.xlsx');
  }

  exportFullListToExcel(): void {
    this.exportToExcel(this.fullListDataSource, 'Occupational_Therapy_Details.xlsx');
  }

  private exportToExcel(dataSource: MatTableDataSource<any>, fileName: string): void {
    const data = dataSource.data;
    const transformedData = data.map(row => {
      let newRow: any = {};
      Object.keys(row).forEach(key => {
        const hebrewKey = this.columnDisplayNames[key] || this.columnDisplayNames2[key] || key;
        newRow[hebrewKey] = row[key];
      });
      return newRow;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);
    worksheet['!cols'] = [{ width: 20 }];
    worksheet['!dir'] = 'rtl';

    const workbook: XLSX.WorkBook = {
      Sheets: { 'נתונים': worksheet },
      SheetNames: ['נתונים']
    };

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