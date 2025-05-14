import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { NgxGaugeModule } from 'ngx-gauge';



export interface MeasurementSummaryModel {
  MeasurementCode: string;
  MeasurementShortDesc?: string; // only for per-measurement
  Department?: string;           // only for per-department
  Mone: number;
  Mechane: number;
  Grade: number | null;
}
export interface QuarterlyPivotFlatModel {
  Measurement: string;
  [key: string]: string | number | null; // dynamic quarter columns like '2024_Q1'
}
export interface MonthlyPivotModel {
  Measurement: string;
  [key: string]: any; // for dynamic month columns like 2024_05, 2024_06
}
export interface FailedMeasurementCaseModel {
  MeasurementCode: string;
  MeasurementShortDesc?: string;
  Department: string;
  CaseNumber: string;
  Date: string;
  Mone: number;
  Mechane: number;
}
@Component({
  selector: 'app-measurement-data-moshe',
  templateUrl: './measurement-data-moshe.component.html',
  styleUrls: ['./measurement-data-moshe.component.scss']
})
export class MeasurementDataMosheComponent implements OnInit, AfterViewInit {
  displayedMeasurementColumns: string[] = ['MeasurementCode', 'MeasurementShortDesc', 'Mone', 'Mechane', 'Grade'];
  displayedDepartmentColumns: string[] = ['MeasurementCode', 'Department', 'Mone', 'Mechane', 'Grade'];

  years: number[] = [];
quarters: string[] = ['Q1', 'Q2', 'Q3', 'Q4'];
months: string[] = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
departments: string[] = [];
measurements: string[] = [];
quarterlyDisplayedColumns: string[] = ['Measurement']; // will be populated dynamically

selectedYear: number | null = null;
selectedQuarter: string | null = null;
selectedMonth: string | null = null;
selectedDepartment: string | null = null;
selectedMeasurement: string | null = null;
yearGaugeValue: number | null = 0;
quarterGaugeValue: number | null = 0;
monthGaugeValue: number | null = 0;
  measurementDataSource = new MatTableDataSource<MeasurementSummaryModel>();
  departmentDataSource = new MatTableDataSource<MeasurementSummaryModel>();
  quarterlyDataSource = new MatTableDataSource<QuarterlyPivotFlatModel>();
  monthlyDataSource = new MatTableDataSource<MonthlyPivotModel>();
  monthlyDisplayedColumns: string[] = []; // Will be filled dynamically
  isLoading = true;
  @ViewChild('quarterlyPaginator') quarterlyPaginator!: MatPaginator;
  @ViewChild('quarterlySort') quarterlySort!: MatSort;
  
  @ViewChild('measurementPaginator') measurementPaginator!: MatPaginator;
  @ViewChild('departmentPaginator') departmentPaginator!: MatPaginator;

  @ViewChild('measurementSort') measurementSort!: MatSort;
  @ViewChild('departmentSort') departmentSort!: MatSort;

  @ViewChild('monthlyPaginator') monthlyPaginator!: MatPaginator;
@ViewChild('monthlySort') monthlySort!: MatSort;
failedCasesDataSource = new MatTableDataSource<FailedMeasurementCaseModel>();
failedCasesDisplayedColumns: string[] = ['Measurment_ID', 'MeasurementShortDesc', 'Date', 'Mone', 'Mechane', 'Department','Case_Number'];

@ViewChild('failedPaginator') failedPaginator!: MatPaginator;



