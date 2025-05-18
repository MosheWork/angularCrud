import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { NgxGaugeModule } from 'ngx-gauge';
import * as XLSX from 'xlsx';
import { MatDialog } from '@angular/material/dialog';
import { MeasurementRemarksDialogComponent } from '../measurement-remarks-dialog/measurement-remarks-dialog.component';
import { AuthenticationService } from '../../services/authentication-service/authentication-service.component';


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
  ID: number; // added

}

export interface MeasurementTarget {
  MeasurementCode: string;
  MYear: number;
  MTarget: number | null;
}
@Component({
  selector: 'app-measurement-data-moshe',
  templateUrl: './measurement-data-moshe.component.html',
  styleUrls: ['./measurement-data-moshe.component.scss']
})
export class MeasurementDataMosheComponent implements OnInit, AfterViewInit {
  displayedMeasurementColumns: string[] = ['MeasurementCode', 'MeasurementShortDesc', 'Mone', 'Mechane', 'Grade'];
  displayedDepartmentColumns: string[] = ['MeasurementCode', 'MeasurementShortDesc','Department', 'Mone', 'Mechane', 'Grade'];

  years: number[] = [];
quarters: string[] = ['Q1', 'Q2', 'Q3', 'Q4'];
months: string[] = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
departments: string[] = [];
measurements: string[] = [];
selectedDepartments: string[] = [];
selectedMeasurements: string[] = [];
quarterlyDisplayedColumns: string[] = ['Measurement']; // will be populated dynamically
gaugeTargetValue: number | null = null;
measurementTargets: MeasurementTarget[] = [];

selectedYear: number[] = [];
selectedQuarter: string[] = [];
selectedMonth: string[] = [];

selectedYears: number[] = [];
selectedQuarters: string[] = [];
selectedMonths: string[] = [];

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
failedCasesDisplayedColumns: string[] = [
  'Measurment_ID',
  'MeasurementShortDesc',
  'Date',
  'Mone',
  'Mechane',
  'Department',
  'Case_Number',
  'Remarks',
  'EntryUser',
  'EntryDate'
];
@ViewChild('failedPaginator') failedPaginator!: MatPaginator;
@ViewChild('failedSort') failedSort!: MatSort;

loginUserName: string = '';
UserName: string = '';
profilePictureUrl: string = 'assets/default-user.png';

  constructor(private http: HttpClient, private dialog: MatDialog , private authenticationService: AuthenticationService) {}
  getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

