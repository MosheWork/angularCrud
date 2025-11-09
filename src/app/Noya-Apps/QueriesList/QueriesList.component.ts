import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
export class QueriesListComponent implements OnInit, AfterViewInit {

  // Define displayed columns without 'select' and 'actions'
  displayedColumns = ['id', 'queryName', 'description', 'subject', 'subSubject', 'isActive', 'createdBy', 'createdAt'];
  displayedColumnsWithSelect = ['select', ...this.displayedColumns];  // Add 'select' to the beginning for checkbox column

  dataSource = new MatTableDataSource<QueryItem>();

  // Filters
  globalFilter = new FormControl('');
  filterQueryName = new FormControl('');
  filterSubject = new FormControl('');
  filterSubSubject = new FormControl('');
  filterStatus = new FormControl('');

  // Selection state
  selection = new Set<number>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  currentUser = 'SYSTEM'; // Replace with actual auth logic
  base = 'http://localhost:44310'; // API host

  constructor(private http: HttpClient, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadQueries();

    // Apply filters on value changes
    const applyFilters = () => {
      const globalValue = (this.globalFilter.value || '').trim().toLowerCase();
      const queryNameValue = (this.filterQueryName.value || '').toLowerCase();
      const subjectValue = (this.filterSubject.value || '').toLowerCase();
      const subSubjectValue = (this.filterSubSubject.value || '').toLowerCase();
      const statusValue = this.filterStatus.value;

      this.dataSource.filterPredicate = (row: QueryItem) => {
        const matchGlobal = `${row.id}|${row.queryName}|${row.description}|${row.subject}|${row.subSubject}|${row.createdBy}`
          .toLowerCase().includes(globalValue);

        const matchQueryName = row.queryName.toLowerCase().includes(queryNameValue);
        const matchSubject = row.subject.toLowerCase().includes(subjectValue);
        const matchSub = row.subSubject.toLowerCase().includes(subSubjectValue);

        let matchStatus = true;
        if (statusValue === 'active') matchStatus = row.isActive;
        else if (statusValue === 'inactive') matchStatus = !row.isActive;

        return matchGlobal && matchQueryName && matchSubject && matchSub && matchStatus;
      };

      // Trigger a re-filter when filters change
      this.dataSource.filter = Math.random().toString();
    };

    // Subscribe to filter changes
    [this.globalFilter, this.filterQueryName, this.filterSubject, this.filterSubSubject, this.filterStatus]
      .forEach(ctrl => ctrl.valueChanges.subscribe(applyFilters));
  }

  ngAfterViewInit(): void {
    // Initialize paginator and sort after view is initialized
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadQueries(): void {
    this.http.get<QueryItem[]>(`${this.base}/api/QueriesList/list`)
      .subscribe(rows => {
        console.log('Fetched rows:', rows); // Check data load in console
        this.dataSource.data = rows; // Assign fetched data to dataSource
      }, error => {
        console.error('Error fetching data:', error);
      });
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(QueriesDialogComponent, {
      width: '800px',
      data: { mode: 'add', currentUser: this.currentUser }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadQueries(); });
  }

  onEdit(row: QueryItem): void {
    const dialogRef = this.dialog.open(QueriesDialogComponent, {
      width: '800px',
      data: { mode: 'edit', row, currentUser: this.currentUser }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadQueries(); });
  }

  onDelete(row: QueryItem): void {
    if (!row.id || !confirm(`Delete "${row.queryName}"?`)) return;
    this.http.post(`${this.base}/api/QueriesList/delete`, [row.id])
      .subscribe(() => this.loadQueries());
  }

  toggleSelection(row: QueryItem) {
    if (this.selection.has(row.id)) {
      this.selection.delete(row.id);
    } else {
      this.selection.add(row.id);
    }
  }

  toggleAllSelection(event: any) {
    const filteredRows = this.dataSource.filteredData;
    if (event.checked) {
      filteredRows.forEach(row => this.selection.add(row.id));
    } else {
      filteredRows.forEach(row => this.selection.delete(row.id));
    }
  }

  isAllSelected() {
    const filteredRows = this.dataSource.filteredData;
    return filteredRows.every(row => this.selection.has(row.id)) && filteredRows.length > 0;
  }

  isIndeterminate() {
    const filteredRows = this.dataSource.filteredData;
    const selectedCount = filteredRows.filter(r => this.selection.has(r.id)).length;
    return selectedCount > 0 && selectedCount < filteredRows.length;
  }

  hasSelection() {
    return this.selection.size > 0;
  }

  onDeleteSelected() {
    if (!this.hasSelection() || !confirm(`Delete ${this.selection.size} selected queries?`)) return;
    const ids = Array.from(this.selection);
    this.http.post(`${this.base}/api/QueriesList/delete`, ids)
      .subscribe(() => { this.loadQueries(); this.selection.clear(); });
  }

  resetFilters() {
    this.globalFilter.setValue('');
    this.filterQueryName.setValue('');
    this.filterSubject.setValue('');
    this.filterSubSubject.setValue('');
    this.filterStatus.setValue('');
  }
}
