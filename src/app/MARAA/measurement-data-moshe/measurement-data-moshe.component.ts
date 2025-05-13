import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';


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
}
