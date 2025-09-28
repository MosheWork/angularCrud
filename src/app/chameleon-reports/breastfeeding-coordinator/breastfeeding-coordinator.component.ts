import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

export interface BreastfeedingNoOnTimeConsultationModel {
  admission_No: string;
  first_Name: string;
  last_Name: string;
  h_DOB: Date | null;
  h_DOB_TIME: string;
}

export interface BreastfeedingCoordinatorModel {
  dataType: 'Year' | 'Querter' | 'Month';
  yearNum: number;
  periodNum: number;
  periodDesc: string;
  onTime: number;
  notNoTime: number;
  onTimeConseltationPerc: number;
}

export interface MaternityNoConsultationModel {
  admission_No: string;
  first_Name: string;
  last_Name: string;
  birthDate: string;
  timeFromDelivery: string;
  timeFromDeliveryInMinute: number;
}

/** NEW: last-24h model (keys assumed lower-camel like other endpoints) */
export interface FirstConsultLast24hModel {
  admission_No: string;
  first_Name: string;
  last_Name: string;
  /** server returns already formatted dd/MM/yyyy HH:mm — show as-is */
  birthDate: string;
  /** may be Date string or null */
  timeConseltation: string | Date | null;
  /** 1 = on-time (under 24h), 0 = not on-time */
  onTimeFirstConseltation: number;
}

@Component({
  selector: 'app-breastfeeding-coordinator',
  templateUrl: './breastfeeding-coordinator.component.html',
  styleUrls: ['./breastfeeding-coordinator.component.scss']
})
export class BreastfeedingCoordinatorComponent implements OnInit, AfterViewInit {
  // ===== Summary (Year/Quarter/Month) =====
  data: BreastfeedingCoordinatorModel[] = [];
  filteredData = new MatTableDataSource<BreastfeedingCoordinatorModel>();
  selectedView: 'Year' | 'Querter' | 'Month' = 'Year';
  displayedColumns: string[] = ['periodDesc', 'onTime', 'notNoTime', 'onTimeConseltationPerc'];
  onTime24Filter: 'all' | 'yes' | 'no' = 'all';

  // ===== No consultation while hospitalized =====
  maternityNoConsultationData: MaternityNoConsultationModel[] = [];
  maternityDataSource = new MatTableDataSource<MaternityNoConsultationModel>();
  maternityDisplayedColumns: string[] = ['admission_No', 'first_Name', 'last_Name', 'birthDate', 'timeFromDelivery', 'timeFromDeliveryInMinute'];

  // ===== No on-time consultations =====
  noOnTimeConsultations: BreastfeedingNoOnTimeConsultationModel[] = [];
  noOnTimeConsultationsDataSource = new MatTableDataSource<BreastfeedingNoOnTimeConsultationModel>();
  noOnTimeConsultationsDisplayedColumns: string[] = ['admission_No', 'first_Name', 'last_Name', 'h_DOB', 'h_DOB_TIME'];

  // ===== NEW: Last 24h first consultations =====
  last24Data: FirstConsultLast24hModel[] = [];
  last24DataSource = new MatTableDataSource<FirstConsultLast24hModel>();
  last24DisplayedColumns: string[] = ['admission_No', 'first_Name', 'last_Name', 'birthDate', 'timeConseltation', 'onTimeFirstConseltation'];

  // Paginators & sorts
  private _summaryPaginator!: MatPaginator;
  @ViewChild('summaryPaginator') set summaryPaginatorSetter(p: MatPaginator) {
    this._summaryPaginator = p;
    if (this.filteredData) this.filteredData.paginator = p;
  }
  get summaryPaginator(): MatPaginator { return this._summaryPaginator; }

  private _summarySort!: MatSort;
  @ViewChild('summarySort') set summarySortSetter(s: MatSort) {
    this._summarySort = s;
    if (this.filteredData) this.filteredData.sort = s;
  }
  get summarySort(): MatSort { return this._summarySort; }