  constructor(private http: HttpClient) {}
  getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }
  ngOnInit(): void {
    this.fetchSummaryByMeasurement();
    this.fetchSummaryByDepartment();
    this.loadDepartments();
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear, currentYear + 1];
    this.fetchMeasurement()
    this.fetchQuarterlyPivot()
    this.fetchMonthlyPivot();
    this.fetchFailedCases(); // ✅ fetch failed cases here

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.measurementDataSource.paginator = this.measurementPaginator;
      this.measurementDataSource.sort = this.measurementSort;
    
      this.departmentDataSource.paginator = this.departmentPaginator;
      this.departmentDataSource.sort = this.departmentSort;
    
      this.quarterlyDataSource.paginator = this.quarterlyPaginator;
      this.quarterlyDataSource.sort = this.quarterlySort;

      
    this.monthlyDataSource.paginator = this.monthlyPaginator;
    this.monthlyDataSource.sort = this.monthlySort;
    });
    
  }
  
  fetchSummaryByMeasurement(): void {
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`)
      .subscribe({
        next: data => {
          this.measurementDataSource.data = data;
          this.isLoading = false;
        },
        error: err => {
          console.error('Error loading summary by measurement', err);
          this.isLoading = false;
        }
      });
  }

  fetchSummaryByDepartment(): void {
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByDepartment`)
      .subscribe({
        next: data => {
          this.departmentDataSource.data = data;
          this.isLoading = false;
        },
        error: err => {
          console.error('Error loading summary by department', err);
          this.isLoading = false;
        }
      });
  }

  loadDepartments(): void {
    this.http.get<string[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetDepartments`)
      .subscribe(data => this.departments = data);
  }

  fetchMeasurement() : void{
    this.http.get<string[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurements`)
    .subscribe(data => this.measurements = data);
  }

  fetchQuarterlyPivot(): void {
    this.http.get<QuarterlyPivotFlatModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetQuarterlyPivot`)
      .subscribe({
        next: data => {
          this.quarterlyDataSource.data = data;
  
          // Extract dynamic keys like "2024_Q1"
          const allKeys = Object.keys(data[0] || {}).filter(k => k !== 'Measurement');
  
          // Sort: by year ASC, then quarter Q1–Q4
          const quarterOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
          const sortedKeys = allKeys.sort((a, b) => {
            const [yearA, qA] = a.split('_');
            const [yearB, qB] = b.split('_');
  
            const yearDiff = +yearA - +yearB;
            if (yearDiff !== 0) return yearDiff;
            return quarterOrder[qA as keyof typeof quarterOrder] - quarterOrder[qB as keyof typeof quarterOrder];
          });
  
          this.quarterlyDisplayedColumns = ['Measurement', ...sortedKeys];
        },
        error: err => {
          console.error('❌ Error loading quarterly pivot data', err);
        }
      });
  }
  fetchMonthlyPivot(): void {
    this.http.get<MonthlyPivotModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMonthlyPivot`)
      .subscribe({
        next: data => {
          this.monthlyDataSource.data = data;
  
          // Get column keys dynamically
          if (data.length > 0) {
            this.monthlyDisplayedColumns = Object.keys(data[0]);
          }
        },
        error: err => {
          console.error('❌ Error loading monthly pivot data', err);
        }
      });
  }
  fetchFailedCases(): void {
    this.http.get<FailedMeasurementCaseModel[]>(`${environment.apiUrl}MeasurementDataMoshe/GetFailedCases`)
      .subscribe(data => {
        this.failedCasesDataSource.data = data;
        this.failedCasesDataSource.paginator = this.failedPaginator;
      });
  }
  
  
  resetFilter(): void {
    this.selectedYear = null;
    this.selectedQuarter = null;
    this.selectedMonth = null;
    this.selectedDepartment = null;
    this.selectedMeasurement = null;
      // Reset gauge values
    this.yearGaugeValue = null;
    this.quarterGaugeValue = null;
    this.monthGaugeValue = null;
    this.applyFilter();
    this.fetchMonthlyPivot();

  }

  applyFilter(): void {
    const params: { [key: string]: string } = {};
  
    // Year always added if selected
    if (this.selectedYear) {
      params['year'] = this.selectedYear.toString();
    }
  
    // Calculate fromDate and toDate
    const getLastDayOfMonth = (year: number, month: number): number => {
      return new Date(year, month, 0).getDate(); // 0th day of next month = last of current
    };
  
    if (this.selectedQuarter) {
      const quarterMap = {
        Q1: [1, 3],
        Q2: [4, 6],
        Q3: [7, 9],
        Q4: [10, 12]
      };
      const [startMonth, endMonth] = quarterMap[this.selectedQuarter as 'Q1' | 'Q2' | 'Q3' | 'Q4'];
      const endDay = getLastDayOfMonth(this.selectedYear!, endMonth);
      params['fromDate'] = `${this.selectedYear}-${startMonth.toString().padStart(2, '0')}-01`;
      params['toDate'] = `${this.selectedYear}-${endMonth.toString().padStart(2, '0')}-${endDay}`;
    } else if (this.selectedMonth) {
      const monthIndex = this.months.indexOf(this.selectedMonth) + 1;
      const lastDay = getLastDayOfMonth(this.selectedYear!, monthIndex);
      const monthStr = monthIndex.toString().padStart(2, '0');
      params['fromDate'] = `${this.selectedYear}-${monthStr}-01`;
      params['toDate'] = `${this.selectedYear}-${monthStr}-${lastDay}`;
    } else if (this.selectedYear && !this.selectedQuarter && !this.selectedMonth) {
      // Whole year
      params['fromDate'] = `${this.selectedYear}-01-01`;
      params['toDate'] = `${this.selectedYear}-12-31`;
    }
  
    // Department filter
    if (this.selectedDepartment) {
      params['departments'] = this.selectedDepartment;
    }
  
    // Measurement filter
    if (this.selectedMeasurement) {
      params['measurement'] = this.selectedMeasurement;
    }
  
    // Request updated summary by measurement
    this.http.get<MeasurementSummaryModel[]>(
      `${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params }
    ).subscribe(data => {
      this.measurementDataSource.data = data;
      this.measurementDataSource.filter = ''; // ✅ refresh filter
    });
  
    // Request updated summary by department
    this.http.get<MeasurementSummaryModel[]>(
      `${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByDepartment`, { params }
    ).subscribe(data => {
      this.departmentDataSource.data = data;
      this.departmentDataSource.filter = ''; // ✅ refresh filter
    });

    this.fetchGaugeValues();

  }
  
  fetchGaugeValues(): void {
    const baseMeasurementParam: any = {};
    if (!this.selectedMeasurement) return;
  
    baseMeasurementParam.measurement = this.selectedMeasurement;
  
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
  
    // Year: last full year
    const lastYear = currentYear - 1;
    const yearParams = {
      ...baseMeasurementParam,
      fromDate: `${lastYear}-01-01`,
      toDate: `${lastYear}-12-31`
    };
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params: yearParams })
      .subscribe(data => this.yearGaugeValue = data[0]?.Grade ?? null);
  
    // Quarter: last full quarter
    let qYear = currentYear;
    let q = currentQuarter - 1;
    if (q === 0) {
      q = 4;
      qYear -= 1;
    }
  
    const quarterMap = { 1: [1, 3], 2: [4, 6], 3: [7, 9], 4: [10, 12] };
    const [qStart, qEnd] = quarterMap[q as 1 | 2 | 3 | 4];
    const lastDayOfQuarter = new Date(qYear, qEnd, 0).getDate();
    const quarterParams = {
      ...baseMeasurementParam,
      fromDate: `${qYear}-${String(qStart).padStart(2, '0')}-01`,
      toDate: `${qYear}-${String(qEnd).padStart(2, '0')}-${lastDayOfQuarter}`
    };
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params: quarterParams })
      .subscribe(data => this.quarterGaugeValue = data[0]?.Grade ?? null);
  
    // Month: last full month
    let mYear = currentYear;
    let m = currentMonth - 1;
    if (m === 0) {
      m = 12;
      mYear -= 1;
    }
    const lastDay = new Date(mYear, m, 0).getDate();
    const monthParams = {
      ...baseMeasurementParam,
      fromDate: `${mYear}-${String(m).padStart(2, '0')}-01`,
      toDate: `${mYear}-${String(m).padStart(2, '0')}-${lastDay}`
    };
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params: monthParams })
      .subscribe(data => this.monthGaugeValue = data[0]?.Grade ?? null);
  }
  
  
  
  
  getCellClass(value: any): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    const num = +value;
    return num < 50 ? 'low-percentage' : 'high-percentage';
  }
  
  getGaugeColor(value: number | null): string {
    if (value === null || value === undefined) return '#ccc'; // gray fallback
    return value >= 50 ? '#4caf50' : '#f44336'; // green or red
  }
  
}
