import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { QueriesDialogComponent } from './QL-dialog.component';
import { QueriesViewDialogComponent } from './QueriesViewDialogComponent';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface QueryItem {
  id: number;
  queryName: string;
  queryText: string;
  description: string;
  subject: string;
  subSubject: string;
  isActive: boolean;
  createdBy: string; // store ID as string, display name mapped
  createdFor?: number;
  updatedBy: string;
  createdAt: string;
  updatedAt?: string | null;
  createdForName?: string;
  createdByName?: string;
}

export interface EmployeeLookupDto {
  employeeID: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-QueriesList',
  templateUrl: './QueriesList.component.html',
  styleUrls: ['./QueriesList.component.scss']
})
export class QueriesListComponent implements OnInit, AfterViewInit {

  titleUnit = 'שאילתות ';
  Title1 = ' רשימת שאילתות - ';
  Title2 = 'סה"כ תוצאות ';
  totalResults = 0;

  displayedColumns = [
    'id', 'queryName', 'description', 'subject', 'subSubject',
    'isActive', 'createdByName', 'createdForName', 'createdAt', 'updatedAt'
  ];
  displayedColumnsWithSelect = ['select', ...this.displayedColumns, 'actions'];

  headerLabels: Record<string,string> = {
    id: 'מזהה',
    queryName: 'שם השאילתא',
    description: 'תיאור',
    subject: 'נושא',
    subSubject: 'תת נושא',
    isActive: 'סטטוס',
    createdByName: 'נוצר על ידי',
    createdForName: 'נוצר עבור',
    createdAt: 'נוצר בתאריך',
    updatedAt: 'עודכן בתאריך',
    actions: 'פעולות'
  };

  dataSource = new MatTableDataSource<QueryItem>();
  filteredData: QueryItem[] = [];

  globalFilter = new FormControl('');
  filterQueryName = new FormControl('');
  filterSubject = new FormControl('');
  filterSubSubject = new FormControl('');
  filterCreatedFor = new FormControl('');
  filterCreatedBy = new FormControl('');
  filterStatus = new FormControl('');

  selection = new Set<number>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  currentUser = 'SYSTEM';
  base = 'http://localhost:44310';

  employeeLookup: Record<number, string> = {}; // for createdFor
  employeeCreatedByLookup: Record<number, string> = {}; // for createdBy

