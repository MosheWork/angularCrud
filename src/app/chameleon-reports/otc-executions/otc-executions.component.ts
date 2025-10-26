import { Component, OnInit, ViewChild } from '@angular/core';
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
};

type PeriodMode = 'Year' | 'Quarter' | 'Month';

@Component({
  selector: 'app-otc-executions',
  templateUrl: './otc-executions.component.html',
  styleUrls: ['./otc-executions.component.scss']
})
export class OtcExecutionsComponent implements OnInit {

  // ---- Titles (reuse your layout text style) ----
  titleUnit = 'OTC Executions';
  Title1 = '— ';
  Title2 = 'סה״כ רשומות ';
  totalResults = 0;

  loading = false;

  // Data
  dataSource: Row[] = [];
  filteredData: Row[] = [];
  matTableDataSource = new MatTableDataSource<Row>([]);

  // Auto-populated department list
  departments: string[] = [];

  // View columns (keep your class names/structure)
  columns: (keyof Row)[] = [
    'year', 'quarter', 'month', 'monthName',
    'executionUnitName', 'userName',
    'userCount', 'unitQuarterTotal', 'unitMonthTotal',
    'pctOfUnitQuarter', 'pctOfUnitMonth'
  ];

  // Filters form (same class names so same SCSS works)
  filterForm: FormGroup;

  // Period toggle
  periodMode: PeriodMode = 'Quarter';

  // default year/quarter/month controls
  years: number[] = [];
  quarters = [1, 2, 3, 4];
  months = [
    { val: 1, name: 'January' }, { val: 2, name: 'February' }, { val: 3, name: 'March' },
    { val: 4, name: 'April' },   { val: 5, name: 'May' },      { val: 6, name: 'June' },
    { val: 7, name: 'July' },    { val: 8, name: 'August' },   { val: 9, name: 'September' },
    { val:10, name: 'October' }, { val:11, name: 'November' }, { val:12, name: 'December' }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, fb: FormBuilder) {
    const ctrls: Record<string, FormControl> = {};
    this.columns.forEach(c => ctrls[c] = new FormControl(''));
    // global + explicit filters
    ctrls['globalFilter'] = new FormControl('');
    ctrls['unitName'] = new FormControl('');
    ctrls['yearCtrl'] = new FormControl(new Date().getFullYear());
    ctrls['quarterCtrl'] = new FormControl(this.getQuarter(new Date()));
    ctrls['monthCtrl'] = new FormControl(new Date().getMonth() + 1);
    ctrls['periodModeCtrl'] = new FormControl('Quarter');
    this.filterForm = fb.group(ctrls);
  }

  ngOnInit(): void {
    // Fill years range (e.g., 2020..current+1)
    const nowY = new Date().getFullYear();
    for (let y = 2020; y <= nowY + 1; y++) this.years.push(y);

    // Wire reactive filters
    Object.keys(this.filterForm.controls).forEach(k => {
      this.filterForm.get(k)!.valueChanges
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(() => {
          if (k === 'periodModeCtrl' || k === 'yearCtrl' || k === 'quarterCtrl' || k === 'monthCtrl' || k === 'unitName') {
            this.load(); // server-side filter (date window & unit)
          } else {
            this.applyClientFilters(); // client-side table filter
          }
        });
    });

    // Initial load
    this.load();
  }

  // -------- Helpers --------
  private getQuarter(d: Date): number {
    return Math.floor(d.getMonth() / 3) + 1;
  }

  private getPeriodRange(): { start: string; end: string } {
    const mode = (this.filterForm.get('periodModeCtrl')?.value as PeriodMode) || this.periodMode;
    const y = Number(this.filterForm.get('yearCtrl')?.value) || new Date().getFullYear();

    if (mode === 'Year') {
      const start = new Date(y, 0, 1);
      const end = new Date(y + 1, 0, 1);
      return { start: start.toISOString().substring(0, 10), end: end.toISOString().substring(0, 10) };
    }

    if (mode === 'Quarter') {
      const q = Number(this.filterForm.get('quarterCtrl')?.value) || this.getQuarter(new Date());
      const qStartMonth = (q - 1) * 3; // 0,3,6,9
      const start = new Date(y, qStartMonth, 1);
      const end = new Date(y, qStartMonth + 3, 1);
      return { start: start.toISOString().substring(0, 10), end: end.toISOString().substring(0, 10) };
    }

    // Month
    const m = Number(this.filterForm.get('monthCtrl')?.value) || (new Date().getMonth() + 1);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    return { start: start.toISOString().substring(0, 10), end: end.toISOString().substring(0, 10) };
  }

  // -------- Server load --------
  load(): void {
    this.loading = true;

    const { start, end } = this.getPeriodRange();
    const unitName = (this.filterForm.get('unitName')?.value || '').trim();

    let params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end)
      .set('protocolLike', '%OTC%');

    if (unitName) params = params.set('unitName', unitName);

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
          })) as Row[];

          this.dataSource = norm;

          // auto-populate departments (distinct ExecutionUnitName from result)
          this.departments = Array.from(new Set(this.dataSource.map(d => d.executionUnitName)))
                                  .filter(x => !!x)
                                  .sort((a,b) => a.localeCompare(b));

          // refresh table
          this.applyClientFilters();
          setTimeout(() => {
            this.matTableDataSource.paginator = this.paginator;
            this.matTableDataSource.sort = this.sort;
          });
        },
        error: (err) => {
          console.error('Load error', err);
          alert('שגיאה בטעינת נתוני OTC');
        }
      });
  }

  // -------- Client-side filters (search boxes) --------
  applyClientFilters(): void {
    const vals = this.filterForm.value as Record<string, string>;
    const global = (vals['globalFilter'] || '').toLowerCase().trim();

    const base = this.dataSource.filter(row => {
      // column filters (optional per-column text boxes; currently empty, but kept for SCSS/class compatibility)
      const perCol = this.columns.every(col => {
        const needle = (vals[col as string] || '').toLowerCase().trim();
        if (!needle) return true;
        const val = ((row[col] ?? '') + '').toLowerCase();
        return val.includes(needle);
      });

      const globalOk = !global || this.columns.some(col =>
        (((row[col] ?? '') + '').toLowerCase().includes(global))
      );

      return perCol && globalOk;
    });

    this.filteredData = base;
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
  }

  // -------- Labels (Hebrew like your example) --------
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
      globalFilter: 'חיפוש',
      unitName: 'יחידה'
    };
    return labels[c] ?? (c as string);
  }

  getFormControl(c: keyof Row | 'globalFilter' | 'unitName' | 'yearCtrl' | 'quarterCtrl' | 'monthCtrl' | 'periodModeCtrl') {
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
      globalFilter: ''
    });

    this.applyClientFilters();
    this.paginator?.firstPage();
  }

  exportToExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OTC-Executions');
    XLSX.writeFile(wb, 'otc-executions.xlsx');
  }
}
