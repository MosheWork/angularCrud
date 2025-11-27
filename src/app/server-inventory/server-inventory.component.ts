import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../environments/environment';
import { of, forkJoin, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ServerInventoryEditDialogComponent } from './server-inventory-edit-dialog/server-inventory-edit-dialog.component';

// ===== Interfaces (Frontend DTOs) =====
export interface ServerInventoryDto {
  id?: number | null;
  serverName: string;
  ip?: string | null;
  forSystem?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ServerHealthDto {
  serverName: string;
  totalDiskGb: number;
  freeDiskGb: number;
  totalRamGb: number;
  usedRamGb: number;
  cpuUsagePercent: number;
  checkedAt: string; // ISO
}

export interface ServerHealthView {
  id: number | null;
  serverName: string;
  totalDiskGb: number;
  freeDiskGb: number;
  totalRamGb: number;
  usedRamGb: number;
  cpuUsagePercent: number;
}

@Component({
  selector: 'app-server-inventory',
  templateUrl: './server-inventory.component.html',
  styleUrls: ['./server-inventory.component.scss']
})
export class ServerInventoryComponent implements OnInit, AfterViewInit {
  @Input() forSystemFilter?: string;
  // NEW: tells the component it’s inside a dialog (you can hide big headers/forms if you want)
  @Input() embedded = false;
  loading = false;
  healthLoading = false;
  healthError: string | null = null;
  health: ServerHealthDto | null = null;

  displayedColumns: string[] = ['serverName','ramUsage','cpuUsage','diskUsage','actions'];
  dataSource = new MatTableDataSource<ServerHealthView>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  form!: FormGroup;
  isEdit = false;
  globalFilter = '';

  healthServerName = '';
  healthDomain = '';

