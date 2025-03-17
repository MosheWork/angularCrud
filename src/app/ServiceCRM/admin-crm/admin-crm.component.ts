import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-admin-crm',
  templateUrl: './admin-crm.component.html',
  styleUrls: ['./admin-crm.component.scss']
})
export class AdminCrmComponent implements OnInit {
  summary: any;
  summaryWithCaseManager: any;
  displayedColumns: string[] = [
    'CaseNumber', 'DepartmentName', 'EnterDepartDate', 'EnterDepartTime', 'ExitHospTime',
    'LastName', 'FirstName', 'Telephone', 'Mobile', 'BirthDate', 'DeathDate',
    'IsBirthday', 'CaseManagerStatus', 'CaseManagerCategory', 'CaseManagerUpdate', 'CaseManagerRemarks'
  ];

  dataSource = new MatTableDataSource<any>([]);
  isLoading: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchSummaries();
  }

  fetchData(): void {
    this.isLoading = true;

    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/withCaseManager`).subscribe(data => {
      this.dataSource.data = data.map(item => ({
        ...item,
        EnterDepartDate: item.EnterDepartDate ? new Date(item.EnterDepartDate) : null,
        CaseManagerUpdate: item.CaseManagerUpdate ? new Date(item.CaseManagerUpdate) : null
      }));

      this.isLoading = false;

      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
    });
  }
  fetchSummaries(): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/summary`).subscribe(data => {
      this.summary = data;
    });
  
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/summaryWithCaseManager`).subscribe(data => {
      this.summaryWithCaseManager = data;
    });
  }
  

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

}
