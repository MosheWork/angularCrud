import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-nutritionist-report',
  templateUrl: './nutritionist-report.component.html',
  styleUrls: ['./nutritionist-report.component.scss']
})
export class NutritionistReportComponent implements OnInit, AfterViewInit {
  loading = false;

  filterForm: FormGroup;
  availableYears: number[] = [2023, 2024, 2025];
  months = [
    { name: 'ינואר', value: 1 }, { name: 'פברואר', value: 2 }, { name: 'מרץ', value: 3 },
    { name: 'אפריל', value: 4 }, { name: 'מאי', value: 5 }, { name: 'יוני', value: 6 },
    { name: 'יולי', value: 7 }, { name: 'אוגוסט', value: 8 }, { name: 'ספטמבר', value: 9 },
    { name: 'אוקטובר', value: 10 }, { name: 'נובמבר', value: 11 }, { name: 'דצמבר', value: 12 }
  ];

  summaryDataSource = new MatTableDataSource<any>([]);
  detailedDataSource = new MatTableDataSource<any>([]);

  // 🔻 columns use lower-first keys
  summaryColumns: string[] = ['employeeName', 'simple', 'complex', 'veryComplex', 'team'];
  detailedColumns: string[] = ['admissionNo', 'idNum', 'firstName', 'lastName', 'employeeName', 'entry_Date', 'answerType'];

  // 🔻 display maps use the same lower-first keys
  columnDisplayNamesSummary: { [key: string]: string } = {
    employeeName: 'שם עובד',
    simple: 'טיפול פשוט',
    complex: 'טיפול מורכב',
    veryComplex: 'טיפול מורכב מאוד',
    team: 'טיפול קבוצתי'
  };

  columnDisplayNamesDetail: { [key: string]: string } = {
    admissionNo: 'מספר מקרה',
    idNum: 'מספר זהות',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    employeeName: 'שם העובד',
    entry_Date: 'תאריך כניסה',
    answerType: 'סוג תשובה'
  };

  columnDisplayNames: { [key: string]: string } = {};

  @ViewChild('summaryPaginator') summaryPaginator!: MatPaginator;
  @ViewChild('summarySort') summarySort!: MatSort;

  @ViewChild('detailedPaginator') detailedPaginator!: MatPaginator;
  @ViewChild('detailedSort') detailedSort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      year: new FormControl(new Date().getFullYear()),
      month: new FormControl(null)
    });

    this.columnDisplayNames = {
      ...this.columnDisplayNamesSummary,
      ...this.columnDisplayNamesDetail
    };
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.summaryPaginator && this.summarySort) {
        this.summaryDataSource.paginator = this.summaryPaginator;
        this.summaryDataSource.sort = this.summarySort;
      }
      if (this.detailedPaginator && this.detailedSort) {
        this.detailedDataSource.paginator = this.detailedPaginator;
        this.detailedDataSource.sort = this.detailedSort;
      }
    });
  }

  applyFilters(): void {
    const { year, month } = this.filterForm.value;
    this.fetchSummaryData(year, month);
    this.fetchDetailedData(year, month);
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: null
    });
    this.applyFilters();
  }

  // 🔻 GET + normalize keys inline (first letter -> lower)
  fetchSummaryData(year?: number, month?: number): void {
    this.loading = true;
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http.get<any[]>(`${environment.apiUrl}Nutritionist/Summary`, { params })
      .subscribe(data => {
        const normalized = (data || []).map((row: any) =>
          Object.entries(row).reduce((acc: any, [k, v]) => {
            const nk = k ? k.charAt(0).toLowerCase() + k.slice(1) : k;
            acc[nk] = v;
            return acc;
          }, {})
        );
        this.summaryDataSource.data = normalized;

        setTimeout(() => {
          this.summaryDataSource.paginator = this.summaryPaginator;
          this.summaryDataSource.sort = this.summarySort;
        });
        this.loading = false;
      }, _ => this.loading = false);
  }

  // 🔻 GET + normalize keys inline (first letter -> lower)
  fetchDetailedData(year?: number, month?: number): void {
    this.loading = true;
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http.get<any[]>(`${environment.apiUrl}Nutritionist/Detailed`, { params })
      .subscribe(data => {
        const normalized = (data || []).map((row: any) =>
          Object.entries(row).reduce((acc: any, [k, v]) => {
            const nk = k ? k.charAt(0).toLowerCase() + k.slice(1) : k;
            acc[nk] = v;
            return acc;
          }, {})
        );
        this.detailedDataSource.data = normalized;

        this.detailedDataSource.paginator = this.detailedPaginator;
        this.detailedDataSource.sort = this.detailedSort;
        this.loading = false;
      }, _ => this.loading = false);
  }

  exportSummaryToExcel(): void {
    this.exportToExcel(this.summaryDataSource, 'Nutritionist_Summary.xlsx', this.columnDisplayNamesSummary);
  }

  exportDetailedToExcel(): void {
    this.exportToExcel(this.detailedDataSource, 'Nutritionist_Details.xlsx', this.columnDisplayNamesDetail);
  }

  private exportToExcel(
    dataSource: MatTableDataSource<any>,
    fileName: string,
    displayMap: { [key: string]: string }
  ): void {
    const data = dataSource.data.map(row => {
      const transformed: any = {};
      Object.keys(row).forEach(key => {
        transformed[displayMap[key] || key] = row[key];
      });
      return transformed;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ width: 20 }];
    (worksheet as any)['!dir'] = 'rtl';

    const workbook: XLSX.WorkBook = {
      Sheets: { 'נתונים': worksheet },
      SheetNames: ['נתונים']
    };

    XLSX.writeFile(workbook, fileName);
  }
}