  private readonly apiBase = `${environment.apiUrl}ServerInventory`;
  private readonly healthApiBase = `${environment.apiUrl}ServerHealth`;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      serverName: ['', [Validators.required, Validators.maxLength(128)]],
      ip: ['', [Validators.maxLength(45)]],
      forSystem: ['', [Validators.maxLength(128)]],
      description: ['', [Validators.maxLength(400)]],
    });

    this.loadAllHealthData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return (row.serverName || '').toLowerCase().includes(f);
    };
  }

  // ===== Helper calc + color logic =====
  private toPercent(numerator: number, denominator: number): number {
    if (!denominator || denominator <= 0) return 0;
    const p = (numerator / denominator) * 100;
    return isFinite(p) ? p : 0;
  }

  getRamPercent(r: ServerHealthView): number {
    return this.toPercent(r.usedRamGb, r.totalRamGb);
  }

  getDiskPercent(r: ServerHealthView): number {
    const used = r.totalDiskGb - r.freeDiskGb;
    return this.toPercent(used, r.totalDiskGb);
  }

  private severityByPercent(p: number): 'ok' | 'warn' | 'crit' {
    if (p >= 90) return 'crit';
    if (p >= 80) return 'warn';
    return 'ok';
  }

  getRamClass(r: ServerHealthView): 'ok' | 'warn' | 'crit' {
    return this.severityByPercent(this.getRamPercent(r));
  }
  getCpuClass(r: ServerHealthView): 'ok' | 'warn' | 'crit' {
    return this.severityByPercent(r.cpuUsagePercent || 0);
  }
  getDiskClass(r: ServerHealthView): 'ok' | 'warn' | 'crit' {
    return this.severityByPercent(this.getDiskPercent(r));
  }
  // =====================================

  // ===== Data loading =====
  loadAllHealthData(): void {
    this.loading = true;
  
    this.http.get<ServerInventoryDto[]>(this.apiBase).pipe(
      switchMap(inventoryList => {
        // 🔎 filter by ForSystem if provided
        if (this.forSystemFilter) {
          const f = this.forSystemFilter.trim().toLowerCase();
          inventoryList = inventoryList.filter(s => (s.forSystem || '').toLowerCase() === f);
        }
  
        if (inventoryList.length === 0) {
          return of([]);
        }
        const healthRequests: Observable<ServerHealthView>[] = inventoryList.map(server => {
          const healthUrl = `${this.healthApiBase}/${server.serverName}`;
          return this.http.get<ServerHealthDto>(healthUrl).pipe(
            map(healthData => ({
              id: server.id ?? null,
              serverName: server.serverName,
              totalDiskGb: healthData.totalDiskGb,
              freeDiskGb: healthData.freeDiskGb,
              totalRamGb: healthData.totalRamGb,
              usedRamGb: healthData.usedRamGb,
              cpuUsagePercent: healthData.cpuUsagePercent,
            })),
            catchError((_err: HttpErrorResponse) =>
              of({
                id: server.id ?? null,
                serverName: server.serverName + ' (שגיאת בריאות)',
                totalDiskGb: 0,
                freeDiskGb: 0,
                totalRamGb: 0,
                usedRamGb: 0,
                cpuUsagePercent: 0,
              } as ServerHealthView)
            )
          );
        });
        return forkJoin(healthRequests);
      }),
      catchError(err => {
        this.snack.open('נכשלה טעינת נתוני השרתים מהבסיס', 'סגור', { duration: 3000 });
        console.error(err);
        return of([]);
      })
    ).subscribe({
      next: (combinedData: ServerHealthView[]) => {
        this.dataSource.data = combinedData;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
  
  // ===== Filter =====
  applyGlobalFilter(value: string): void {
    this.globalFilter = value || '';
    this.dataSource.filter = this.globalFilter;
    if (this.paginator) this.paginator.firstPage();
  }

  // ===== Delete (unchanged) =====
  delete(row: ServerHealthView): void {
    if (!row.id) {
      this.snack.open('אין מזהה (ID) לשורה זו', 'סגור', { duration: 2500 });
      return;
    }
    if (!confirm(`למחוק את השרת "${row.serverName}"?`)) return;

    this.loading = true;
    this.http.delete(`${this.apiBase}/${row.id}`).subscribe({
      next: _ => {
        this.snack.open('נמחק בהצלחה', 'סגור', { duration: 2000 });
        this.loadAllHealthData();
      },
      error: _ => {
        this.loading = false;
        this.snack.open('מחיקה נכשלה', 'סגור', { duration: 3000 });
      }
    });
  }

  // ===== Add/Edit dialogs =====
  openAddDialog(): void {
    const ref = this.dialog.open(ServerInventoryEditDialogComponent, {
      width: '520px',
      data: { id: null }
    });

    ref.afterClosed().subscribe(res => {
      if (res === 'saved') {
        this.loadAllHealthData();
      }
    });
  }

  openEditDialog(row: ServerHealthView): void {
    if (!row.id) {
      // אפשר גם להעמיס לפי שם בעזרת api/ServerInventory/by-name?srv=...
      this.snack.open('אין מזהה לשורה זו לעריכה', 'סגור', { duration: 2500 });
      return;
    }

    const ref = this.dialog.open(ServerInventoryEditDialogComponent, {
      width: '520px',
      data: { id: row.id }
    });

    ref.afterClosed().subscribe(res => {
      if (res === 'saved') {
        this.loadAllHealthData();
      }
    });
  }

  // ===== Single-health check (unchanged) =====
  checkHealth(name?: string): void {
    const server = (name ?? this.healthServerName ?? '').trim();
    if (!server) {
      this.snack.open('נא להזין שם שרת לבדיקה', 'סגור', { duration: 2000 });
      return;
    }

    this.healthLoading = true;
    this.health = null;
    this.healthError = null;

    const url = `${this.healthApiBase}/${server}`;
    const domain = (this.healthDomain ?? '').trim();

    let params = new HttpParams();
    if (domain) params = params.set('domain', domain);

    this.http.get<ServerHealthDto>(url, { params }).subscribe({
      next: data => { this.health = data; this.healthLoading = false; },
      error: err => {
        this.healthLoading = false;
        this.healthError = err?.status === 404
          ? `לא נמצא שרת בשם "${server}"`
          : 'בקשה נכשלה לבדיקת סטטוס שרת';
        console.error(err);
      }
    });
  }
}

