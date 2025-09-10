import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';


export interface LinkLogSummary {
  linkDescription: string;
  linkId: string;
  employee_Name: string;
  tq: number;
  ty: number;
  userCountPerLink: number;
}

/** PascalCase to match your C# POCO JSON (no JsonProperty attributes) */
interface KpiCompareDto {
  Today: number; TodayLY: number;
  ThisMonth: number; ThisMonthLY: number;
  ThisQuarter: number; ThisQuarterLY: number;
  ThisYear: number; ThisYearLY: number;
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
export class LinksLogComponent implements OnInit {
  /** which tab is selected (0 = summary, 1 = totals) */
  selectedTab = 0;

  // ===================== TAB 1: Summary =====================
  columns: string[] = ['linkDescription', 'linkId', 'employee_Name', 'period', 'userCountPerLink'];
  filterForm!: FormGroup;

  matTableDataSource = new MatTableDataSource<LinkLogSummary>([]);
  dataSource: LinkLogSummary[] = [];
  filteredData: LinkLogSummary[] = [];
  totalResults = 0;
  loadingSummary = false;

  // ===================== TAB 2: Totals ======================
  totalsColumns: string[] = ['linkDescription', 'today', 'thisMonth', 'thisQuarter', 'thisYear', 'allTime'];
  totalsForm!: FormGroup;

  matTableDataSourceTotals = new MatTableDataSource<LinkLogPeriodTotals>([]);
  totalResultsTotals = 0;
  loadingTotals = false;

  /** KPI compare (global, to-date vs last year, coming from /periodTotalsCompare) */
  kpiCmp: KpiCompareDto | null = null;

  @ViewChild('paginatorSummary') paginatorSummary!: MatPaginator;
  @ViewChild('sortSummary')      sortSummary!: MatSort;

  @ViewChild('paginatorTotals')  paginatorTotals!: MatPaginator;
  @ViewChild('sortTotals')       sortTotals!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const jan1 = new Date(new Date().getFullYear(), 0, 1);

    // Summary filters (outside tabs)
    this.filterForm = this.fb.group({
      globalFilter: [''],
      fromDate: [jan1],
      toDate: [null]
    });

    // Totals filters (outside tabs)
    this.totalsForm = this.fb.group({
      globalFilter: [''],
      dummyStart: [null],
      dummyEnd: [null]
    });

    // Summary table predicate
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

    // Reapply summary filters on change
    this.filterForm.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => {
        this.applySummaryFilters();
        if (this.paginatorSummary) this.paginatorSummary.firstPage();
      });

    // Totals table predicate (simple global text)
    this.matTableDataSourceTotals.filterPredicate = (row, filter) => {
      const hay = [
        row.linkDescription || '',
        row.today, row.thisMonth, row.thisQuarter, row.thisYear, row.allTime
      ].join('|').toLowerCase();
      return hay.includes(filter);
    };

    this.totalsForm.get('globalFilter')?.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(val => {
        this.matTableDataSourceTotals.filter = (val || '').toLowerCase();
        if (this.paginatorTotals) this.paginatorTotals.firstPage();
        this.totalResultsTotals = this.matTableDataSourceTotals.filteredData.length || this.matTableDataSourceTotals.data.length;
      });

    // Initial loads
    this.fetchSummaryData();
    this.fetchTotalsData();
    this.fetchKpiCompare(); // <— new
  }

  // ================= TAB 1: Summary =================
  fetchSummaryData(): void {
    const from: Date = this.filterForm.get('fromDate')?.value || new Date();
    const fromISO = this.toISO(from);
    this.loadingSummary = true;

    const params = new HttpParams().set('from', fromISO);
    this.http.get<LinkLogSummary[]>(environment.apiUrl + 'LinksLog', { params })
      .subscribe({
        next: rows => {
          this.dataSource = rows || [];
          this.filteredData = [...this.dataSource];

          this.matTableDataSource.data = this.filteredData;
          if (this.paginatorSummary) this.matTableDataSource.paginator = this.paginatorSummary;
          if (this.sortSummary)      this.matTableDataSource.sort      = this.sortSummary;

          this.totalResults = this.filteredData.length;
          this.applySummaryFilters();
          this.loadingSummary = false;
        },
        error: _ => { this.loadingSummary = false; }
      });
  }

  applySummaryFilters(): void {
    const global = (this.filterForm.get('globalFilter')?.value || '').toLowerCase();
    const filtered = this.dataSource.filter(row =>
      !global || this.matTableDataSource.filterPredicate(row, global)
    );
    this.filteredData = filtered;
    this.totalResults = filtered.length;
    this.matTableDataSource.data = filtered;
  }

  resetSummaryFilters(): void {
    const jan1 = new Date(new Date().getFullYear(), 0, 1);
    this.filterForm.reset({ globalFilter: '', fromDate: jan1, toDate: null });
    this.applySummaryFilters();
  }

  // ================= TAB 2: Totals =================
  fetchTotalsData(): void {
    this.loadingTotals = true;
    this.http.get<LinkLogPeriodTotals[]>(environment.apiUrl + 'LinksLog/periodTotals')
      .subscribe({
        next: rows => {
          this.matTableDataSourceTotals.data = rows || [];
          if (this.paginatorTotals) this.matTableDataSourceTotals.paginator = this.paginatorTotals;
          if (this.sortTotals)      this.matTableDataSourceTotals.sort      = this.sortTotals;
          this.totalResultsTotals = this.matTableDataSourceTotals.data.length;
          this.loadingTotals = false;
        },
        error: _ => { this.loadingTotals = false; }
      });
  }

  resetTotalsFilters(): void {
    this.totalsForm.reset({ globalFilter: '', dummyStart: null, dummyEnd: null });
    this.matTableDataSourceTotals.filter = '';
    this.totalResultsTotals = this.matTableDataSourceTotals.data.length;
  }

  // ============== KPIs (compare to last year) ==============
  /** Calls: GET /api/LinksLog/periodTotalsCompare */
  fetchKpiCompare(): void {
    this.http.get<KpiCompareDto>(environment.apiUrl + 'LinksLog/periodTotalsCompare')
      .subscribe({
        next: dto => {
          this.kpiCmp = dto;
          console.log('kpiCmp =>', dto); // DEBUG: verify data in console
          this.cdr.markForCheck();        // safe even if not OnPush
        },
        error: _ => this.kpiCmp = null
      });
  }
  /** percentage delta vs last year */
  delta(curr: number, prev: number): number {
    if (!prev) return curr ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  /** CSS class for up/flat/down */
  trendClass(curr: number, prev: number): string {
    if (!prev && curr > 0) return 'up';
    if (curr === prev) return 'flat';
    return curr > prev ? 'up' : 'down';
  }

  // ================= Utils =================
  private toISO(d: Date): string {
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
}
