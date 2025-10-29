import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, of, switchMap, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ServerRow {
  id: number;
  serverName: string;
  ip?: string;
  forSystem?: string;
  description?: string;
}

/** What the backend actually returns from ServerHealth/Now */
interface BackendHealthDto {
  serverName: string;
  totalDiskGb: number;
  freeDiskGb: number;
  totalRamGb: number;
  usedRamGb: number;
  cpuUsagePercent: number;
  checkedAt?: string;

  // 👇 add these (match backend)
  pingOk?: boolean;
  pingSent?: number;
  pingReceived?: number;
  packetLossPercent?: number;
  pingAvgMs?: number;
  pingMinMs?: number;
  pingMaxMs?: number;
}


/** What our table component uses internally */
interface ServerStats {
  serverName: string;
  cpuPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskUsedGb: number;
  diskTotalGb: number;

  // 👇 add this
  pingOk?: boolean;
}

type UiRow = ServerRow & { stats?: ServerStats };

@Component({
  selector: 'app-servers-dialog',
  templateUrl: './servers-dialog.component.html',
  styleUrls: ['./servers-dialog.component.scss']
})
export class ServersDialogComponent implements OnInit {
  loading = false;
  errorMsg = '';
  rows: UiRow[] = [];
  displayedColumns = ['serverName', 'cpu', 'ram', 'disk','pingOk' ,'actions'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { forSystem: string },
    private dialogRef: MatDialogRef<ServersDialogComponent>,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  /** Convert backend DTO to our UI shape */
  private toStats(d: BackendHealthDto | null): ServerStats | undefined {
    if (!d) return undefined;
    const diskUsed = (d.totalDiskGb ?? 0) - (d.freeDiskGb ?? 0);
    return {
      serverName: d.serverName,
      cpuPercent: d.cpuUsagePercent ?? 0,
      ramUsedGb: d.usedRamGb ?? 0,
      ramTotalGb: d.totalRamGb ?? 0,
      diskUsedGb: diskUsed < 0 ? 0 : diskUsed,
      diskTotalGb: d.totalDiskGb ?? 0,
      pingOk: d.pingOk === true
    };
  }
  

  reload(): void {
    const forSystem = (this.data?.forSystem || '').trim();
    this.errorMsg = '';

    if (!forSystem) {
      this.rows = [];
      return;
    }

    this.loading = true;

    // 1) fetch ONLY servers for this AppName (your controller route)
    const params = new HttpParams().set('forSystem', forSystem);
    this.http.get<ServerRow[]>(
      `${environment.apiUrl}ApplicationsListDept/by-system`,
      { params }
    ).pipe(
      // 2) for those servers only, fetch stats
      switchMap((servers: ServerRow[]) => {
        this.rows = servers?.map(s => ({ ...s })) ?? [];

        if (!servers?.length) {
          return of(null);
        }

        const calls = servers.map(s =>
          this.http.get<BackendHealthDto>(
            `${environment.apiUrl}ServerHealth/Now`,
            { params: new HttpParams().set('server', s.serverName) }
          ).pipe(
            map(dto => this.toStats(dto)!),                 // map names
            catchError(() => of(undefined))                 // keep row even if failed
          )
        );

        return forkJoin(calls).pipe(
          map(statsArr => {
            const byName = new Map(
              (statsArr || [])
                .filter((x): x is ServerStats => !!x)
                .map(s => [s.serverName, s])
            );
            this.rows = this.rows.map(r => ({ ...r, stats: byName.get(r.serverName) }));
            return null;
          })
        );
      }),
      catchError(() => {
        this.errorMsg = 'שגיאה בטעינת הנתונים';
        return of(null);
      })
    ).subscribe({ complete: () => (this.loading = false) });
  }

  // ===== Helpers for UI =====
  cpuClass(pct?: number): 'ok' | 'warn' | 'crit' {
    return this.level(pct);
  }

  ramPercent(s?: { ramUsedGb?: number; ramTotalGb?: number }): number {
    if (!s?.ramTotalGb) return 0;
    return (100 * (s.ramUsedGb ?? 0)) / s.ramTotalGb;
  }
  ramClass(s?: { ramUsedGb?: number; ramTotalGb?: number }): 'ok' | 'warn' | 'crit' {
    return this.level(this.ramPercent(s));
  }

  diskPercent(s?: { diskUsedGb?: number; diskTotalGb?: number }): number {
    if (!s?.diskTotalGb) return 0;
    return (100 * (s.diskUsedGb ?? 0)) / s.diskTotalGb;
  }
  diskClass(s?: { diskUsedGb?: number; diskTotalGb?: number }): 'ok' | 'warn' | 'crit' {
    return this.level(this.diskPercent(s));
  }
  formatGb(v?: number): string {
    return (v ?? 0).toFixed(1);
  }
  

  close(): void {
    this.dialogRef.close();
  }

  // --- BADGE HELPERS (just color) ---
private badgeClassFromPercent(p?: number): 'ok' | 'warn' | 'crit' {
  const x = p ?? 0;
  if (x >= 90) return 'crit';
  if (x >= 80) return 'warn';
  return 'ok';
}

cpuBadge(r?: ServerStats): 'ok' | 'warn' | 'crit' {
  return this.badgeClassFromPercent(r?.cpuPercent ?? 0);
}


ramBadge(r?: ServerStats): 'ok' | 'warn' | 'crit' {
  return this.badgeClassFromPercent(this.ramPercent(r));
}


diskBadge(r?: ServerStats): 'ok' | 'warn' | 'crit' {
  return this.badgeClassFromPercent(this.diskPercent(r));
}

// --- class resolvers (must return: 'ok' | 'warn' | 'crit') ---
private level(pct?: number): 'ok' | 'warn' | 'crit' {
  const p = pct ?? 0;
  if (p >= 90) return 'crit';
  if (p >= 80) return 'warn';
  return 'ok';
}

}
