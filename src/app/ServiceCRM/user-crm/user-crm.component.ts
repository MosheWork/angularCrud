import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-crm',
  templateUrl: './user-crm.component.html',
  styleUrls: ['./user-crm.component.scss']
})
export class UserCRMComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'CaseNumber', 'DepartmentName', 'EnterDepartDate', 'EnterDepartTime', 'ExitHospTime',
    'LastName', 'FirstName', 'Telephone', 'Mobile', 'BirthDate', 'DeathDate',
    'IsBirthday', 'CaseManagerStatus', 'CaseManagerCategory', 'CaseManagerUpdate' ,'CaseManagerRemarks',
  ];
  
  dataSource = new MatTableDataSource<any>([]);
  isLoading: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM`).subscribe(data => {
      this.dataSource.data = data;
      this.isLoading = false;

      // ✅ Ensure paginator & sort are set only after data is loaded
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
