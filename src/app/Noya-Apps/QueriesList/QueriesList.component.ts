import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { QueriesDialogComponent } from './QL-dialog.component';

export interface QueryItem {
  id: number;
  queryName: string;
  queryText: string;
  description: string;
  subject: string;
  subSubject: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt?: string | null;
}

@Component({
  selector: 'app-QueriesList',
  templateUrl: './QueriesList.component.html',
  styleUrls: ['./QueriesList.component.scss']
})
export class QueriesListComponent implements OnInit {

  displayedColumns = [
    'id', 'queryName', 'description', 'subject', 'subSubject', 'isActive', 
    'createdBy', 'createdAt', 'actions'
  ];
  
  dataSource = new MatTableDataSource<QueryItem>();
  globalFilter = new FormControl('');

  base = 'http://localhost:44310'; // API host

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  currentUser = 'SYSTEM'; // replace with auth service if needed

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadQueries();
    this.globalFilter.valueChanges.subscribe(() => this.applyFilter());
  }

  loadQueries(): void {
    this.http.get<QueryItem[]>(`${this.base}/api/QueriesList/list`)
      .subscribe(rows => {
        this.dataSource.data = rows;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
  }

  applyFilter(): void {
    const text = (this.globalFilter.value ?? '').trim().toLowerCase();
    this.dataSource.filterPredicate = (row) => {
      const haystack = `${row.id}|${row.queryName}|${row.description}|${row.subject}|${row.subSubject}|${row.createdBy}`.toLowerCase();
      return haystack.includes(text);
    };
    this.dataSource.filter = text;
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(QueriesDialogComponent, {
      width: '800px',
      data: { mode: 'add', currentUser: this.currentUser }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadQueries();
    });
  }

  onEdit(row: QueryItem): void {
    const dialogRef = this.dialog.open(QueriesDialogComponent, {
      width: '800px',
      data: { mode: 'edit', row, currentUser: this.currentUser }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadQueries();
    });
  }

  onDelete(row: QueryItem): void {
    if (!row.id) return;
    if (!confirm(`Are you sure you want to delete "${row.queryName}"?`)) return;

    this.http.post(`${this.base}/api/QueriesList/delete`, [row.id])
      .subscribe(() => this.loadQueries());
  }
}
