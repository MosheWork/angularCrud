import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { of, forkJoin, Observable, from } from 'rxjs'; // 🛑 REQUIRED RXJS IMPORTS
import { catchError, map, switchMap } from 'rxjs/operators'; // 🛑 REQUIRED RXJS IMPORTS

// --- Data Models (Interfaces) ---
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

// Interface for the final combined data used in the table
export interface ServerHealthView {
    id: number | null;
    serverName: string;
    // All the health fields the table requires:
    totalDiskGb: number;
    freeDiskGb: number;
    totalRamGb: number;
    usedRamGb: number;
    cpuUsagePercent: number;
  }
// ---------------------------------

@Component({
  selector: 'app-server-inventory',
  templateUrl: './server-inventory.component.html',
  styleUrls: ['./server-inventory.component.scss']
})
export class ServerInventoryComponent implements OnInit, AfterViewInit {
  loading = false;
  healthLoading = false;
  healthError: string | null = null;
  health: ServerHealthDto | null = null;
  
  // table
  displayedColumns: string[] = [
        'serverName', 
        'ramUsage', 
        'cpuUsage', 
        'diskUsage', 
        'actions'
      ];
  
  // 🛑 FIX: Use the combined ServerHealthView type for the data source
  dataSource = new MatTableDataSource<ServerHealthView>([]); 
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

    this.loadAllHealthData(); // 🛑 Call the new bulk loading method
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Update the filter predicate to use ServerHealthView properties (e.g., serverName)
    this.dataSource.filterPredicate = (row, filter) => {
      const f = filter.trim().toLowerCase();
      // Only filter by server name for the health view table
      return (row.serverName || '').toLowerCase().includes(f);
    };
  }

  // 🛑 NEW/REPLACED: Function to load all inventory data + health data
  loadAllHealthData(): void {
    this.loading = true;
    
    // 1. Fetch the list of all servers from the inventory
    this.http.get<ServerInventoryDto[]>(this.apiBase).pipe(
      // 2. Map the array of inventory items to an array of Observable health calls
      switchMap(inventoryList => {
        if (inventoryList.length === 0) {
          return of([]); // Return an empty observable array if no servers exist
        }
        
        // Create an array of HTTP requests (one per server)
        const healthRequests: Observable<ServerHealthView>[] = inventoryList.map(server => {
          const healthUrl = `${this.healthApiBase}/${server.serverName}`;
          
          // Call the health API, combine results, and handle errors (e.g., server unreachable)
          return this.http.get<ServerHealthDto>(healthUrl).pipe(
            map(healthData => ({
              // Combine inventory ID and serverName with health data
              id: server.id ?? null,
              serverName: server.serverName,
              totalDiskGb: healthData.totalDiskGb,
              freeDiskGb: healthData.freeDiskGb,
              totalRamGb: healthData.totalRamGb,
              usedRamGb: healthData.usedRamGb,
              cpuUsagePercent: healthData.cpuUsagePercent,
            } as ServerHealthView)),
            // Handle errors for individual health checks
            catchError((err: HttpErrorResponse) => {
              console.error(`Health check failed for ${server.serverName}`, err);
              // Return a default object with zeroed/error health metrics
              return of({
                id: server.id ?? null,
                serverName: server.serverName + ' (שגיאת בריאות)', // Indicate failure
                totalDiskGb: 0,
                freeDiskGb: 0,
                totalRamGb: 0,
                usedRamGb: 0,
                cpuUsagePercent: 0,
              } as ServerHealthView);
            })
          );
        });
        
        // 3. Wait for all health requests to complete
        return forkJoin(healthRequests);
      }),
      catchError(err => {
        this.snack.open('נכשלה טעינת נתוני השרתים מהבסיס', 'סגור', { duration: 3000 });
        console.error(err);
        return of([]);
      })
    ).subscribe({
      next: (combinedData: ServerHealthView[]) => {
        // 4. Update the data source
        this.dataSource.data = combinedData;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  
  // ===== CRUD (inventory) =====
  // NOTE: The old loadData() method is replaced by loadAllHealthData().
  // We keep the other CRUD methods, but they should now call loadAllHealthData() 
  // after any successful operation (submit, delete).

  // loadData() removed

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

  edit(row: ServerHealthView): void { // Changed type to ServerHealthView
    // Fetch the full inventory row if needed, but for now we patch what we have
    this.isEdit = true;
    this.form.patchValue({
      id: row.id ?? null,
      serverName: row.serverName,
      // NOTE: IP, forSystem, description are not available in ServerHealthView
      // If editing requires these fields, you must fetch the full ServerInventoryDto separately.
    });
    window.scroll({ top: 0, behavior: 'smooth' });
  }

  delete(row: ServerHealthView): void { // Changed type to ServerHealthView
    if (!row.id) {
      this.snack.open('אין מזהה (ID) לשורה זו', 'סגור', { duration: 2500 });
      return;
    }
    if (!confirm(`למחוק את השרת "${row.serverName}"?`)) return;

    this.loading = true;
    this.http.delete(`${this.apiBase}/${row.id}`).subscribe({
      next: _ => {
        this.snack.open('נמחק בהצלחה', 'סגור', { duration: 2000 });
        this.loadAllHealthData(); // 🛑 Refresh using the new method
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
        this.loadAllHealthData(); // 🛑 Refresh using the new method
      },
      error: _ => {
        this.loading = false;
        this.snack.open('שמירה נכשלה', 'סגור', { duration: 3000 });
      }
    });
  }

  // ===== Health Check (Single server - unchanged) =====
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
        if (domain) {
          params = params.set('domain', domain);
        }
    
        this.http.get<ServerHealthDto>(url, { params }).subscribe({ 
          next: data => {
            this.health = data; 
            this.healthLoading = false;
          },
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