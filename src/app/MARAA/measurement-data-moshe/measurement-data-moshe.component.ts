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
import { forkJoin } from 'rxjs';

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
  Subtract?: boolean;
  AprovedMabar?: boolean;
  EntryUserSubtract?: string;
EntryDateSubtract?: Date | null;
EntryUserAprovedMabar?: string;
EntryDateAprovedMabar?: Date | null;
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
  displayedMeasurementColumns: string[] = ['MeasurementCode', 'MeasurementShortDesc', 'Mone', 'Mechane', 'Grade', 'Target',  'AllUnitsGrade', 
  'pdf'];
  displayedDepartmentColumns: string[] = ['MeasurementCode', 'MeasurementShortDesc','Department', 'Mone', 'Mechane', 'Grade', 'Target','AllUnitsGrade'];
  
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
selectedPivot: 'yearly' | 'quarterly' | 'monthly' = 'yearly';

yearlyData: any[] = [];
quarterlyData: any[] = [];
monthlyData: any[] = [];

yearlyColumns: string[] = [];
quarterlyColumns: string[] = [];
monthlyColumns: string[] = [];
selectedYears: number[] = [];
selectedQuarters: string[] = [];
selectedMonths: string[] = [];
allUnitsGradeMap: { [code: string]: number | null } = {};

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

 

  
  @ViewChild('measurementPaginator') measurementPaginator!: MatPaginator;
  @ViewChild('departmentPaginator') departmentPaginator!: MatPaginator;

  @ViewChild('measurementSort') measurementSort!: MatSort;
  @ViewChild('departmentSort') departmentSort!: MatSort;


  @ViewChild('yearlyPaginator') yearlyPaginator!: MatPaginator;
  @ViewChild('quarterlyPaginator') quarterlyPaginator!: MatPaginator;
  @ViewChild('monthlyPaginator') monthlyPaginator!: MatPaginator;
  
  @ViewChild('yearlySort') yearlySort!: MatSort;
  @ViewChild('quarterlySort') quarterlySort!: MatSort;
  @ViewChild('monthlySort') monthlySort!: MatSort;
yearlyDataSource = new MatTableDataSource<any>();
yearlyDisplayedColumns: string[] = [];



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
  'EntryDate',
  'Subtract',
  'AprovedMabar',
];
@ViewChild('failedPaginator') failedPaginator!: MatPaginator;
@ViewChild('failedSort') failedSort!: MatSort;

loginUserName: string = '';

profilePictureUrl: string = 'assets/default-user.png';

  constructor(private http: HttpClient, private dialog: MatDialog , private authenticationService: AuthenticationService
    ) {}
  getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

 ngOnInit(): void {
  this.isLoading = true;

  const currentYear = new Date().getFullYear();
  this.years = [currentYear - 1, currentYear, currentYear + 1];
 

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
  // this.fetchSummaryByMeasurement();
  // this.fetchSummaryByDepartment();
  // this.loadDepartments();
  // this.fetchMeasurement();
  // this.fetchQuarterlyPivot();
  // this.fetchMonthlyPivot();
  // this.fetchFailedCases();

  // 3. Load gauge targets and hide spinner after both complete
  this.fetchTargets();
  this.loadDepartments();
this.fetchMeasurement();
this.fetchAllUnitsGrades();

}

