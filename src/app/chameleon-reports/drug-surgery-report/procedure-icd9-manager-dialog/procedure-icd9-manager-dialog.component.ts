import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';


@Component({
  selector: 'app-procedure-icd9-manager-dialog',
  templateUrl: './procedure-icd9-manager-dialog.component.html'
})
export class ProcedureICD9ManagerDialogComponent implements OnInit {
  displayedColumns: string[] = ['ProcedureICD9', 'Name', 'Active'];
  fullData: any[] = [];
  filteredData: any[] = [];

  searchControl = new FormControl('');
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    public dialogRef: MatDialogRef<ProcedureICD9ManagerDialogComponent>,
    private http: HttpClient
  ) {}
  ngOnInit(): void {
    this.loadData();
    this.searchControl.valueChanges.subscribe(value => this.applyFilter(value || ''));
  }

  loadData(): void {
    this.http.get<any[]>(`${environment.apiUrl}DrugSurgeryReport/ProcedureICD9Cleaned`).subscribe(data => {
      this.fullData = data;
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  
  applyFilter(searchText: string): void {
    const filterValue = (searchText || '').trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.dataSource.filterPredicate = (data, filter) =>
      (data.ProcedureICD9?.toLowerCase() || '').includes(filter) ||
      (data.Name?.toLowerCase() || '').includes(filter);
  }
  
  onToggleActive(row: any): void {
    this.http.post(`${environment.apiUrl}DrugSurgeryReport/ProcedureICD9Cleaned/Update`, row).subscribe();
  }
}
