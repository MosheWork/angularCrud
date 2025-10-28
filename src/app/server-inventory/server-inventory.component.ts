import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';


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

@Component({
  selector: 'app-server-inventory',
  templateUrl: './server-inventory.component.html',
  styleUrls: ['./server-inventory.component.scss']
})
export class ServerInventoryComponent implements OnInit, AfterViewInit {
  loading = false;
// keep these fields you already have on the component:
healthLoading = false;
healthError: string | null = null;
health: ServerHealthDto | null = null;
  // table
  displayedColumns: string[] = [
    'serverName', 'ip', 'forSystem', 'description', 'createdAt', 'updatedAt', 'actions'
  ];
  dataSource = new MatTableDataSource<ServerInventoryDto>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // form
  form!: FormGroup;
  isEdit = false;

  // filter
  globalFilter = '';

  // health check
  healthServerName = '';
  healthDomain = ''; // optional domain
 

  private readonly apiBase = `${environment.apiUrl}ServerInventory`;
  private readonly healthApiBase = `${environment.apiUrl}ServerHealth`;
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      serverName: ['', [Validators.required, Validators.maxLength(128)]],
      ip: ['', [Validators.maxLength(45)]],
      forSystem: ['', [Validators.maxLength(128)]],
      description: ['', [Validators.maxLength(400)]],
    });

    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        (row.serverName || '').toLowerCase().includes(f) ||
        (row.ip || '').toLowerCase().includes(f) ||
        (row.forSystem || '').toLowerCase().includes(f) ||
        (row.description || '').toLowerCase().includes(f)
      );
    };
  }

  // ===== CRUD (inventory) =====
  loadData(): void {
    this.loading = true;
    this.http.get<ServerInventoryDto[]>(`${this.apiBase}`).subscribe({
      next: rows => {
        this.dataSource.data = rows ?? [];
        this.applyGlobalFilter(this.globalFilter);
        this.loading = false;
      },
      error: _ => {
        this.loading = false;
        this.snack.open('שגיאה בטעינת השרתים', 'סגור', { duration: 3000 });
      }
    });
  }

  applyGlobalFilter(value: string): void {
    this.globalFilter = value || '';
    this.dataSource.filter = this.globalFilter;
    if (this.paginator) this.paginator.firstPage();
  }

  resetForm(): void {
    this.isEdit = false;
    this.form.reset({
      id: null,
      serverName: '',
      ip: '',
      forSystem: '',
      description: ''
    });
  }

  edit(row: ServerInventoryDto): void {
    this.isEdit = true;
    this.form.patchValue({
      id: row.id ?? null,
      serverName: row.serverName,
      ip: row.ip ?? '',
      forSystem: row.forSystem ?? '',
      description: row.description ?? ''
    });
    window.scroll({ top: 0, behavior: 'smooth' });
  }

  delete(row: ServerInventoryDto): void {
    if (!row.id) {
      this.snack.open('אין מזהה (ID) לשורה זו', 'סגור', { duration: 2500 });
      return;
    }
    if (!confirm(`למחוק את השרת "${row.serverName}"?`)) return;

    this.loading = true;
    this.http.delete(`${this.apiBase}/${row.id}`).subscribe({
      next: _ => {
        this.snack.open('נמחק בהצלחה', 'סגור', { duration: 2000 });
        this.loadData();
      },
      error: _ => {
        this.loading = false;
        this.snack.open('מחיקה נכשלה', 'סגור', { duration: 3000 });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('נא למלא שם שרת', 'סגור', { duration: 2000 });
      return;
    }
    const payload: ServerInventoryDto = {
      id: this.form.value.id ?? null,
      serverName: (this.form.value.serverName || '').trim(),
      ip: (this.form.value.ip || '').trim() || null,
      forSystem: (this.form.value.forSystem || '').trim() || null,
      description: (this.form.value.description || '').trim() || null
    };

    this.loading = true;
    this.http.post<ServerInventoryDto>(`${this.apiBase}/upsert`, payload, {
      params: new HttpParams()
    }).subscribe({
      next: _ => {
        this.snack.open(this.isEdit ? 'עודכן בהצלחה' : 'נוסף בהצלחה', 'סגור', { duration: 2000 });
        this.resetForm();
        this.loadData();
      },
      error: _ => {
        this.loading = false;
        this.snack.open('שמירה נכשלה', 'סגור', { duration: 3000 });
      }
    });
  }

  // ===== Health Check =====
  checkHealth(name?: string): void {
        // Use the server name passed in, or the one from the input, and clean it up.
        const server = (name ?? this.healthServerName ?? '').trim();
        if (!server) {
          this.snack.open('נא להזין שם שרת לבדיקה', 'סגור', { duration: 2000 });
          return;
        }
    
        this.healthLoading = true;
        this.health = null;
        this.healthError = null;
    
        // 2. UPDATE: Construct the URL as /api/ServerHealth/{server}
        const url = `${this.healthApiBase}/${server}`; 
        // Get the domain, clean it up
        const domain = (this.healthDomain ?? '').trim(); 
        
        // Construct HttpParams, adding the domain only if it's not empty
        let params = new HttpParams();
        if (domain) {
          params = params.set('domain', domain); // The backend expects 'domain' query parameter
        }
    
        // 3. UPDATE: Change the expected response type to ServerHealthDto
        this.http.get<ServerHealthDto>(url, { params }).subscribe({ 
          next: data => {
            // The health check API returns ServerHealthDto
            this.health = data; 
            this.healthLoading = false;
          },
          error: err => {
            this.healthLoading = false;
            this.healthError = err?.status === 404
              ? `לא נמצא שרת בשם "${server}"`
      : 'בקשה נכשלה לבדיקת סטטוס שרת'; // Changed error message to be more generic
            console.error(err);
          }
        });
      }
}