  private _maternityPaginator!: MatPaginator;
  @ViewChild('maternityPaginator') set maternityPaginatorSetter(p: MatPaginator) {
    this._maternityPaginator = p;
    if (this.maternityDataSource) this.maternityDataSource.paginator = p;
  }
  get maternityPaginator(): MatPaginator { return this._maternityPaginator; }

  private _maternitySort!: MatSort;
  @ViewChild('maternitySort') set maternitySortSetter(s: MatSort) {
    this._maternitySort = s;
    if (this.maternityDataSource) this.maternityDataSource.sort = s;
  }
  get maternitySort(): MatSort { return this._maternitySort; }

  private _noOnTimePaginator!: MatPaginator;
  @ViewChild('noOnTimePaginator') set noOnTimePaginatorSetter(p: MatPaginator) {
    this._noOnTimePaginator = p;
    if (this.noOnTimeConsultationsDataSource) this.noOnTimeConsultationsDataSource.paginator = p;
  }
  get noOnTimePaginator(): MatPaginator { return this._noOnTimePaginator; }

  private _noOnTimeSort!: MatSort;
  @ViewChild('noOnTimeSort') set noOnTimeSortSetter(s: MatSort) {
    this._noOnTimeSort = s;
    if (this.noOnTimeConsultationsDataSource) this.noOnTimeConsultationsDataSource.sort = s;
  }
  get noOnTimeSort(): MatSort { return this._noOnTimeSort; }

  /** NEW: last 24h paginator/sort */
  private _last24Paginator!: MatPaginator;
  @ViewChild('last24Paginator') set last24PaginatorSetter(p: MatPaginator) {
    this._last24Paginator = p;
    if (this.last24DataSource) this.last24DataSource.paginator = p;
  }
  get last24Paginator(): MatPaginator { return this._last24Paginator; }

  private _last24Sort!: MatSort;
  @ViewChild('last24Sort') set last24SortSetter(s: MatSort) {
    this._last24Sort = s;
    if (this.last24DataSource) this.last24DataSource.sort = s;
  }
  get last24Sort(): MatSort { return this._last24Sort; }

  // Gauges
  isLoading = true;
  validPercMonth = 0;
  validPercYear = 0;
  monthValid = 0; monthNotValid = 0; monthTotal = 0;
  yearValid = 0;  yearNotValid  = 0;  yearTotal  = 0;

