import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

interface Row {
  userCode: number;
  userName: string;
  login_Name: string;
  iD_No: string;
  statusHebrew: string;
  profile_Code: number;
  profileName: string;
  unitCode: number;
  unitName: string;
}

@Component({
  selector: 'app-chameleon-user-profile-unit-map',
  templateUrl: './chameleon-user-profile-unit-map.component.html',
  styleUrls: ['./chameleon-user-profile-unit-map.component.scss']
})
export class ChameleonUserProfileUnitMapComponent implements OnInit {
  // UI
  loading = false;
  showGraph = false;
  Title1 = ' מיפוי משתמשים־פרופילים־יחידות ';
  Title2 = 'סה״כ תוצאות ';
  titleUnit = 'חמיליון ';
  totalResults = 0;

  // Material refs
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data
  matTableDataSource: MatTableDataSource<Row> = new MatTableDataSource<Row>([]);
  dataSource: Row[] = [];     // all rows from server
  filteredData: Row[] = [];   // filtered rows (client-side)

  // Columns (exact API keys)
  displayedColumns: (keyof Row)[] = [
    'login_Name','userName','iD_No','statusHebrew','profileName','unitName'
  ];

  // Filters
  filterForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    const ctrls: Record<string, FormControl> = {};
    this.displayedColumns.forEach(c => (ctrls[String(c)] = new FormControl('')));
    ctrls['globalFilter'] = new FormControl('');
    this.filterForm = this.fb.group(ctrls);
  }

  ngOnInit(): void {
    this.loadAll();  // ← load everything once

    // wire filters (client-side over all rows)
    this.displayedColumns.forEach(c => {
      this.filterForm.get(String(c))?.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });
    this.filterForm.get('globalFilter')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  // -------- Load ALL rows (no paging) ----------
  private loadAll(): void {
    this.loading = true;

    const url = environment.apiUrl + 'ChameleonUserProfileUnitMap/all?orderBy=true';
    this.http.get<Row[]>(url).subscribe({
      next: (rows) => {
        this.dataSource = rows || [];
        this.filteredData = [...this.dataSource];
        this.totalResults = this.dataSource.length;

        // rebuild DS and attach paginator/sort
        this.matTableDataSource = new MatTableDataSource<Row>(this.filteredData);
        if (this.paginator) this.matTableDataSource.paginator = this.paginator;
        if (this.sort) this.matTableDataSource.sort = this.sort;

        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load ChameleonUserProfileUnitMap (all)', err);
        this.dataSource = [];
        this.filteredData = [];
        this.matTableDataSource.data = [];
        this.totalResults = 0;
        this.loading = false;
      }
    });
  }

  // -------- Filters ----------
  getFormControl(c: string): FormControl {
    return (this.filterForm.get(c) as FormControl) || new FormControl('');
  }

  getColumnLabel(c: string): string {
    const labels: Record<string, string> = {
      login_Name: 'שם משתמש',
      userName: 'שם מלא',
      iD_No: 'ת״ז',
      statusHebrew: 'סטטוס',
      profileName: 'פרופיל',
      unitName: 'שם יחידה'
    };
    return labels[c] ?? c;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    const global = (filters['globalFilter'] || '').toString().toLowerCase();

    const filtered = this.dataSource.filter(row =>
      this.displayedColumns.every(c => {
        const val = String((row as any)[c] ?? '').toLowerCase();
        const f = (filters[String(c)] || '').toString().toLowerCase();
        return !f || val.includes(f);
      }) &&
      (global === '' || this.displayedColumns.some(c => String((row as any)[c] ?? '').toLowerCase().includes(global)))
    );

    this.filteredData = filtered;
    this.totalResults = filtered.length;
    this.matTableDataSource.data = filtered;

    // keep paginator sane after filtering
    this.paginator?.firstPage();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  // -------- Export (filtered) ----------
  exportToExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.filteredData);
    const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };
    const buf: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ChameleonUserProfileUnitMap.xlsx';
    a.click();
  }

  navigateToGraphPage() { this.showGraph = !this.showGraph; }
}