getUserDetailsFromDBByUserName(username: string): void {
  this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username}`)
    .subscribe(
      (data) => {
        this.loginUserName = data.UserName;
        this.profilePictureUrl = data.ProfilePicture || 'assets/default-user.png';
      },
      (error) => {
        console.error('❌ Error fetching employee info:', error);
      }
    );
}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.fetchSummaryByMeasurement();
      this.fetchSummaryByDepartment();
      this.fetchQuarterlyPivot();
      this.fetchMonthlyPivot();
      this.fetchFailedCases();
      this.fetchYearlyPivot();
      this.assignTableConfig();
      console.log('✅ ViewChildren initialized');

      // this.measurementDataSource.paginator = this.measurementPaginator;
      // this.measurementDataSource.sort = this.measurementSort;
    
      // this.departmentDataSource.paginator = this.departmentPaginator;
      // this.departmentDataSource.sort = this.departmentSort;
    
      this.quarterlyDataSource.paginator = this.quarterlyPaginator;
      this.quarterlyDataSource.sort = this.quarterlySort;

      
    this.monthlyDataSource.paginator = this.monthlyPaginator;
    this.monthlyDataSource.sort = this.monthlySort;

    this.failedCasesDataSource.paginator = this.failedPaginator;
    this.failedCasesDataSource.sort = this.failedSort;
    setTimeout(() => {
      if (this.yearlyPaginator && this.yearlySort) {
        this.yearlyDataSource.paginator = this.yearlyPaginator;
        this.yearlyDataSource.sort = this.yearlySort;
      }
  
      if (this.quarterlyPaginator && this.quarterlySort) {
        this.quarterlyDataSource.paginator = this.quarterlyPaginator;
        this.quarterlyDataSource.sort = this.quarterlySort;
      }
  
      if (this.monthlyPaginator && this.monthlySort) {
        this.monthlyDataSource.paginator = this.monthlyPaginator;
        this.monthlyDataSource.sort = this.monthlySort;
      }
    });
    });
    
  }
  ngOnChanges(): void {
    this.assignTableConfig(); // in case you use OnChanges
  }
  assignTableConfig(): void {
    setTimeout(() => {
      if (this.selectedPivot === 'yearly') {
        this.yearlyDataSource.paginator = this.yearlyPaginator;
        this.yearlyDataSource.sort = this.yearlySort;
      } else if (this.selectedPivot === 'quarterly') {
        this.quarterlyDataSource.paginator = this.quarterlyPaginator;
        this.quarterlyDataSource.sort = this.quarterlySort;
      } else if (this.selectedPivot === 'monthly') {
        this.monthlyDataSource.paginator = this.monthlyPaginator;
        this.monthlyDataSource.sort = this.monthlySort;
      }
    });
  }
  fetchSummaryByMeasurement(): void {
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`)
      .subscribe(data => {
        this.measurementDataSource.data = data;
  
        // ✅ Re-assign paginator/sort inside setTimeout
        setTimeout(() => {
          if (this.measurementPaginator && this.measurementSort) {
            this.measurementDataSource.paginator = this.measurementPaginator;
            this.measurementDataSource.sort = this.measurementSort;
            console.log('Paginator:', this.measurementPaginator);
console.log('Sort:', this.measurementSort);
            console.log('✅ Paginator and Sort assigned');
          } else {
            console.warn('❌ Paginator or Sort not available');
          }
        });
      });
  }
  
  fetchSummaryByDepartment(): void {
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByDepartment`)
      .subscribe({
        next: data => {
          this.departmentDataSource.data = data;
  
          // ✅ Move paginator + sort here:
          setTimeout(() => {
            this.departmentDataSource.paginator = this.departmentPaginator;
            this.departmentDataSource.sort = this.departmentSort;
          });
  
          this.isLoading = false;
        },
        error: () => this.isLoading = false
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
            Q4: [10, 12],
          };
          for (const quarter of this.selectedQuarters) {
            const [startMonth, endMonth] = quarterMap[quarter];
            const endDay = getLastDayOfMonth(year, endMonth);
            fromDates.push(`${year}-${String(startMonth).padStart(2, '0')}-01`);
            toDates.push(`${year}-${String(endMonth).padStart(2, '0')}-${endDay}`);
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
  
    const measurementCodes = this.extractMeasurementCodes();
    if (measurementCodes.length > 0) {
      params['measurement'] = measurementCodes.join(',');
    }
  
    this.http.get<QuarterlyPivotFlatModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetQuarterlyPivot`, {
      params: new HttpParams({ fromObject: params }),
    }).subscribe({
      next: (data) => {
        this.quarterlyDataSource = new MatTableDataSource(data);
  
        if (this.quarterlyPaginator) this.quarterlyDataSource.paginator = this.quarterlyPaginator;
        if (this.quarterlySort) this.quarterlyDataSource.sort = this.quarterlySort;
  
        const staticCols = ['קוד מדד', 'שם מדד'];
        const dynamicKeys = Object.keys(data[0] || {}).filter(k => !staticCols.includes(k));
  
        const quarterOrder = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
        const sortedKeys = dynamicKeys.sort((a, b) => {
          const [yearA, qA] = a.split('_');
          const [yearB, qB] = b.split('_');
          const yearDiff = +yearB - +yearA;
          if (yearDiff !== 0) return yearDiff;
          return quarterOrder[qB as keyof typeof quarterOrder] - quarterOrder[qA as keyof typeof quarterOrder];
        });
  
        this.quarterlyDisplayedColumns = [...staticCols, ...sortedKeys];
      },
      error: (err) => {
        console.error('❌ Error loading quarterly pivot data', err);
      },
    });
  }
  
  
  
  fetchMonthlyPivot(): void {
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
  
    const measurementCodes = this.extractMeasurementCodes();
    if (measurementCodes.length > 0) {
      params['measurement'] = measurementCodes.join(',');
    }
    
  
    this.http.get<MonthlyPivotModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMonthlyPivot`, {
      params: new HttpParams({ fromObject: params })
    }).subscribe({
      next: data => {
        this.monthlyDataSource = new MatTableDataSource(data);
        if (data.length > 0) {
          const allKeys = Object.keys(data[0]);
          const staticKeys = ['קוד מדד', 'שם מדד'];
          const dynamicKeys = allKeys.filter(k => !staticKeys.includes(k)).sort((a, b) => b.localeCompare(a));
          this.monthlyDisplayedColumns = [...staticKeys, ...dynamicKeys];
        }
  
        // ✅ paginator and sort setup
        if (this.monthlyPaginator && this.monthlySort) {
          this.monthlyDataSource.paginator = this.monthlyPaginator;
          this.monthlyDataSource.sort = this.monthlySort;
        } else {
          setTimeout(() => {
            if (this.monthlyPaginator) this.monthlyDataSource.paginator = this.monthlyPaginator;
            if (this.monthlySort) this.monthlyDataSource.sort = this.monthlySort;
          });
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
    const measurementCodes = this.extractMeasurementCodes();
    if (measurementCodes.length > 0) {
      params['measurement'] = measurementCodes.join(',');
    }
  
    this.http.get<FailedMeasurementCaseModel[]>(
      `${environment.apiUrl}MeasurementDataMoshe/GetFailedCases`,
      { params: new HttpParams({ fromObject: params }) }
    ).subscribe(data => {
      this.failedCasesDataSource = new MatTableDataSource(data);
  
      if (this.failedPaginator && this.failedSort) {
        this.failedCasesDataSource.paginator = this.failedPaginator;
        this.failedCasesDataSource.sort = this.failedSort;
      } else {
        setTimeout(() => {
          if (this.failedPaginator) this.failedCasesDataSource.paginator = this.failedPaginator;
          if (this.failedSort) this.failedCasesDataSource.sort = this.failedSort;
        });
      }
    });
  }
  
  
  fetchTargets(): void {
    this.http.get<MeasurementTarget[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetMeasurementTargets`)
      .subscribe(data => {
        this.measurementTargets = data;
      });
  }
  fetchYearlyPivot(): void {
    const params: { [key: string]: string } = {};
    const fromDates: string[] = [];
    const toDates: string[] = [];
  
    if (this.selectedYears?.length) {
      for (const year of this.selectedYears) {
        fromDates.push(`${year}-01-01`);
        toDates.push(`${year}-12-31`);
      }
    }
  
    if (fromDates.length && toDates.length) {
      params['fromDates'] = fromDates.join(',');
      params['toDates'] = toDates.join(',');
    }
  
    if (this.selectedDepartments?.length > 0) {
      params['departments'] = this.selectedDepartments.join(',');
    }
  
    const measurementCodes = this.extractMeasurementCodes();
    if (measurementCodes.length > 0) {
      params['measurement'] = measurementCodes.join(',');
    }
  
    this.http.get<any[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetYearlyPivot`, {
      params: new HttpParams({ fromObject: params }),
    }).subscribe({
      next: data => {
        this.yearlyDataSource = new MatTableDataSource(data);
  
        if (this.yearlyPaginator) this.yearlyDataSource.paginator = this.yearlyPaginator;
        if (this.yearlySort) this.yearlyDataSource.sort = this.yearlySort;
  
        const staticCols = ['קוד מדד', 'שם מדד'];
        const dynamicCols = Object.keys(data[0] || {}).filter(k => !staticCols.includes(k));
        this.yearlyDisplayedColumns = [...staticCols, ...dynamicCols.sort((a, b) => b.localeCompare(a))];
      },
      error: err => console.error('❌ Error loading yearly pivot data', err)
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
  
    const measurementCodes = this.extractMeasurementCodes();
    if (measurementCodes.length > 0) {
      params['measurement'] = measurementCodes.join(',');
    }
    // ✅ This will apply the filter to the quarterly pivot
    this.fetchQuarterlyPivot();
    this.fetchMonthlyPivot();
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
    this.fetchAllUnitsGrades(); 
    this.fetchYearlyPivot();


  }
  
  
  
  fetchGaugeValues(): void {
    const baseParams: any = {};
    const measurementCodes = this.extractMeasurementCodes();
    if (measurementCodes.length > 0) {
      baseParams.measurement = measurementCodes.join(',');
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
  exportYearly(): void {
    const headersMap: { [key: string]: string } = {};
    this.yearlyDisplayedColumns.forEach(col => headersMap[col] = col);
    this.exportExcelFromTable(this.yearlyDataSource.filteredData, 'סיכום_שנתי', headersMap);
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
      Case_Number: 'מספר מקרה',
      Subtract: 'הפחתה',
      AprovedMabar: 'מאושר מעבר',
      EntryUserSubtract: 'משתמש שהפחית',
      EntryDateSubtract: 'תאריך הפחתה',
      EntryUserAprovedMabar: 'משתמש שאישר מעבר',
      EntryDateAprovedMabar: 'תאריך אישור מעבר'
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
        Measurment_ID: row.Measurment_ID,
        Case_Number: row.Case_Number,
        Remarks: row.Remarks || '',
        Subtract: row.Subtract ?? false,
        AprovedMabar: row.AprovedMabar ?? false,
        MeasurementShortDesc: row.MeasurementShortDesc,
        Date: row.Date,
        Department: row.Department,
        Mone: row.Mone,
        Mechane: row.Mechane,
  
        // ✅ New fields
        EntryUserSubtract: row.EntryUserSubtract,
        EntryDateSubtract: row.EntryDateSubtract,
        EntryUserAprovedMabar: row.EntryUserAprovedMabar,
        EntryDateAprovedMabar: row.EntryDateAprovedMabar
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFailedCases(); // Refresh after save
      }
    });
  }
  
  private extractMeasurementCodes(): string[] {
    return this.selectedMeasurements.map(label => label.split(' ')[0]);
  } 
  viewPDF(code: string): void {
    window.open(`${environment.apiUrl}MeasurementDataMoshe/GetMeasurementPDF?code=${code}`, '_blank');
  }
  getTargetValue(measurementCode: string): number | null {
    const years = this.measurementTargets
      .filter(t => t.MeasurementCode === measurementCode)
      .map(t => t.MYear);
  
    if (years.length === 0) return null;
  
    const latestYear = Math.max(...years);
    const target = this.measurementTargets.find(
      t => t.MeasurementCode === measurementCode && t.MYear === latestYear
    );
  
    return target?.MTarget ?? null;
  }
  fetchAllUnitsGrades(): void {
    const params: any = {};
  
    if (this.selectedYears?.length) {
      const fromDates: string[] = [];
      const toDates: string[] = [];
  
      for (const year of this.selectedYears) {
        fromDates.push(`${year}-01-01`);
        toDates.push(`${year}-12-31`);
      }
  
      params['fromDates'] = fromDates.join(',');
      params['toDates'] = toDates.join(',');
    }
  
    const measurementCodes = this.extractMeasurementCodes();
    if (measurementCodes.length > 0) {
      params['measurement'] = measurementCodes.join(',');
    }
  
    // ❌ DO NOT include departments here
  
    this.http.get<MeasurementSummaryModel[]>(`${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, {
      params: new HttpParams({ fromObject: params })
    }).subscribe(data => {
      this.allUnitsGradeMap = {};
      data.forEach(item => {
        this.allUnitsGradeMap[item.MeasurementCode] = item.Grade ?? null;
      });
    });
  }

  onMeasurementFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim().toLowerCase();
    this.measurementDataSource.filter = value;
  }
  applyGlobalFilter(event: Event, tableType: string): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
  
    switch (tableType) {
      case 'measurement':
        this.measurementDataSource.filter = filterValue;
        break;
      case 'department':
        this.departmentDataSource.filter = filterValue;
        break;
      case 'quarterly':
        this.quarterlyDataSource.filter = filterValue;
        break;
      case 'monthly':
        this.monthlyDataSource.filter = filterValue;
        break;
      case 'failed':
        this.failedCasesDataSource.filter = filterValue;
        break;
    }
  }
  exportSelectedPivot(): void {
    const headersMap: { [key: string]: string } = {};
    let data: any[] = [];
    let fileName = '';
  
    switch (this.selectedPivot) {
      case 'yearly':
        this.yearlyDisplayedColumns.forEach(col => headersMap[col] = col);
        data = this.yearlyDataSource.filteredData;
        fileName = 'סיכום_שנתי';
        break;
      case 'quarterly':
        this.quarterlyDisplayedColumns.forEach(col => headersMap[col] = col);
        data = this.quarterlyDataSource.filteredData;
        fileName = 'סיכום_רבעוני';
        break;
      case 'monthly':
        this.monthlyDisplayedColumns.forEach(col => headersMap[col] = col);
        data = this.monthlyDataSource.filteredData;
        fileName = 'סיכום_חודשי';
        break;
    }
  
    this.exportExcelFromTable(data, fileName, headersMap);
  }
  
  
}
