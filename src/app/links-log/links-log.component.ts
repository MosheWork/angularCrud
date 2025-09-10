import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LinkLogSummary {
  linkDescription: string;
  linkId: string;
  employee_Name: string;
  tq: number;   // quarter
  ty: number;   // year
  userCountPerLink: number;
}

export interface LinkLogPeriodTotals {
  linkDescription: string;
  today: number;
  thisMonth: number;
  thisQuarter: number;
  thisYear: number;
  allTime: number;
}

@Component({
  selector: 'app-links-log',
  templateUrl: './links-log.component.html',
  styleUrls: ['./links-log.component.scss']
})
export class LinksLogComponent implements OnInit, AfterViewInit {

  // Titles
  Title1 = 'דו״ח שימוש בקישורים - ';
  Title2 = 'סה״כ תוצאות ';
  titleUnit = 'רשומות';

  // Loading flags
  loadingSummary = false;
  loadingTotals  = false;

  // ===== Tab 1 (summary per employee/quarter) =====
  columns: string[] = [
    'linkDescription',
    'linkId',
    'employee_Name',
    'period',
    'userCountPerLink'
  ];

  filterForm!: FormGroup;

  dataSource: LinkLogSummary[] = [];
  filteredData: LinkLogSummary[] = [];
  matTableDataSource = new MatTableDataSource<LinkLogSummary>([]);
  totalResults = 0;

  @ViewChild('paginatorSummary') paginator!: MatPaginator;
  @ViewChild('sortSummary')      sort!: MatSort;

  // ===== Tab 2 (period totals) =====
  totalsColumns: string[] = [
    'linkDescription', 'today', 'thisMonth', 'thisQuarter', 'thisYear', 'allTime'
  ];
  totalsFilterCtrl = new FormControl('');
  matTableDataSourceTotals = new MatTableDataSource<LinkLogPeriodTotals>([]);
  totalResultsTotals = 0;

  @ViewChild('paginatorTotals') paginatorTotals!: MatPaginator;
  @ViewChild('sortTotals')      sortTotals!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    // Form for Tab 1
    this.filterForm = this.createFilterForm();

    // Summary table filter predicate (global text search over several fields)
    this.matTableDataSource.filterPredicate = (row, filter) => {
      const hay = [
        row.linkDescription || '',
        row.linkId || '',
        row.employee_Name || '',
        `Q${row.tq} ${row.ty}`,
        String(row.userCountPerLink)
      ].join('|').toLowerCase();
      return hay.includes(filter);
    };

    // Wire column + global filters (Tab 1)
    ['linkDescription', 'linkId', 'employee_Name', 'globalFilter'].forEach(ctrl => {
      this.filterForm.get(ctrl)?.valueChanges
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });

    // Date change reloads summary (Tab 1)
    this.filterForm.get('fromDate')?.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(() => this.loadSummary());

    // Totals table filter predicate (Tab 2)
    this.matTableDataSourceTotals.filterPredicate = (row, filter) => {
      const hay = [
        row.linkDescription || '',
        row.today, row.thisMonth, row.thisQuarter, row.thisYear, row.allTime
      ].join('|').toLowerCase();
      return hay.includes(filter);
    };

    // Wire totals filter box
    this.totalsFilterCtrl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(val => {
        this.matTableDataSourceTotals.filter = (val || '').toLowerCase();
        if (this.matTableDataSourceTotals.paginator) this.matTableDataSourceTotals.paginator.firstPage();
        this.totalResultsTotals = this.matTableDataSourceTotals.filteredData.length;
      });

