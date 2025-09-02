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

@Component({
  selector: 'app-breastfeeding-coordinator',
  templateUrl: './breastfeeding-coordinator.component.html',
  styleUrls: ['./breastfeeding-coordinator.component.scss']
})
export class BreastfeedingCoordinatorComponent implements OnInit, AfterViewInit {
  data: BreastfeedingCoordinatorModel[] = [];
  filteredData = new MatTableDataSource<BreastfeedingCoordinatorModel>();
  selectedView: 'Year' | 'Querter' | 'Month' = 'Year';

  // 👇 columns reflect lower-camel keys
  displayedColumns: string[] = ['periodDesc', 'onTime', 'notNoTime', 'onTimeConseltationPerc'];

  noOnTimeConsultations: BreastfeedingNoOnTimeConsultationModel[] = [];
  noOnTimeConsultationsDataSource = new MatTableDataSource<BreastfeedingNoOnTimeConsultationModel>();
  noOnTimeConsultationsDisplayedColumns: string[] = ['admission_No', 'first_Name', 'last_Name', 'h_DOB', 'h_DOB_TIME'];

  maternityNoConsultationData: MaternityNoConsultationModel[] = [];
  maternityDataSource = new MatTableDataSource<MaternityNoConsultationModel>();
  maternityDisplayedColumns: string[] = ['admission_No', 'first_Name', 'last_Name', 'birthDate', 'timeFromDelivery', 'timeFromDeliveryInMinute'];

  private _summaryPaginator!: MatPaginator;
  @ViewChild('summaryPaginator') set summaryPaginatorSetter(p: MatPaginator) {
    this._summaryPaginator = p;
    if (this.filteredData) this.filteredData.paginator = p;
  }
  get summaryPaginator(): MatPaginator {
    return this._summaryPaginator;
  }

  private _summarySort!: MatSort;
  @ViewChild('summarySort') set summarySortSetter(s: MatSort) {
    this._summarySort = s;
    if (this.filteredData) this.filteredData.sort = s;
  }
  get summarySort(): MatSort {
    return this._summarySort;
  }

  // Same for maternity table:
  private _maternityPaginator!: MatPaginator;
  @ViewChild('maternityPaginator') set maternityPaginatorSetter(p: MatPaginator) {
    this._maternityPaginator = p;
    if (this.maternityDataSource) this.maternityDataSource.paginator = p;
  }
  get maternityPaginator(): MatPaginator {
    return this._maternityPaginator;
  }

  private _maternitySort!: MatSort;
  @ViewChild('maternitySort') set maternitySortSetter(s: MatSort) {
    this._maternitySort = s;
    if (this.maternityDataSource) this.maternityDataSource.sort = s;
  }
  get maternitySort(): MatSort {
    return this._maternitySort;
  }

  private _noOnTimePaginator!: MatPaginator;
  @ViewChild('noOnTimePaginator') set noOnTimePaginatorSetter(p: MatPaginator) {
    this._noOnTimePaginator = p;
    if (this.noOnTimeConsultationsDataSource) {
      this.noOnTimeConsultationsDataSource.paginator = p;
    }
  }
  get noOnTimePaginator(): MatPaginator {
    return this._noOnTimePaginator;
  }

  private _noOnTimeSort!: MatSort;
  @ViewChild('noOnTimeSort') set noOnTimeSortSetter(s: MatSort) {
    this._noOnTimeSort = s;
    if (this.noOnTimeConsultationsDataSource) {
      this.noOnTimeConsultationsDataSource.sort = s;
    }
  }
  get noOnTimeSort(): MatSort {
    return this._noOnTimeSort;
  }

  isLoading = true;
  validPercMonth: number = 0;
  validPercYear: number = 0;

  monthValid: number = 0;
  monthNotValid: number = 0;
  monthTotal: number = 0;

  yearValid: number = 0;
  yearNotValid: number = 0;
  yearTotal: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      summary: this.http.get<BreastfeedingCoordinatorModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator`),
      maternity: this.http.get<MaternityNoConsultationModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator/NoConsultationCurrentHospitalize`),
      noOnTime: this.http.get<BreastfeedingNoOnTimeConsultationModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator/NoOnTimeConsultations`)
    }).subscribe({
      next: ({ summary, maternity, noOnTime }) => {
        // Assuming backend now sends lower-camel keys
        this.data = summary;
        this.applyFilter();

        this.maternityNoConsultationData = maternity;
        this.maternityDataSource.data = maternity;

        this.noOnTimeConsultations = noOnTime;
        this.noOnTimeConsultationsDataSource.data = noOnTime;

        this.calculateGauges(summary);
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

  onRadioChange(): void {
    this.applyFilter();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.summaryPaginator) this.filteredData.paginator = this.summaryPaginator;
      if (this.summarySort) this.filteredData.sort = this.summarySort;

      if (this.maternityPaginator) this.maternityDataSource.paginator = this.maternityPaginator;
      if (this.maternitySort) this.maternityDataSource.sort = this.maternitySort;
    });

    // If you meant to sort maternity by its own sort, keep it as above (don’t bind to summarySort)
    // this.maternityDataSource.sort = this.summarySort; // <- remove if not intended
  }

  getRowColorClass(row: MaternityNoConsultationModel): string {
    const minutes = row.timeFromDeliveryInMinute;

    if (minutes <= 360) {
      return 'row-green';
    } else if (minutes > 360 && minutes <= 900) {
      return 'row-orange';
    } else if (minutes > 900 && minutes <= 1440) {
      return 'row-red';
    } else {
      return '';
    }
  }

  calculateGauges(summary: BreastfeedingCoordinatorModel[]): void {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    // Monthly
    const monthData = summary.filter(d => d.dataType === 'Month' && d.yearNum === thisYear && d.periodNum === thisMonth);
    this.monthValid = monthData.reduce((sum, d) => sum + d.onTime, 0);
    this.monthNotValid = monthData.reduce((sum, d) => sum + d.notNoTime, 0);
    this.monthTotal = this.monthValid + this.monthNotValid;
    this.validPercMonth = this.monthTotal > 0 ? (this.monthValid / this.monthTotal) * 100 : 0;

    // Yearly
    const yearData = summary.filter(d => d.dataType === 'Year' && d.yearNum === thisYear);
    this.yearValid = yearData.reduce((sum, d) => sum + d.onTime, 0);
    this.yearNotValid = yearData.reduce((sum, d) => sum + d.notNoTime, 0);
    this.yearTotal = this.yearValid + this.yearNotValid;
    this.validPercYear = this.yearTotal > 0 ? (this.yearValid / this.yearTotal) * 100 : 0;
  }

  getMonthGaugeColor(): string {
    return this.validPercMonth >= 90 ? 'green' : 'red';
  }

  getYearGaugeColor(): string {
    return this.validPercYear >= 90 ? 'green' : 'red';
  }
}
