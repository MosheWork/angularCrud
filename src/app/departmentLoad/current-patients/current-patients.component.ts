import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';

export interface ChamelleonCurrentPatientsModel {
  row_ID: number;
  caseNumber: string;
  idNumber: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  age: string;
  departName: string;
  hospitalizationDate: Date;
  hospitalizationDuration: number;
  foodType: string;
  foodTexture: string;
  currentAllergy: string;
  oldAllergy: string;
  roomNumber: string;
  unitType: string;
}



@Component({
  selector: 'app-current-patients',
  templateUrl: './current-patients.component.html',
  styleUrls: ['./current-patients.component.scss']
})
export class CurrentPatientsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['row_ID', 'caseNumber', 'idNumber', 'firstName', 'lastName', 
  'age', 'departName', 'hospitalizationDate', 'hospitalizationDuration', 'foodType', 
  'foodTexture', 'currentAllergy', 'oldAllergy', 'roomNumber', 'unitType'];
  dataSource = new MatTableDataSource<ChamelleonCurrentPatientsModel>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCurrentPatients();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchCurrentPatients(): void {
    this.http.get<ChamelleonCurrentPatientsModel[]>(`${environment.apiUrl}ChamelleonCurrentPatientsAPI/GetCurrentPatientsInHospital`)
      .subscribe(data => {
        this.dataSource.data = data;
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
