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


export interface QueryItem {
  id: number;
  queryName: string;
  queryText: string;
  description: string;
  subject: string;
  subSubject: string;
  isActive: boolean;
  createdBy: string;
  createdFor: string;
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

  filteredData: any[] = [];

  displayedColumns = [
    'id', 'queryName', 'description', 'subject', 'subSubject', 
    'isActive', 'createdBy', 'createdFor', 'createdAt', 'updatedAt'
  ];

  displayedColumnsWithSelect = ['select', ...this.displayedColumns,'actions' ];

  headerLabels: Record<string,string> = {
    id: 'מזהה',
    queryName: 'שם השאילתא',
    description: 'תיאור',
    subject: 'נושא',
    subSubject: 'נושא משנה',
    isActive: 'סטטוס',
    createdBy: 'נוצר על ידי',
    createdFor: 'נוצר עבור',
    createdAt: 'נוצר בתאריך',
    updatedAt: 'עודכן בתאריך',
    actions: 'פעולות'
  };

  dataSource = new MatTableDataSource<QueryItem>();

  globalFilter = new FormControl('');
  filterQueryName = new FormControl('');
  filterSubject = new FormControl('');
  filterSubSubject = new FormControl('');
  filterCreatedFor = new FormControl('');
  filterStatus = new FormControl('');

  selection = new Set<number>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  currentUser = 'SYSTEM';
  base = 'http://localhost:44310';

  constructor(private http: HttpClient, public dialog: MatDialog, private router: Router) {}

  ngOnInit(): void { 
    this.loadQueries();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  // ---------------------- API Calls ----------------------
  loadQueries(): void {
    this.http.get<QueryItem[]>(`${this.base}/api/QueriesList/list`)
      .subscribe({
        next: rows => {
          this.dataSource.data = rows || [];
          // keep filteredData in sync after load
          this.filteredData = this.dataSource.filteredData || [];
        },
        error: err => console.error(err)
      });
  }

  // ---------------------- CRUD Actions ----------------------
  onAdd() {
    const dialogRef = this.dialog.open(QueriesDialogComponent, { width: '800px', data: { mode: 'add', currentUser: this.currentUser } });
    dialogRef.afterClosed().subscribe(res => { if(res) this.loadQueries(); });
  }

  onEdit(row: QueryItem) {
    const dialogRef = this.dialog.open(QueriesDialogComponent, { width: '800px', data: { mode: 'edit', row, currentUser: this.currentUser } });
    dialogRef.afterClosed().subscribe(res => { if(res) this.loadQueries(); });
  }

  onDelete(row: QueryItem) {
    if(!row.id || !confirm(`למחוק את השאילתא "${row.queryName}"?`)) return;
    this.http.post(`${this.base}/api/QueriesList/delete`, [row.id]).subscribe(() => this.loadQueries());
  }

  onDeleteSelected(): void {
    if(!this.selection || !confirm(`למחוק ${this.selection.size} שאילתות נבחרות?`)) return;
    const ids = Array.from(this.selection);
    this.http.post(`${this.base}/api/QueriesList/delete`, ids)
      .subscribe(() => { this.loadQueries(); this.selection.clear(); });
  }

  onView(row: QueryItem) {
    this.dialog.open(QueriesViewDialogComponent, { width: '800px', data: { query: row } });
  }

  copyText(row: QueryItem) {
    navigator.clipboard.writeText(row.queryText).then(() => alert('הטקסט הועתק בהצלחה!'));
  }

  // ---------------------- Selection ----------------------
  toggleSelection(row: QueryItem) { this.selection.has(row.id) ? this.selection.delete(row.id) : this.selection.add(row.id); }

  toggleAllSelection(event: any) {
    const rows = this.dataSource.filteredData;
    event.checked ? rows.forEach(r => this.selection.add(r.id)) : rows.forEach(r => this.selection.delete(r.id));
  }

  isAllSelected() {
    const rows = this.dataSource.filteredData;
    return rows.length > 0 && rows.every(r => this.selection.has(r.id));
  }

  isIndeterminate() {
    const rows = this.dataSource.filteredData;
    const count = rows.filter(r => this.selection.has(r.id)).length;
    return count > 0 && count < rows.length;
  }
  // ---------------------- Filtering ----------------------

  private setupFilters() {
    const apply = () => {
      const global = String(this.globalFilter.value || '').toLowerCase();
      const qName = String(this.filterQueryName.value || '').toLowerCase();
      const subject = String(this.filterSubject.value || '').toLowerCase();
      const sub = String(this.filterSubSubject.value || '').toLowerCase();
      const createdFor = String(this.filterCreatedFor.value || '').toLowerCase();
      const status = String(this.filterStatus.value || '');

      this.dataSource.filterPredicate = (row: QueryItem) => {
        const matchGlobal = `${row.id}|${row.queryName}|${row.description}|${row.subject}|${row.subSubject}|${row.createdBy}`.toLowerCase().includes(global);
        const matchQueryName = String(row.queryName || '').toLowerCase().includes(qName);
        const matchSubject = String(row.subject || '').toLowerCase().includes(subject);
        const matchSub = String(row.subSubject || '').toLowerCase().includes(sub);
        const matchCreatedFor = String(row.createdFor || '').toLowerCase().includes(createdFor);
        let matchStatus = true;
        if (status === 'active') matchStatus = Boolean(row.isActive);
        else if (status === 'inactive') matchStatus = !row.isActive;
        return matchGlobal && matchQueryName && matchSubject && matchSub && matchCreatedFor && matchStatus;
      };

      // trigger Material table filter and update filteredData safely
      this.dataSource.filter = Math.random().toString();
      this.filteredData = this.dataSource.filteredData || [];
    };

    [this.globalFilter, this.filterQueryName, this.filterSubject, this.filterSubSubject, this.filterCreatedFor, this.filterStatus]
      .forEach(f => f.valueChanges.subscribe(apply));

    // initial application so filteredData is populated
    apply();
  }

  
  resetFilters() {
    // reset individual filter form controls (we don't have a FormGroup named filterForm)
    this.globalFilter.setValue('');
    this.filterQueryName.setValue('');
    this.filterSubject.setValue('');
    this.filterSubSubject.setValue('');
    this.filterCreatedFor.setValue('');
    this.filterStatus.setValue('');

    // trigger the table to re-evaluate the filter predicate
    this.dataSource.filter = Math.random().toString();

    // update cached filtered data and ensure paginator is attached
    this.filteredData = [...(this.dataSource.filteredData || [])];
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  // ---------------------- Moshe's utiles ----------------------
  exportToExcel() {
    const excelBuffer = this.convertToExcelFormat(this.filteredData || []);

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'filtered_data.xlsx';
    link.click();
    // cleanup
    window.URL.revokeObjectURL(link.href);
  }

  convertToExcelFormat(data: any[]): ArrayBuffer {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data || []);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    return excelBuffer;
  }

  showGraph: boolean = false;
  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }


}