    // Initial loads
    this.loadSummary();
    this.loadTotals();
  }

  ngAfterViewInit(): void {
    // Attach sort/paginator after view init (they’ll be reattached after data loads too)
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort      = this.sort;

    this.matTableDataSourceTotals.paginator = this.paginatorTotals;
    this.matTableDataSourceTotals.sort      = this.sortTotals;
  }

  // -------- Tab 1: Summary --------
  private createFilterForm(): FormGroup {
    const jan1 = new Date(new Date().getFullYear(), 0, 1);
    return this.fb.group({
      linkDescription: new FormControl(''),
      linkId:          new FormControl(''),
      employee_Name:   new FormControl(''),
      globalFilter:    new FormControl(''),
      fromDate:        new FormControl(jan1),
      pageSize:        new FormControl(25),
      pageIndex:       new FormControl(0)
    });
  }

  loadSummary(): void {
    const from: Date = this.filterForm.get('fromDate')?.value || new Date();
    const fromISO = this.toISO(from);
    this.loadingSummary = true;

    const params = new HttpParams().set('from', fromISO);
    this.http.get<LinkLogSummary[]>(environment.apiUrl + 'LinksLog', { params })
      .subscribe({
        next: rows => {
          this.dataSource = rows;
          this.filteredData = [...rows];

          this.matTableDataSource.data = this.filteredData;
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort      = this.sort;

          this.applyFilters();
          this.loadingSummary = false;
        },
        error: _ => { this.loadingSummary = false; }
      });
  }

  applyFilters(): void {
    const f = this.filterForm.value;
    const global = (f.globalFilter || '').toLowerCase();
    const desc   = (f.linkDescription || '').toLowerCase();
    const linkId = (f.linkId || '').toLowerCase();
    const emp    = (f.employee_Name || '').toLowerCase();

    this.filteredData = this.dataSource.filter(row =>
      (!desc   || (row.linkDescription || '').toLowerCase().includes(desc)) &&
      (!linkId || (row.linkId || '').toLowerCase().includes(linkId)) &&
      (!emp    || (row.employee_Name || '').toLowerCase().includes(emp)) &&
      (!global || this.matTableDataSource.filterPredicate(row, global))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    if (this.matTableDataSource.paginator) this.matTableDataSource.paginator.firstPage();
  }

  clearGlobal(): void {
    this.filterForm.get('globalFilter')?.setValue('');
  }

  exportSummaryToExcel(): void {
    const rows = this.filteredData.length ? this.filteredData : this.dataSource;
    const shaped = rows.map(r => ({
      LinkDescription: r.linkDescription,
      LinkId: r.linkId,
      Employee_Name: r.employee_Name,
      Quarter: `Q${r.tq}`,
      Year: r.ty,
      UserCountPerLink: r.userCountPerLink
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(shaped);
    const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.downloadBlob(buf, 'links-log-summary.xlsx');
  }

  // -------- Tab 2: Totals --------
  loadTotals(): void {
    this.loadingTotals = true;
    this.http.get<LinkLogPeriodTotals[]>(environment.apiUrl + 'LinksLog/periodTotals')
      .subscribe({
        next: rows => {
          this.matTableDataSourceTotals.data = rows;
          this.matTableDataSourceTotals.paginator = this.paginatorTotals;
          this.matTableDataSourceTotals.sort      = this.sortTotals;
          this.totalResultsTotals = rows.length;
          this.loadingTotals = false;
        },
        error: _ => { this.loadingTotals = false; }
      });
  }

  exportTotalsToExcel(): void {
    const rows = this.matTableDataSourceTotals.filteredData.length
      ? this.matTableDataSourceTotals.filteredData
      : this.matTableDataSourceTotals.data;

    const shaped = rows.map(r => ({
      LinkDescription: r.linkDescription,
      Today: r.today,
      ThisMonth: r.thisMonth,
      ThisQuarter: r.thisQuarter,
      ThisYear: r.thisYear,
      AllTime: r.allTime
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(shaped);
    const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.downloadBlob(buf, 'links-log-period-totals.xlsx');
  }

  // -------- Utils --------
  private toISO(d: Date): string {
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  private downloadBlob(buf: ArrayBuffer, filename: string) {
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
