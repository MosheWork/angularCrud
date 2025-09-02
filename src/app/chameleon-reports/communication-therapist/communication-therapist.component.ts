import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-communication-therapist',
  templateUrl: './communication-therapist.component.html',
  styleUrls: ['./communication-therapist.component.scss'],
})
export class CommunicationTherapistComponent implements OnInit {
  loading: boolean = false;
  isGraphVisible: boolean = false;

  chart: Chart | null = null;
  chartType: ChartType = 'bar';
  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Data Summary',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  };

  // Data Sources and Columns (all lower-first keys)
  dailyFollowUpDataSource = new MatTableDataSource<any>([]);
  anamnesisResultsDataSource = new MatTableDataSource<any>([]);
  fullListDataSource = new MatTableDataSource<any>([]);

  dailyFollowUpColumns: string[] = ['employeeName', 'simpleA', 'complexB', 'veryComplexC', 'groupD'];
  anamnesisResultsColumns: string[] = ['employeeName', 'simple', 'complex', 'veryComplex'];
  fullListColumns: string[] = [
    'admissionNo',
    'idNum',
    'firstName',
    'lastName',
    'employeeName',
    'entry_Date',
    'answerType',
    'freeText'
  ];

  columnDisplayNames2: { [key: string]: string } = {
    employeeName: 'שם עובד',
    simple: 'טיפול פשוט',
    complex: 'טיפול מורכב',
    veryComplex: 'טיפול מאוד מורכב'
  };

  columnDisplayNames: { [key: string]: string } = {
    admissionNo: 'מספר מקרה',
    idNum: 'מספר זהות',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    employeeName: 'שם העובד',
    entry_Date: 'תאריך כניסה',
    answerType: 'סוג תשובה',
    freeText: 'טקסט חופשי'
  };

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

  @ViewChild('dailyFollowUpPaginator') dailyFollowUpPaginator!: MatPaginator;
  @ViewChild('anamnesisResultsPaginator') anamnesisResultsPaginator!: MatPaginator;
  @ViewChild('anamnesisResultsSort') anamnesisResultsSort!: MatSort;
  @ViewChild('fullListPaginator') fullListPaginator!: MatPaginator;
  @ViewChild('fullListSort') fullListSort!: MatSort;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      year: new FormControl(new Date().getFullYear()),
      month: new FormControl(null),
      // optional extra filters (if you add inputs in the template)
      admissionNo: new FormControl(null),
      idNum: new FormControl(null),
    });

    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    this.dailyFollowUpDataSource.paginator = this.dailyFollowUpPaginator;

    this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
    this.anamnesisResultsDataSource.sort = this.anamnesisResultsSort;

    this.fullListDataSource.paginator = this.fullListPaginator;
    this.fullListDataSource.sort = this.fullListSort;
  }

  applyFilters(): void {
    const { year, month, admissionNo, idNum } = this.filterForm.value;

    this.fetchDailyFollowUpData(year, month);
    this.fetchAnamnesisResultsData(year, month);
    this.fetchFullListDailyFollowUp(year, month);
    this.fetchFilteredAnamnesisResults(year, month, admissionNo, idNum);
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: null,
      admissionNo: null,
      idNum: null,
    });
    this.applyFilters();
  }

  fetchDailyFollowUpData(year?: number, month?: number): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/V_DailyFollowUp`, { params })
      .subscribe(
        (data) => {
          this.dailyFollowUpDataSource.data = data;
          if (this.dailyFollowUpPaginator) {
            this.dailyFollowUpDataSource.paginator = this.dailyFollowUpPaginator;
          }
          this.loading = false;
        },
        () => (this.loading = false)
      );
  }

  fetchFilteredAnamnesisResults(year?: number, month?: number, admissionNo?: string, idNum?: string): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    if (admissionNo) params.admissionNo = admissionNo;
    if (idNum) params.idNum = idNum;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/FilteredAnamnesisResults`, { params })
      .subscribe(
        (data) => {
          this.fullListDataSource.data = data;
          if (this.fullListPaginator) this.fullListDataSource.paginator = this.fullListPaginator;
          if (this.fullListSort) this.fullListDataSource.sort = this.fullListSort;
          this.loading = false;
        },
        () => (this.loading = false)
      );
  }

  fetchAnamnesisResultsData(year?: number, month?: number): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/AnamnesisResults`, { params })
      .subscribe(
        (data) => {
          this.anamnesisResultsDataSource.data = data;
          if (this.anamnesisResultsPaginator) {
            this.anamnesisResultsDataSource.paginator = this.anamnesisResultsPaginator;
          }
          if (this.anamnesisResultsSort) {
            this.anamnesisResultsDataSource.sort = this.anamnesisResultsSort;
          }
          this.loading = false;
        },
        () => (this.loading = false)
      );
  }

  fetchFullListDailyFollowUp(year?: number, month?: number): void {
    this.loading = true;

    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    this.http
      .get<any[]>(`${environment.apiUrl}CommunicationTherapist/FullListDailyFollowUp`, { params })
      .subscribe(
        (data) => {
          this.fullListDataSource.data = data;
          if (this.fullListPaginator) this.fullListDataSource.paginator = this.fullListPaginator;
          if (this.fullListSort) this.fullListDataSource.sort = this.fullListSort;
          this.loading = false;
        },
        () => (this.loading = false)
      );
  }

  toggleView(): void {
    this.isGraphVisible = !this.isGraphVisible;
    if (this.isGraphVisible) {
      this.initializeChart();
    }
  }

  initializeChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: this.chartType,
        data: this.chartData,
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }
  }

  exportDailyFollowUpToExcel(): void {
    this.exportToExcel(this.dailyFollowUpDataSource, 'Daily_Follow_Up_Data.xlsx');
  }

  exportAnamnesisResultsToExcel(): void {
    this.exportToExcel(this.anamnesisResultsDataSource, 'Anamnesis_Results_Data.xlsx');
  }

  exportFullListToExcel(): void {
    this.exportToExcel(this.fullListDataSource, 'Full_List_Daily_Follow_Up_Data.xlsx');
  }

  private exportToExcel(dataSource: MatTableDataSource<any>, fileName: string): void {
    const data = dataSource.data;

    // lower-first keys -> Hebrew headers
    const hebrewColumnNames: { [key: string]: string } = {
      admissionNo: 'מספר מקרה',
      idNum: 'מספר זהות',
      firstName: 'שם פרטי',
      lastName: 'שם משפחה',
      employeeName: 'שם העובד',
      entry_Date: 'תאריך כניסה',
      answerType: 'סוג תשובה',
      freeText: 'טקסט חופשי'
    };

    const transformedData = data.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        const hebrewKey = hebrewColumnNames[key] || key;
        newRow[hebrewKey] = row[key];
      });
      return newRow;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);
    worksheet['!cols'] = [{ width: 20 }];
    (worksheet as any)['!dir'] = 'rtl';

    const workbook: XLSX.WorkBook = {
      Sheets: { 'נתונים': worksheet },
      SheetNames: ['נתונים']
    };

    XLSX.writeFile(workbook, fileName);
  }
}
