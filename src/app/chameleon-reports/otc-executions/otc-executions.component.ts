import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

type Row = {
  year?: number | null;
  quarter?: number | null;
  month?: number | null;
  monthName?: string;
  executionUnitName: string;
  userName: string;
  userCount: number;
  unitQuarterTotal: number;
  unitMonthTotal: number;
  pctOfUnitQuarter: number; // %
  pctOfUnitMonth: number;   // %
  pctOfUnitYear: number;    // %
};

type PeriodMode = 'Year' | 'Quarter' | 'Month';

@Component({
  selector: 'app-otc-executions',
  templateUrl: './otc-executions.component.html',
  styleUrls: ['./otc-executions.component.scss']
})
export class OtcExecutionsComponent implements OnInit, AfterViewInit {

  // Titles / UI
  titleUnit = 'OTC Executions';
  Title1 = '— ';
  Title2 = 'סה״כ רשומות ';
  totalResults = 0;
  loading = false;

  // Data
  dataSource: Row[] = [];            // full set from server (loaded once)
  filteredData: Row[] = [];          // after client filters
  matTableDataSource = new MatTableDataSource<Row>([]);

  // Filters + options
  departments: string[] = [];
  years: number[] = [];
  quarters = [1, 2, 3, 4];
  months = [
    { val: 1, name: 'January' }, { val: 2, name: 'February' }, { val: 3, name: 'March' },
    { val: 4, name: 'April' },   { val: 5, name: 'May' },      { val: 6, name: 'June' },
    { val: 7, name: 'July' },    { val: 8, name: 'August' },   { val: 9, name: 'September' },
    { val:10, name: 'October' }, { val:11, name: 'November' }, { val:12, name: 'December' }
  ];

  // Column definitions
  columns: (keyof Row)[] = [
    'year', 'quarter', 'month', 'monthName',
    'executionUnitName', 'userName',
    'userCount', 'unitQuarterTotal', 'unitMonthTotal',
    'pctOfUnitQuarter', 'pctOfUnitMonth', 'pctOfUnitYear'
  ];
  displayedColumns: (keyof Row)[] = []; // depends on period mode

  // Forms
  filterForm: FormGroup;
  periodMode: PeriodMode = 'Quarter';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Build reactive form controls (include per-column text boxes for compatibility)
    const ctrls: Record<string, FormControl> = {};
    this.columns.forEach(c => ctrls[c] = new FormControl(''));   // per-column text filters
    ctrls['globalFilter']   = new FormControl('');
    ctrls['unitName']       = new FormControl('');               // department select
    ctrls['yearCtrl']       = new FormControl(new Date().getFullYear());
    ctrls['quarterCtrl']    = new FormControl(this.getQuarter(new Date()));
    ctrls['monthCtrl']      = new FormControl(new Date().getMonth() + 1);
    ctrls['periodModeCtrl'] = new FormControl('Quarter');
    ctrls['quarterFilter']  = new FormControl<string[]>([]);     // multi-select quarters