  constructor(private http: HttpClient, public dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {
    console.log('[QL] Component init');
    this.loadQueries();
    this.setupFilters();
    this.filterStatus.setValue('active');
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  // -------------------- Normalization --------------------
  private normalizeId(id?: number | string): string {
    if (id == null) return '';
    const num = typeof id === 'number' ? id : parseInt(id, 10);
    return num.toString().padStart(9, '0');
  }

  // -------------------- Load Queries --------------------
  async loadQueries(): Promise<void> {
    console.log('[QL] Loading queries...');
    try {
      const rows = await firstValueFrom(this.http.get<QueryItem[]>(`${this.base}/api/QueriesList/list`)) || [];
      console.log('[QL] Queries loaded (count):', rows.length, rows);

      await this.mapCreatedForNames(rows);
      await this.mapCreatedByNames(rows);

      this.dataSource.data = rows;

      if (this.sort) this.dataSource.sort = this.sort;
      if (this.paginator) this.dataSource.paginator = this.paginator;

      this.dataSource.filterPredicate = this.dataSource.filterPredicate || (() => true);
      this.dataSource.filter = Math.random().toString();
      this.filteredData = [...this.dataSource.filteredData];
      this.totalResults = this.filteredData.length;

      console.log('[QL] Queries assigned to table. totalResults=', this.totalResults);
      console.log('[QL] Sample mapped createdForName / createdByName:', this.filteredData.map(r => ({id: r.id, createdForName: r.createdForName, createdByName: r.createdByName})));
    } catch (err) {
      console.error('[QL] Failed to load queries:', err);
    }
  }

  // -------------------- Map Employee Names --------------------
  private async mapCreatedForNames(rows: QueryItem[]): Promise<void> {
    const uniqueIds = Array.from(new Set(
      rows.map(r => r.createdFor).filter(id => id != null)
    )) as number[];

    for (const id of uniqueIds) {
      if (this.employeeLookup[id]) continue;

      const padded = id.toString().padStart(9, '0');
      try {
        const res = await firstValueFrom(
          this.http.get<EmployeeLookupDto[]>(`${this.base}/api/EmployeeLookup/search?query=${padded}`)
        ) || [];
        this.employeeLookup[id] = res[0]?.fullName || '---';
      } catch {
        this.employeeLookup[id] = '---';
      }
    }

    rows.forEach(r => {
      r.createdForName = r.createdFor != null ? this.employeeLookup[r.createdFor] : '---';
    });
  }

  private async mapCreatedByNames(rows: QueryItem[]): Promise<void> {
    const uniqueIds = Array.from(new Set(
      rows.map(r => r.createdBy ? parseInt(r.createdBy, 10) : null).filter(id => id != null)
    )) as number[];

    for (const id of uniqueIds) {
      if (this.employeeCreatedByLookup[id]) continue;

      const padded = id.toString().padStart(9, '0');
      try {
        const res = await firstValueFrom(
          this.http.get<EmployeeLookupDto[]>(`${this.base}/api/EmployeeLookup/search?query=${padded}`)
        ) || [];
        this.employeeCreatedByLookup[id] = res[0]?.fullName || '---';
      } catch {
        this.employeeCreatedByLookup[id] = '---';
      }
    }

    rows.forEach(r => {
      r.createdByName = r.createdBy ? this.employeeCreatedByLookup[parseInt(r.createdBy, 10)] : '---';
    });
  }

  // -------------------- CRUD --------------------
  onAdd() {
    const ref = this.dialog.open(QueriesDialogComponent, { width: '800px', data: { mode: 'add', currentUser: this.currentUser } });
    ref.afterClosed().subscribe(ok => { if (ok) this.loadQueries(); });
  }

  onEdit(row: QueryItem) {
    const ref = this.dialog.open(QueriesDialogComponent, { width: '800px', data: { mode: 'edit', row, currentUser: this.currentUser } });
    ref.afterClosed().subscribe(ok => { if (ok) this.loadQueries(); });
  }

  onDelete(row: QueryItem) {
    if (!confirm(`למחוק את "${row.queryName}"?`)) return;
    this.http.post(`${this.base}/api/QueriesList/delete`, [row.id]).subscribe(() => this.loadQueries());
  }

  onDeleteSelected() {
    if (!this.selection.size || !confirm(`למחוק ${this.selection.size} שורות?`)) return;
    this.http.post(`${this.base}/api/QueriesList/delete`, [...this.selection]).subscribe(() => {
      this.selection.clear();
      this.loadQueries();
    });
  }

  onView(row: QueryItem) {
    this.dialog.open(QueriesViewDialogComponent, { width: '800px', data: { query: row } });
  }

  copyText(row: QueryItem) {
    navigator.clipboard.writeText(row.queryText).then(() => alert('הועתק!'));
  }

  // -------------------- Selection --------------------
  toggleSelection(row: QueryItem) {
    this.selection.has(row.id) ? this.selection.delete(row.id) : this.selection.add(row.id);
  }

  toggleAllSelection(event: any) {
    const checked = event.checked;
    this.dataSource.filteredData.forEach(r => checked ? this.selection.add(r.id) : this.selection.delete(r.id));
  }

  isAllSelected() {
    return this.dataSource.filteredData.length > 0 &&
           this.dataSource.filteredData.every(r => this.selection.has(r.id));
  }

  isIndeterminate() {
    const sel = this.dataSource.filteredData.filter(r => this.selection.has(r.id)).length;
    return sel > 0 && sel < this.dataSource.filteredData.length;
  }

  // -------------------- Filtering --------------------
  private setupFilters() {
    const apply = () => {
      const global = (this.globalFilter.value || '').toLowerCase();
      const qName = (this.filterQueryName.value || '').toLowerCase();
      const subject = (this.filterSubject.value || '').toLowerCase();
      const sub = (this.filterSubSubject.value || '').toLowerCase();
      const createdFor = (this.filterCreatedFor.value || '').toLowerCase();
      const createdBy = (this.filterCreatedBy.value || '').toLowerCase();
      const status = (this.filterStatus.value || '');

      this.dataSource.filterPredicate = (row: QueryItem, _filter: string) => {
        const matchGlobal = (`${row.id}|${row.queryName || ''}|${row.description || ''}|${row.subject || ''}|${row.subSubject || ''}|${row.createdByName || ''}|${row.createdForName || ''}`)
          .toLowerCase()
          .includes(global);

        const okName = (row.queryName || '').toLowerCase().includes(qName);
        const okSubject = (row.subject || '').toLowerCase().includes(subject);
        const okSub = (row.subSubject || '').toLowerCase().includes(sub);
        const okCreatedFor = (row.createdForName || '').toLowerCase().includes(createdFor);
        const okCreatedBy = (row.createdByName || '').toLowerCase().includes(createdBy);

        let okStatus = true;
        if (status === 'active') okStatus = !!row.isActive;
        else if (status === 'inactive') okStatus = !row.isActive;

        return Boolean(matchGlobal && okName && okSubject && okSub && okCreatedFor && okCreatedBy && okStatus);
      };

      this.dataSource.filter = Math.random().toString();
      this.filteredData = [...this.dataSource.filteredData];
      this.totalResults = this.filteredData.length;
    };

    [this.globalFilter, this.filterQueryName, this.filterSubject, this.filterSubSubject, this.filterCreatedFor, this.filterCreatedBy, this.filterStatus]
      .forEach(ctrl => ctrl.valueChanges.subscribe(apply));

    apply();
  }

  resetFilters() {
    this.globalFilter.setValue('');
    this.filterQueryName.setValue('');
    this.filterSubject.setValue('');
    this.filterSubSubject.setValue('');
    this.filterCreatedFor.setValue('');
    this.filterCreatedBy.setValue('');
    this.filterStatus.setValue('active');
  }

  // -------------------- Excel --------------------
  exportToExcel() {
    // apply the sort the user selected in the UI
    // this.dataSource.sort can be null (MatSort | null) so use the component ViewChild sort as a non-null fallback
    const sorted = this.dataSource.sortData(
      this.dataSource.filteredData,
      this.sort
    );

    // map dates to dd/mm/yy
    const dataToExport = sorted.map(row => ({
      ...row,
      createdAt: row.createdAt ? this.formatDate(row.createdAt) : '',
      updatedAt: row.updatedAt ? this.formatDate(row.updatedAt) : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
    const file = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'filtered_data.xlsx';
    a.click();
  }

  // helper function
  formatDate(dateStr: string | Date): string {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); // last 2 digits
    return `${day}/${month}/${year}`;
  }
  
}
