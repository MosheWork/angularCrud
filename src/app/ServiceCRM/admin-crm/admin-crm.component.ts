import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AdminCrmRow {
  caseNumber: string;
  departmentName: string;
  enterDepartDate: Date | null;
  enterDepartTime: string | null;
  exitHospTime: string | null;
  lastName: string;
  firstName: string;
  telephone: string;
  mobile: string;
  birthDate: Date | null;
  deathDate: Date | null;
  isBirthday: boolean | null;
  caseManagerStatus: string;
  caseManagerCategory: string;
  caseManagerUpdate: Date | null;
  caseManagerRemarks: string;
}

@Component({
  selector: 'app-admin-crm',
  templateUrl: './admin-crm.component.html',
  styleUrls: ['./admin-crm.component.scss']
})
export class AdminCrmComponent implements OnInit {
  summary: any;
  summaryWithCaseManager: any;

  // use lower-camel across the table
  displayedColumns: string[] = [
    'caseNumber', 'departmentName', 'enterDepartDate', 'enterDepartTime', 'exitHospTime',
    'lastName', 'firstName', 'telephone', 'mobile', 'birthDate', 'deathDate',
    'isBirthday', 'caseManagerStatus', 'caseManagerCategory', 'caseManagerUpdate', 'caseManagerRemarks'
  ];

  dataSource = new MatTableDataSource<AdminCrmRow>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchSummaries();

    // robust contains-everything filter
    this.dataSource.filterPredicate = (row: AdminCrmRow, filter: string) => {
      const values = Object.values(row).map(v =>
        v instanceof Date ? v.toISOString() : (v ?? '').toString()
      );
      return values.join(' ').toLowerCase().includes(filter);
    };
  }

  private normalize(item: any): AdminCrmRow {
    return {
      caseNumber: item.caseNumber ?? item.CaseNumber ?? '',
      departmentName: item.departmentName ?? item.DepartmentName ?? '',
      enterDepartDate: item.enterDepartDate
        ? new Date(item.enterDepartDate)
        : item.EnterDepartDate
        ? new Date(item.EnterDepartDate)
        : null,
      enterDepartTime: item.enterDepartTime ?? item.EnterDepartTime ?? null,
      exitHospTime: item.exitHospTime ?? item.ExitHospTime ?? null,
      lastName: item.lastName ?? item.LastName ?? '',
      firstName: item.firstName ?? item.FirstName ?? '',
      telephone: item.telephone ?? item.Telephone ?? '',
      mobile: item.mobile ?? item.Mobile ?? '',
      birthDate: item.birthDate
        ? new Date(item.birthDate)
        : item.BirthDate
        ? new Date(item.BirthDate)
        : null,
      deathDate: item.deathDate
        ? new Date(item.deathDate)
        : item.DeathDate
        ? new Date(item.DeathDate)
        : null,
      isBirthday: item.isBirthday ?? item.IsBirthday ?? null,
      caseManagerStatus: item.caseManagerStatus ?? item.CaseManagerStatus ?? '',
      caseManagerCategory: item.caseManagerCategory ?? item.CaseManagerCategory ?? '',
      caseManagerUpdate: item.caseManagerUpdate
        ? new Date(item.caseManagerUpdate)
        : item.CaseManagerUpdate
        ? new Date(item.CaseManagerUpdate)
        : null,
      caseManagerRemarks: item.caseManagerRemarks ?? item.CaseManagerRemarks ?? ''
    };
  }

  fetchData(): void {
    this.isLoading = true;

    this.http.get<any[]>(`${environment.apiUrl}ServiceCRM/withCaseManager`).subscribe({
      next: (data) => {
        this.dataSource.data = data.map(d => this.normalize(d));
        this.isLoading = false;

        // attach paginator/sort after data arrives
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
        });
      },
      error: () => (this.isLoading = false)
    });
  }

  fetchSummaries(): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/summary`)
      .subscribe(data => (this.summary = data));
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/summaryWithCaseManager`)
      .subscribe(data => (this.summaryWithCaseManager = data));
  }

  ngAfterViewInit(): void {
    // in case data arrived before view init
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.dataSource.paginator?.firstPage();
  }
}