    this.filterForm = fb.group(ctrls);
  }

  ngOnInit(): void {
    // Years range (adjust as you like)
    const nowY = new Date().getFullYear();
    for (let y = 2020; y <= nowY + 1; y++) this.years.push(y);

    // Set initial visible columns and re-filter on mode change
    this.updateDisplayedColumns();
    this.getFormControl('periodModeCtrl').valueChanges.subscribe(() => {
      this.updateDisplayedColumns();
      this.applyClientFilters();
    });

    // Client-side filtering only (never calls load())
    Object.keys(this.filterForm.controls).forEach(k => {
      this.filterForm.get(k)!.valueChanges
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe(() => this.applyClientFilters());
    });

    // Load once (wide window)
    this.load();
  }

  ngAfterViewInit(): void {
    // Wire once
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
    this.cdr.detectChanges();
  }

  // ===== Helpers =====
  private getQuarter(d: Date): number { return Math.floor(d.getMonth() / 3) + 1; }

  private updateDisplayedColumns(): void {
    const mode = (this.getFormControl('periodModeCtrl').value as PeriodMode) || 'Quarter';
    if (mode === 'Year') {
      this.displayedColumns = ['year', 'executionUnitName', 'userName', 'userCount', 'pctOfUnitYear'];
    } else if (mode === 'Quarter') {
      this.displayedColumns = ['year', 'quarter', 'executionUnitName', 'userName', 'userCount', 'unitQuarterTotal', 'pctOfUnitQuarter'];
    } else {
      this.displayedColumns = ['year', 'quarter', 'month', 'monthName', 'executionUnitName', 'userName', 'userCount', 'unitMonthTotal', 'pctOfUnitMonth'];
    }
    // Re-tick the table
    this.matTableDataSource.data = [...this.matTableDataSource.data];
  }

  // ===== Load once from server (wide range) =====
  load(): void {
    this.loading = true;

    // Fetch once (big window). Adjust if needed.
    const start = '2024-01-01';
    const end   = '2030-12-31';

    const params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end)
      .set('protocolLike', '%OTC%');

    this.http.get<Row[]>(`${environment.apiUrl}OTCExecutions/ByPeriod`, { params })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (rows) => {
          const norm = (rows || []).map(r => ({
            year: r.year ?? null,
            quarter: r.quarter ?? null,
            month: r.month ?? null,
            monthName: r.monthName ?? '',
            executionUnitName: r.executionUnitName ?? '',
            userName: r.userName ?? '',
            userCount: Number(r.userCount ?? 0),
            unitQuarterTotal: Number(r.unitQuarterTotal ?? 0),
            unitMonthTotal: Number(r.unitMonthTotal ?? 0),
            pctOfUnitQuarter: Number(r.pctOfUnitQuarter ?? 0),
            pctOfUnitMonth: Number(r.pctOfUnitMonth ?? 0),
            pctOfUnitYear: Number((r as any).pctOfUnitYear ?? 0),
          })) as Row[];

          this.dataSource = norm;

          // Departments from full dataset
          this.departments = Array.from(new Set(norm.map(d => d.executionUnitName)))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

          // Show all, then client-subset
          this.matTableDataSource.data = norm;
          this.applyClientFilters();
        },
        error: (err) => {
          console.error('Load error', err);
          alert('שגיאה בטעינת נתוני OTC');
        }
      });
  }

  // ===== Client-side filtering =====
  applyClientFilters(): void {
    const vals = this.filterForm.value as any;

    const mode: PeriodMode = (vals['periodModeCtrl'] as PeriodMode) || 'Quarter';
    const yearCtrl    = Number(vals['yearCtrl'])    || new Date().getFullYear();
    const quarterCtrl = Number(vals['quarterCtrl']) || this.getQuarter(new Date());
    const monthCtrl   = Number(vals['monthCtrl'])   || (new Date().getMonth() + 1);
    const unitName    = (vals['unitName'] || '').toString().trim();
    const selectedQuarters: number[] = (vals['quarterFilter'] || []).map((q: string | number) => +q);
    const global = (vals['globalFilter'] || '').toLowerCase().trim();

    const filtered = this.dataSource.filter(row => {
      // 1) Period logic
      let periodOk = true;
      if (mode === 'Year') {
        periodOk = (row.year ?? 0) === yearCtrl;
        if (periodOk && selectedQuarters.length > 0) {
          periodOk = selectedQuarters.includes(Number(row.quarter ?? 0));
        }
      } else if (mode === 'Quarter') {
        const quarterMatch = selectedQuarters.length > 0
          ? selectedQuarters.includes(Number(row.quarter ?? 0))
          : (Number(row.quarter ?? 0) === quarterCtrl);
        periodOk = (row.year ?? 0) === yearCtrl && quarterMatch;
      } else {
        const monthMatch = (Number(row.month ?? 0) === monthCtrl);
        const quarterFilterOk = selectedQuarters.length === 0
          ? true
          : selectedQuarters.includes(Number(row.quarter ?? 0));
        periodOk = (row.year ?? 0) === yearCtrl && monthMatch && quarterFilterOk;
      }
      if (!periodOk) return false;

      // 2) Department
      if (unitName && row.executionUnitName !== unitName) return false;

      // 3) Per-column text filters
      const perCol = this.columns.every(col => {
        const needle = (vals[col as string] || '').toLowerCase().trim();
        if (!needle) return true;
        const val = ((row[col] ?? '') + '').toLowerCase();
        return val.includes(needle);
      });
      if (!perCol) return false;

      // 4) Global search across all columns
      const globalOk = !global || this.columns.some(col =>
        (((row[col] ?? '') + '').toLowerCase().includes(global))
      );
      if (!globalOk) return false;

      return true;
    });

    // Push to table
    this.filteredData = filtered;
    this.matTableDataSource.data = [...filtered]; // new ref so table updates
    this.totalResults = filtered.length;

    // Keep paginator valid
    this.paginator?.firstPage();
  }

  // ===== Labels =====
  getColumnLabel(c: keyof Row | 'globalFilter' | 'unitName'): string {
    const labels: Record<string, string> = {
      year: 'שנה',
      quarter: 'רבעון',
      month: 'חודש',
      monthName: 'שם חודש',
      executionUnitName: 'שם יחידה',
      userName: 'שם משתמש',
      userCount: 'כמות לפי משתמש',
      unitQuarterTotal: 'סה״כ יחידה ברבעון',
      unitMonthTotal: 'סה״כ יחידה בחודש',
      pctOfUnitQuarter: '% מתוך יחידה (רבעון)',
      pctOfUnitMonth: '% מתוך יחידה (חודש)',
      pctOfUnitYear: '% מתוך יחידה (שנה)',
      globalFilter: 'חיפוש',
      unitName: 'יחידה'
    };
    return labels[c] ?? (c as string);
  }

  getFormControl(
    c: keyof Row
     | 'globalFilter'
     | 'unitName'
     | 'yearCtrl'
     | 'quarterCtrl'
     | 'monthCtrl'
     | 'periodModeCtrl'
     | 'quarterFilter'
  ) {
    return this.filterForm.get(c) as FormControl;
  }

  resetFilters(): void {
    const mode = this.getFormControl('periodModeCtrl').value;
    const y = this.getFormControl('yearCtrl').value;
    const q = this.getFormControl('quarterCtrl').value;
    const m = this.getFormControl('monthCtrl').value;

    this.filterForm.reset({
      periodModeCtrl: mode || 'Quarter',
      yearCtrl: y || new Date().getFullYear(),
      quarterCtrl: q || this.getQuarter(new Date()),
      monthCtrl: m || (new Date().getMonth() + 1),
      unitName: '',
      globalFilter: '',
      quarterFilter: [] // clear multi-select
    });

    this.applyClientFilters();
    this.paginator?.firstPage();
  }

  // Export only currently visible columns (labels as headers)
  exportToExcel(): void {
    const toExport = this.filteredData.map(row => {
      const o: any = {};
      this.displayedColumns.forEach(c => { o[this.getColumnLabel(c)] = (row as any)[c]; });
      return o;
    });

    const ws = XLSX.utils.json_to_sheet(toExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OTC-Executions');
    XLSX.writeFile(wb, 'otc-executions.xlsx');
  }

  // (Optional) For % formatting in template:
  isPercent(c: keyof Row) {
    return c === 'pctOfUnitQuarter' || c === 'pctOfUnitMonth' || c === 'pctOfUnitYear';
  }
}