  /** NEW: last-24h gauge numbers */
  validPercLast24 = 0;
  last24Valid = 0;
  last24NotValid = 0;
  last24Total = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      summary:  this.http.get<BreastfeedingCoordinatorModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator`),
      maternity: this.http.get<MaternityNoConsultationModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator/NoConsultationCurrentHospitalize`),
      noOnTime: this.http.get<BreastfeedingNoOnTimeConsultationModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator/NoOnTimeConsultations`),
      /** NEW: last-24h feed */
      last24:   this.http.get<FirstConsultLast24hModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator/FirstConsultationsLast24h`)
    }).subscribe({
      next: ({ summary, maternity, noOnTime, last24 }) => {
        // Summary
        this.data = summary;
        this.applyFilter();

        // Maternity
        this.maternityNoConsultationData = maternity;
        this.maternityDataSource.data = maternity;

        // No on-time
        this.noOnTimeConsultations = noOnTime;
        this.noOnTimeConsultationsDataSource.data = noOnTime;

        // NEW: last 24h
        this.last24Data = (last24 || []).map(r => ({
          ...r,
          // ensure a clean string (avoid nulls)
          birthDate: (r.birthDate || '').toString()
        }));
        this.last24DataSource.data = this.last24Data;

        // Gauges
        this.calculateGauges(summary);
        this.calculateLast24Gauge(this.last24Data);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching data', err);
        this.isLoading = false;
      }
    });
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<BreastfeedingCoordinatorModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator`)
      .subscribe({
        next: (data) => {
          this.data = data;
          this.applyFilter();
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  fetchMaternityNoConsultation(): void {
    this.http.get<MaternityNoConsultationModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator/NoConsultationCurrentHospitalize`)
      .subscribe({
        next: data => {
          this.maternityNoConsultationData = data;
          this.maternityDataSource.data = data;
        },
        error: err => console.error('❌ Failed to fetch maternity consultation data', err)
      });
  }

  applyFilter(): void {
    const filtered = this.data.filter(row => row.dataType === this.selectedView);
    this.filteredData.data = filtered;

    setTimeout(() => {
      if (this.summaryPaginator) this.filteredData.paginator = this.summaryPaginator;
      if (this.summarySort) this.filteredData.sort = this.summarySort;
    });
  }

  onRadioChange(): void { this.applyFilter(); }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.summaryPaginator) this.filteredData.paginator = this.summaryPaginator;
      if (this.summarySort) this.filteredData.sort = this.summarySort;

      if (this.maternityPaginator) this.maternityDataSource.paginator = this.maternityPaginator;
      if (this.maternitySort) this.maternityDataSource.sort = this.maternitySort;

      if (this.last24Paginator) this.last24DataSource.paginator = this.last24Paginator;
      if (this.last24Sort) this.last24DataSource.sort = this.last24Sort;
    });
  }

  getRowColorClass(row: MaternityNoConsultationModel): string {
    const minutes = row.timeFromDeliveryInMinute;

    if (minutes <= 360) return 'row-green';
    if (minutes > 360 && minutes <= 900) return 'row-orange';
    if (minutes > 900 && minutes <= 1440) return 'row-red';
    return '';
  }

  calculateGauges(summary: BreastfeedingCoordinatorModel[]): void {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    // Month
    const monthData = summary.filter(d => d.dataType === 'Month' && d.yearNum === thisYear && d.periodNum === thisMonth);
    this.monthValid = monthData.reduce((sum, d) => sum + d.onTime, 0);
    this.monthNotValid = monthData.reduce((sum, d) => sum + d.notNoTime, 0);
    this.monthTotal = this.monthValid + this.monthNotValid;
    this.validPercMonth = this.monthTotal > 0 ? (this.monthValid / this.monthTotal) * 100 : 0;

    // Year
    const yearData = summary.filter(d => d.dataType === 'Year' && d.yearNum === thisYear);
    this.yearValid = yearData.reduce((sum, d) => sum + d.onTime, 0);
    this.yearNotValid = yearData.reduce((sum, d) => sum + d.notNoTime, 0);
    this.yearTotal = this.yearValid + this.yearNotValid;
    this.validPercYear = this.yearTotal > 0 ? (this.yearValid / this.yearTotal) * 100 : 0;
  }

  /** NEW: 24h gauge */
  calculateLast24Gauge(list: FirstConsultLast24hModel[]): void {
    this.last24Total = list.length;
    this.last24Valid = list.reduce((sum, r) => sum + (r.onTimeFirstConseltation ? 1 : 0), 0);
    this.last24NotValid = this.last24Total - this.last24Valid;
    this.validPercLast24 = this.last24Total > 0 ? (this.last24Valid / this.last24Total) * 100 : 0;
  }

  getMonthGaugeColor(): string { return this.validPercMonth >= 90 ? 'green' : 'red'; }
  getYearGaugeColor(): string  { return this.validPercYear  >= 90 ? 'green' : 'red'; }
  /** NEW */
  getLast24GaugeColor(): string { return this.validPercLast24 >= 90 ? 'green' : 'red'; }

  applyLast24Filter(): void {
    let base = this.last24Data;
  
    if (this.onTime24Filter === 'yes') {
      base = base.filter(r => !!r.onTimeFirstConseltation);
    } else if (this.onTime24Filter === 'no') {
      base = base.filter(r => !r.onTimeFirstConseltation);
    }
  
    this.last24DataSource.data = base;
  
    // keep paginator/sort wired after data swap
    setTimeout(() => {
      if (this.last24Paginator) this.last24DataSource.paginator = this.last24Paginator;
      if (this.last24Sort) this.last24DataSource.sort = this.last24Sort;
    });
  }
  
}
