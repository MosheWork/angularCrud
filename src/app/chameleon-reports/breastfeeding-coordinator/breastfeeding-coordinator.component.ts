import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';



export interface BreastfeedingCoordinatorModel {
  DataType: 'Year' | 'Querter' | 'Month';
  YearNum: number;
  PeriodNum: number;
  PeriodDesc: string;
  OnTime: number;
  NotNoTime: number;
  OnTimeConseltationPerc: number;
}
export interface MaternityNoConsultationModel {
  Admission_No: string;
  First_Name: string;
  Last_Name: string;
  BirthDate: string;
  TimeFromDelivery: string;
  TimeFromDeliveryInMinute: number;
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

  displayedColumns: string[] = ['PeriodDesc', 'OnTime', 'NotNoTime', 'OnTimeConseltationPerc'];

  maternityNoConsultationData: MaternityNoConsultationModel[] = [];
maternityDataSource = new MatTableDataSource<MaternityNoConsultationModel>();
maternityDisplayedColumns: string[] = ['Admission_No', 'First_Name', 'Last_Name', 'BirthDate', 'TimeFromDelivery', 'TimeFromDeliveryInMinute'];

@ViewChild('summaryPaginator') summaryPaginator!: MatPaginator;
@ViewChild('summarySort') summarySort!: MatSort;

@ViewChild('maternityPaginator') maternityPaginator!: MatPaginator;
@ViewChild('maternitySort') maternitySort!: MatSort;

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
      maternity: this.http.get<MaternityNoConsultationModel[]>(`${environment.apiUrl}/BreastfeedingCoordinator/NoConsultationCurrentHospitalize`)
    }).subscribe({
      next: ({ summary, maternity }) => {
        this.data = summary;
        this.applyFilter();
  
        this.maternityNoConsultationData = maternity;
        this.maternityDataSource.data = maternity;
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
    const filtered = this.data.filter(row => row.DataType === this.selectedView);
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
  }
  
  getRowColorClass(row: MaternityNoConsultationModel): string {
    const minutes = row.TimeFromDeliveryInMinute;
  
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
    const monthData = summary.filter(d => d.DataType === 'Month' && d.YearNum === thisYear && d.PeriodNum === thisMonth);
    this.monthValid = monthData.reduce((sum, d) => sum + d.OnTime, 0);
    this.monthNotValid = monthData.reduce((sum, d) => sum + d.NotNoTime, 0);
    this.monthTotal = this.monthValid + this.monthNotValid;
    this.validPercMonth = this.monthTotal > 0 ? (this.monthValid / this.monthTotal) * 100 : 0;
  
    // Yearly
    const yearData = summary.filter(d => d.DataType === 'Year' && d.YearNum === thisYear);
    this.yearValid = yearData.reduce((sum, d) => sum + d.OnTime, 0);
    this.yearNotValid = yearData.reduce((sum, d) => sum + d.NotNoTime, 0);
    this.yearTotal = this.yearValid + this.yearNotValid;
    this.validPercYear = this.yearTotal > 0 ? (this.yearValid / this.yearTotal) * 100 : 0;
  }
  
  
}