 ngOnInit(): void {
  this.isLoading = true;

  const currentYear = new Date().getFullYear();
  this.years = [currentYear - 1, currentYear, currentYear + 1];

  // Spinner will be visible for at least 5 seconds
  const spinnerTimeout = setTimeout(() => {
    this.isLoading = false;
  }, 5000);

  // 1. Get authenticated user
  this.authenticationService.getAuthentication().subscribe(
    (response) => {
      const user = response.message.split('\\')[1].toUpperCase();
      this.loginUserName = user;
      console.log('✅ Authenticated user:', user);

      // Get user details (name + profile picture)
      this.getUserDetailsFromDBByUserName(user);
    },
    (error) => {
      console.error('❌ Failed to authenticate user:', error);
    }
  );

  // 2. Load other dashboard data
  this.fetchSummaryByMeasurement();
  this.fetchSummaryByDepartment();
  this.loadDepartments();
  this.fetchMeasurement();
  this.fetchQuarterlyPivot();
  this.fetchMonthlyPivot();
  this.fetchFailedCases();

  // 3. Load gauge targets and hide spinner after both complete
  this.fetchTargets();
}

getUserDetailsFromDBByUserName(username: string): void {
  this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username}`)
    .subscribe(
      (data) => {
        this.UserName = data.UserName;
        this.profilePictureUrl = data.ProfilePicture || 'assets/default-user.png';
      },
      (error) => {
        console.error('❌ Error fetching employee info:', error);
      }
    );
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

    this.failedCasesDataSource.paginator = this.failedPaginator;
    this.failedCasesDataSource.sort = this.failedSort;

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
          
            const yearADigit: number = +yearA;
            const yearBDigit: number = +yearB;
            const yearDiff: number = yearBDigit - yearADigit;
          
            if (yearDiff !== 0) return yearDiff;
          
            return quarterOrder[qB as keyof typeof quarterOrder] - quarterOrder[qA as keyof typeof quarterOrder];
          });
          
  
          this.quarterlyDisplayedColumns = [
            'קוד מדד',
            'שם מדד',
            ...sortedKeys.filter(k => k !== 'קוד מדד' && k !== 'שם מדד')
          ];      },
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
  
          if (data.length > 0) {
            const allKeys = Object.keys(data[0]);
  
            // Eliminate duplicates safely
            const staticKeys = ['קוד מדד', 'שם מדד'];
            const uniqueDynamicKeys = allKeys.filter((k, i, arr) =>
  !staticKeys.includes(k) && arr.indexOf(k) === i
).sort((a, b) => b.localeCompare(a)); // newer months first
  
            this.monthlyDisplayedColumns = [...staticKeys, ...uniqueDynamicKeys];
          }
        },
        error: err => {
          console.error('❌ Error loading monthly pivot data', err);
        }
      });
  }
  
  
  fetchFailedCases(): void {
    const params: { [key: string]: string } = {};
    const fromDates: string[] = [];
    const toDates: string[] = [];
  
    const getLastDayOfMonth = (year: number, month: number): number => {
      return new Date(year, month, 0).getDate();
    };
  
    if (this.selectedYears?.length) {
      for (const year of this.selectedYears) {
        if (this.selectedQuarters?.length) {
          const quarterMap: { [key: string]: [number, number] } = {
            Q1: [1, 3],
            Q2: [4, 6],
            Q3: [7, 9],
            Q4: [10, 12]
          };
  
          for (const quarter of this.selectedQuarters) {
            const range = quarterMap[quarter];
            if (range) {
              const [startMonth, endMonth] = range;
              const endDay = getLastDayOfMonth(year, endMonth);
              fromDates.push(`${year}-${String(startMonth).padStart(2, '0')}-01`);
              toDates.push(`${year}-${String(endMonth).padStart(2, '0')}-${endDay}`);
            }
          }
  
        } else if (this.selectedMonths?.length) {
          for (const monthName of this.selectedMonths) {
            const monthIndex = this.months.indexOf(monthName) + 1;
            if (monthIndex > 0) {
              const endDay = getLastDayOfMonth(year, monthIndex);
              const paddedMonth = String(monthIndex).padStart(2, '0');
              fromDates.push(`${year}-${paddedMonth}-01`);
              toDates.push(`${year}-${paddedMonth}-${endDay}`);
            }
          }
  
        } else {
          fromDates.push(`${year}-01-01`);
          toDates.push(`${year}-12-31`);
        }
      }
    }
  
    if (fromDates.length > 0 && toDates.length > 0) {
      params['fromDates'] = fromDates.join(',');
      params['toDates'] = toDates.join(',');
    }
  
    if (this.selectedDepartments?.length > 0) {
      params['departments'] = this.selectedDepartments.join(',');
    }
  
    if (this.selectedMeasurements?.length > 0) {
      params['measurement'] = this.selectedMeasurements.join(',');
    }
  
    this.http.get<FailedMeasurementCaseModel[]>(
      `${environment.apiUrl}MeasurementDataMoshe/GetFailedCases`,
      { params: new HttpParams({ fromObject: params }) }
    ).subscribe(data => {
      this.failedCasesDataSource.data = data;
      this.failedCasesDataSource.paginator = this.failedPaginator;
      this.failedCasesDataSource.sort = this.failedSort;
      this.failedCasesDataSource.filter = ''; // refresh
    });
  }
  
  fetchTargets(): void {
    this.http.get<MeasurementTarget[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementTargets`)
      .subscribe(data => {
        this.measurementTargets = data;
      });
  }

  
  resetFilter(): void {
    this.selectedYears = [];
    this.selectedQuarters = [];
    this.selectedMonths = [];
    this.selectedDepartments = [];
    this.selectedMeasurements = [];
  
    this.yearGaugeValue = null;
    this.quarterGaugeValue = null;
    this.monthGaugeValue = null;
  
    this.applyFilter();
    this.fetchMonthlyPivot();
    this.fetchQuarterlyPivot();
  }
  

  applyFilter(): void {
    if (this.selectedQuarters.length > 0 && this.selectedMonths.length > 0) {
      alert("לא ניתן לבחור גם רבעון וגם חודש בו זמנית. אנא בחר אחד מהם בלבד.");
      return; // stop execution
    }
    const params: { [key: string]: string } = {};
    const fromDates: string[] = [];
    const toDates: string[] = [];
  
    const getLastDayOfMonth = (year: number, month: number): number => {
      return new Date(year, month, 0).getDate();
    };
  
    if (this.selectedYears?.length) {
      for (const year of this.selectedYears) {
        if (this.selectedQuarters?.length) {
          const quarterMap: { [key: string]: [number, number] } = {
            Q1: [1, 3],
            Q2: [4, 6],
            Q3: [7, 9],
            Q4: [10, 12]
          };
  
          for (const quarter of this.selectedQuarters) {
            const range = quarterMap[quarter];
            if (range) {
              const [startMonth, endMonth] = range;
              const endDay = getLastDayOfMonth(year, endMonth);
              fromDates.push(`${year}-${String(startMonth).padStart(2, '0')}-01`);
              toDates.push(`${year}-${String(endMonth).padStart(2, '0')}-${endDay}`);
            }
          }
  
        } else if (this.selectedMonths?.length) {
          for (const monthName of this.selectedMonths) {
            const monthIndex = this.months.indexOf(monthName) + 1;
            if (monthIndex > 0) {
              const endDay = getLastDayOfMonth(year, monthIndex);
              const paddedMonth = String(monthIndex).padStart(2, '0');
              fromDates.push(`${year}-${paddedMonth}-01`);
              toDates.push(`${year}-${paddedMonth}-${endDay}`);
            }
          }
  
        } else {
          // Whole year fallback
          fromDates.push(`${year}-01-01`);
          toDates.push(`${year}-12-31`);
        }
      }
    }
  
    if (fromDates.length > 0 && toDates.length > 0) {
      params['fromDates'] = fromDates.join(',');
      params['toDates'] = toDates.join(',');
    }
  
    if (this.selectedDepartments?.length > 0) {
      params['departments'] = this.selectedDepartments.join(',');
    }
  
    if (this.selectedMeasurements?.length > 0) {
      params['measurement'] = this.selectedMeasurements.join(',');
    }
  
    // Load data with filters
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params })
      .subscribe(data => {
        this.measurementDataSource.data = data;
        this.measurementDataSource.filter = '';
      });
  
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByDepartment`, { params })
      .subscribe(data => {
        this.departmentDataSource.data = data;
        this.departmentDataSource.filter = '';
      });
  
    this.http.get<FailedMeasurementCaseModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetFailedCases`, { params })
      .subscribe(data => {
        this.failedCasesDataSource.data = data;
        this.failedCasesDataSource.filter = '';
      });
  
    this.fetchGaugeValues();
  }
  
  
  
  fetchGaugeValues(): void {
    const baseParams: any = {};
    if (this.selectedMeasurements?.length) {
      baseParams.measurement = this.selectedMeasurements.join(',');
    }
  
    // 🔹 Load target for selected measurement & year (used under the gauge)
    if (this.selectedMeasurements.length === 1 && this.selectedYears.length === 1) {
      const selectedMeasurementCode = this.selectedMeasurements[0].split(' ')[0];
      const selectedYear = this.selectedYears[0];
    
      console.log('🔍 Looking for target with:');
      console.log('MeasurementCode:', selectedMeasurementCode);
      console.log('MYear:', selectedYear);
    
      this.http.get<MeasurementTarget[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementTargets`)
        .subscribe(targets => {
          console.log('🎯 Available targets:', targets);
    
          const match = targets.find(t =>
            t.MeasurementCode === selectedMeasurementCode && t.MYear === selectedYear
          );
    
          if (match) {
            console.log('✅ Found target:', match);
            this.gaugeTargetValue = match.MTarget ?? null;
          } else {
            console.warn('❌ No matching target found.');
            this.gaugeTargetValue = null;
          }
        });
    }
    
  
    // 🔹 Year-level gauge (average of all selected years)
    if (this.selectedYears?.length) {
      const fromDates: string[] = [];
      const toDates: string[] = [];
  
      for (const year of this.selectedYears) {
        fromDates.push(`${year}-01-01`);
        toDates.push(`${year}-12-31`);
      }
  
      const params = { ...baseParams, fromDates: fromDates.join(','), toDates: toDates.join(',') };
      this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params })
        .subscribe(data => this.yearGaugeValue = data[0]?.Grade ?? 0);
    } else {
      this.yearGaugeValue = 0;
    }
  
    // 🔹 Quarter gauge
    if (this.selectedYears.length && this.selectedQuarters.length) {
      const fromDates: string[] = [];
      const toDates: string[] = [];
      const quarterMap = { Q1: [1, 3], Q2: [4, 6], Q3: [7, 9], Q4: [10, 12] };
  
      for (const year of this.selectedYears) {
        for (const quarter of this.selectedQuarters) {
          const [startMonth, endMonth] = quarterMap[quarter as keyof typeof quarterMap];
          const endDay = new Date(year, endMonth, 0).getDate();
          fromDates.push(`${year}-${String(startMonth).padStart(2, '0')}-01`);
          toDates.push(`${year}-${String(endMonth).padStart(2, '0')}-${endDay}`);
        }
      }
  
      const params = { ...baseParams, fromDates: fromDates.join(','), toDates: toDates.join(',') };
      this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params })
        .subscribe(data => this.quarterGaugeValue = data[0]?.Grade ?? 0);
    } else {
      this.quarterGaugeValue = 0;
    }
  
    // 🔹 Month gauge
    if (this.selectedYears.length && this.selectedMonths.length) {
      const fromDates: string[] = [];
      const toDates: string[] = [];
  
      for (const year of this.selectedYears) {
        for (const month of this.selectedMonths) {
          const monthIndex = this.months.indexOf(month) + 1;
          const lastDay = new Date(year, monthIndex, 0).getDate();
          const monthStr = String(monthIndex).padStart(2, '0');
          fromDates.push(`${year}-${monthStr}-01`);
          toDates.push(`${year}-${monthStr}-${lastDay}`);
        }
      }
  
      const params = { ...baseParams, fromDates: fromDates.join(','), toDates: toDates.join(',') };
      this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params })
        .subscribe(data => this.monthGaugeValue = data[0]?.Grade ?? 0);
    } else {
      this.monthGaugeValue = 0;
    }
  }
  
  
  
  
  
  
  
  getCellClass(value: any, measurementCode: string): string {
    if (value === null || value === undefined || isNaN(value)) return '';
  
    const year = this.selectedYears.length === 1 ? this.selectedYears[0] : null;
  
    const target = this.measurementTargets.find(t =>
      t.MeasurementCode === measurementCode && (year ? t.MYear === year : true)
    )?.MTarget;
  
    if (target === undefined || target === null) return ''; // No target info
  
    const num = +value;
    return num < target ? 'low-percentage' : 'high-percentage';
  }
  
  getGaugeColor(value: number | null): string {
    if (value === null || value === undefined) return '#ccc';
  
    if (this.gaugeTargetValue !== null) {
      return value >= this.gaugeTargetValue ? '#4caf50' : '#f44336';
    }
  
    // fallback if no target
    return value >= 50 ? '#4caf50' : '#f44336';
  }
  exportExcelFromTable(data: any[], fileName: string, headersMap: { [key: string]: string }) {
    const exportData = data.map(row => {
      const newRow: any = {};
      for (const key in headersMap) {
        newRow[headersMap[key]] = row[key];
      }
      return newRow;
    });
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'Sheet1': worksheet }, SheetNames: ['Sheet1'] };
    const excelBuffer: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
  
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}.xlsx`;
    anchor.click();
  
    window.URL.revokeObjectURL(url); // Clean up
  }
  exportQuarterly(): void {
    const headersMap: { [key: string]: string } = {};
    this.quarterlyDisplayedColumns.forEach(col => headersMap[col] = col);
    this.exportExcelFromTable(this.quarterlyDataSource.filteredData, 'סיכום_רבעוני', headersMap);
  }
  
  exportMonthly(): void {
    const headersMap: { [key: string]: string } = {};
    this.monthlyDisplayedColumns.forEach(col => headersMap[col] = col);
    this.exportExcelFromTable(this.monthlyDataSource.filteredData, 'סיכום_חודשי', headersMap);
  }
  
  exportFailed(): void {
    const headersMap: { [key: string]: string } = {
      Measurment_ID: 'קוד מדד',
      MeasurementShortDesc: 'תיאור',
      Date: 'תאריך',
      Mone: 'מונה',
      Mechane: 'מכנה',
      Department: 'מחלקה',
      Case_Number: 'מספר מקרה'
    };
    this.exportExcelFromTable(this.failedCasesDataSource.filteredData, 'מדדים_שלא_בוצעו', headersMap);
  }
  exportMeasurementSummary(): void {
    const headersMap: { [key: string]: string } = {
      MeasurementCode: 'קוד מדד',
      MeasurementShortDesc: 'תיאור',
      Mone: 'מונה',
      Mechane: 'מכנה',
      Grade: 'אחוז'
    };
  
    this.exportExcelFromTable(this.measurementDataSource.filteredData, 'סיכום_לפי_מדד', headersMap);
  }
  
  exportDepartmentSummary(): void {
    const headersMap: { [key: string]: string } = {
      MeasurementCode: 'קוד מדד',
      Department: 'מחלקה',
      Mone: 'מונה',
      Mechane: 'מכנה',
      Grade: 'אחוז'
    };
  
    this.exportExcelFromTable(this.departmentDataSource.filteredData, 'סיכום_לפי_מחלקה', headersMap);
  }
  openRemarksDialog(row: any): void {
    const dialogRef = this.dialog.open(MeasurementRemarksDialogComponent, {
      width: '800px',
      data: { 
        id: row.ID, 
        remarks: row.Remarks || '' // Pass current remarks
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFailedCases(); // ✅ Refresh table if needed
      }
    });
  }
  
}
