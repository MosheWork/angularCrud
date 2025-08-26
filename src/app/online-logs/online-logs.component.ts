import { Component, OnInit, ViewChild ,ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';
import { Chart } from 'chart.js/auto'; // ← Chart.js

interface RouteHitDto {
  Id?: number; id?: number;
  Route?: string; route?: string;
  TsUtc?: string; tsUtc?: string;
  ClientIp?: string; clientIp?: string;
  Host?: string; host?: string;
  UserAgent?: string; userAgent?: string;
}
interface RouteHit {
  id: number;
  route: string;
  tsUtc: string;
  tsUtcDate: Date;
  clientIp?: string | null;
  host?: string | null;
  userAgent?: string | null;
}
interface TopRoute {
  route: string;
  hits: number;
}
interface RouteSummary {
  route: string;
  today: number;
  month: number;
  total: number;
}
type Period = 'today' | 'month' | 'all';

@Component({
  selector: 'app-online-logs',
  templateUrl: './online-logs.component.html',
  styleUrls: ['./online-logs.component.scss']
})
export class OnlineLogsComponent implements OnInit {
  // header (same bindings you use elsewhere)
  totalResults = 0;
  titleUnit = 'סטטיסטיקת ניווט לפי Route';
  Title1 = ' סה״כ תוצאות: ';
  Title2 = '';

  // main table
  displayedColumns: string[] = ['tsUtc', 'route', 'clientIp', 'host', 'userAgent'];
  dataSource: MatTableDataSource<RouteHit> = new MatTableDataSource<RouteHit>([]);
  originalData: RouteHit[] = [];

  // summaries tab
  displayedColumnsCounts: string[] = ['route', 'today', 'month', 'total'];
  dataSourceCounts: MatTableDataSource<RouteSummary> = new MatTableDataSource<RouteSummary>([]);
  @ViewChild('countsPaginator') countsPaginator!: MatPaginator;
  @ViewChild('countsSort') countsSort!: MatSort;
  period: Period = 'today';
  @ViewChild('topChart', { static: false }) topChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartRef: Chart | null = null;
  // UI state
  filterForm: FormGroup;
  isLoading = false;

  // main table paginator/sort
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // top card state
  topN = 5;
  top5: TopRoute[] = [];

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      globalFilter: ['']
    });
  }

  ngOnInit(): void {
    this.fetchData();
    this.filterForm.get('globalFilter')!.valueChanges.subscribe(() => this.applyFilters());
  }

  private normalize(rows: RouteHitDto[]): RouteHit[] {
    return (rows || []).map(r => {
      const id = r.id ?? r.Id ?? 0;
      const route = r.route ?? r.Route ?? '';
      const tsUtc = (r.tsUtc ?? r.TsUtc ?? '') as string;
      const clientIp = r.clientIp ?? r.ClientIp ?? null;
      const host = r.host ?? r.Host ?? null;
      const userAgent = r.userAgent ?? r.UserAgent ?? null;
      return {
        id,
        route,
        tsUtc,
        tsUtcDate: tsUtc ? new Date(tsUtc) : new Date(0),
        clientIp,
        host,
        userAgent
      };
    });
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get<RouteHitDto[]>(`${environment.apiUrl}telemetry/route-hits`)
      .subscribe({
        next: rows => {
          this.originalData = this.normalize(rows);
          // newest first
          this.originalData.sort((a, b) => b.tsUtcDate.getTime() - a.tsUtcDate.getTime());

          // compute top and summaries
          this.top5 = this.getTopRoutes(5);
          this.recomputeSummaries();

          // load main table (all)
          this.applyFilters();


          setTimeout(() => {
            // main table
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = (item: RouteHit, prop: string) => {
              if (prop === 'tsUtc') return item.tsUtcDate;
              return (item as any)[prop];
            };
            // counts table
            this.dataSourceCounts.paginator = this.countsPaginator;
            this.dataSourceCounts.sort = this.countsSort;
            this.rebuildChart();
          });

          this.isLoading = false;
        },
        error: err => {
          console.error('Error loading route-hits', err);
          this.originalData = [];
          this.top5 = [];
          this.dataSourceCounts.data = [];
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    const term = (this.filterForm.value.globalFilter || '').toString().toLowerCase().trim();
    const filtered = !term ? this.originalData : this.originalData.filter(r =>
      (r.route || '').toLowerCase().includes(term) ||
      (r.clientIp || '').toLowerCase().includes(term) ||
      (r.host || '').toLowerCase().includes(term) ||
      (r.userAgent || '').toLowerCase().includes(term) ||
      (r.tsUtc || '').toLowerCase().includes(term)
    );

    this.dataSource.data = [...filtered];
    this.totalResults = this.dataSource.data.length;

    setTimeout(() => {
      if (this.paginator) this.dataSource.paginator = this.paginator;
      if (this.sort) this.dataSource.sort = this.sort;
    });
  }

  resetFilters(): void {
    this.filterForm.setValue({ globalFilter: '' });
    this.applyFilters();
  }

  exportToExcel(): void {
    const rows = this.dataSource.filteredData ?? this.dataSource.data;
    if (!rows || rows.length === 0) {
      alert('אין נתונים לייצוא!');
      return;
    }
    const exportData = rows.map(r => ({
      'תאריך/שעה (UTC)': r.tsUtc,
      'Route': r.route,
      'IP': r.clientIp ?? '',
      'Host': r.host ?? '',
      'User-Agent': r.userAgent ?? ''
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = { Sheets: { 'OnlineLogs' : ws }, SheetNames: ['OnlineLogs'] };
    XLSX.writeFile(wb, 'OnlineLogs.xlsx');
  }

  // ---------- Top 5 logic ----------
  private getTopRoutes(n: number): TopRoute[] {
    const counts = new Map<string, number>();
    for (const r of this.originalData) {
      counts.set(r.route, (counts.get(r.route) || 0) + 1);
    }
    const arr: TopRoute[] = Array.from(counts.entries())
      .map(([route, hits]) => ({ route, hits }))
      .sort((a, b) => b.hits - a.hits);
    return arr.slice(0, n);
  }

  showTopNInTable(n: number): void {
    this.topN = n;
    const top = this.getTopRoutes(n).map(t => t.route);
    const subset = this.originalData.filter(r => top.includes(r.route));
    this.dataSource.data = subset;
    this.totalResults = subset.length;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  // ---------- Summaries (today / this month / total) ----------
  private recomputeSummaries(): void {
    const now = new Date();

    // local day/month boundaries
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const map = new Map<string, RouteSummary>();

    for (const r of this.originalData) {
      const key = r.route || '';
      if (!map.has(key)) {
        map.set(key, { route: key, today: 0, month: 0, total: 0 });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      if (r.tsUtcDate >= startOfToday) entry.today += 1;
      if (r.tsUtcDate >= startOfMonth) entry.month += 1;
    }

    const list = Array.from(map.values())
      .sort((a, b) => b.total - a.total);

    this.dataSourceCounts.data = list;

    setTimeout(() => {
      if (this.countsPaginator) this.dataSourceCounts.paginator = this.countsPaginator;
      if (this.countsSort) this.dataSourceCounts.sort = this.countsSort;
    });
  }

  applyCountsFilter(val: string) {
    this.dataSourceCounts.filterPredicate = (r, f) => {
      f = (f || '').trim().toLowerCase();
      return (r.route || '').toLowerCase().includes(f)
          || String(r.today).includes(f)
          || String(r.month).includes(f)
          || String(r.total).includes(f);
    };
    this.dataSourceCounts.filter = (val || '').trim().toLowerCase();
  }
  private periodBounds(): { startOfToday: Date; startOfMonth: Date } {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startOfToday, startOfMonth };
  }

  private getTopRoutesForPeriod(n: number, period: Period): TopRoute[] {
    const { startOfToday, startOfMonth } = this.periodBounds();

    const counts = new Map<string, number>();
    for (const r of this.originalData) {
      if (!r.route) continue;
      if (period === 'today' && r.tsUtcDate < startOfToday) continue;
      if (period === 'month' && r.tsUtcDate < startOfMonth) continue;
      counts.set(r.route, (counts.get(r.route) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([route, hits]) => ({ route, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, n);
  }
  private rebuildChart(): void {
    // להבטיח שיש קנבס בדום
    if (!this.topChartCanvas) return;

    const top = this.getTopRoutesForPeriod(5, this.period);
    const labels = top.map(x => x.route);
    const data = top.map(x => x.hits);

    // ניקוי גרף קודם
    if (this.chartRef) {
      this.chartRef.destroy();
      this.chartRef = null;
    }

    this.chartRef = new Chart(this.topChartCanvas.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: this.period === 'today' ? 'היום'
               : this.period === 'month' ? 'החודש'
               : 'כל הזמנים',
          data
          // בלי צבעים מיוחדים – Chart.js יבחר ברירת־מחדל
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  periodChanged(next: Period) {
    this.period = next;
    this.rebuildChart();
  }

}
