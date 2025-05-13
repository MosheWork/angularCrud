import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { HttpParams } from '@angular/common/http';



export interface MeasurementSummaryModel {
  MeasurementCode: string;
  MeasurementShortDesc?: string; // only for per-measurement
  Department?: string;           // only for per-department
  Mone: number;
  Mechane: number;
  Grade: number | null;
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

selectedYear: number | null = null;
selectedQuarter: string | null = null;
selectedMonth: string | null = null;
selectedDepartment: string | null = null;
selectedMeasurement: string | null = null;

  measurementDataSource = new MatTableDataSource<MeasurementSummaryModel>();
  departmentDataSource = new MatTableDataSource<MeasurementSummaryModel>();

  isLoading = true;

  @ViewChild('measurementPaginator') measurementPaginator!: MatPaginator;
  @ViewChild('departmentPaginator') departmentPaginator!: MatPaginator;

  @ViewChild('measurementSort') measurementSort!: MatSort;
  @ViewChild('departmentSort') departmentSort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchSummaryByMeasurement();
    this.fetchSummaryByDepartment();
    this.loadDepartments();
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear, currentYear + 1];
    this.fetchMeasurement()
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.measurementDataSource.paginator = this.measurementPaginator;
      this.measurementDataSource.sort = this.measurementSort;
  
      this.departmentDataSource.paginator = this.departmentPaginator;
      this.departmentDataSource.sort = this.departmentSort;
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
  resetFilter(): void {
    this.selectedYear = null;
    this.selectedQuarter = null;
    this.selectedMonth = null;
    this.selectedDepartment = null;
    this.selectedMeasurement = null;
    this.applyFilter();
  }

  applyFilter(): void {
    const params: { [key: string]: string } = {};
  
    if (this.selectedYear) {
      params['year'] = this.selectedYear.toString();
    }
    if (this.selectedYear && !this.selectedQuarter && !this.selectedMonth) {
      params['fromDate'] = `${this.selectedYear}-01-01`;
      params['toDate'] = `${this.selectedYear}-12-31`;
    }
    if (this.selectedQuarter) {
      const quarterMap = {
        Q1: ['01', '03'],
        Q2: ['04', '06'],
        Q3: ['07', '09'],
        Q4: ['10', '12']
      };
      const [startMonth, endMonth] = quarterMap[this.selectedQuarter as 'Q1' | 'Q2' | 'Q3' | 'Q4'];
      params['fromDate'] = `${this.selectedYear}-${startMonth}-01`;
      params['toDate'] = `${this.selectedYear}-${endMonth}-31`;
    } else if (this.selectedMonth) {
      const monthIndex = this.months.indexOf(this.selectedMonth) + 1;
      const monthStr = monthIndex.toString().padStart(2, '0');
      params['fromDate'] = `${this.selectedYear}-${monthStr}-01`;
      params['toDate'] = `${this.selectedYear}-${monthStr}-31`;
    }
  
    if (this.selectedDepartment) {
      params['departments'] = this.selectedDepartment;
    }
  
    if (this.selectedMeasurement) {
      params['measurement'] = this.selectedMeasurement;
    }
  
    this.http.get<MeasurementSummaryModel[]>(
      `${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByMeasurement`, { params }
    ).subscribe(data => {
      this.measurementDataSource.data = data;
      this.measurementDataSource.filter = ''; // ✅ clear filter
    });
  
    this.http.get<MeasurementSummaryModel[]>(
      `${environment.apiUrl}/MeasurementDataMoshe/GetSummaryByDepartment`, { params }
    ).subscribe(data => {
      this.departmentDataSource.data = data;
      this.departmentDataSource.filter = ''; // ✅ clear filter
    });
  }
  
  
  
  
}
