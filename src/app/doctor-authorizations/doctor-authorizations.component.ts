import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

type Row = {
  departnentDescripton: string;
  functionDescription: string;
  cellNumber: string;
  docname: string;
 // email: string;
  link: string;
  directManager: string;
  directManager2: string;
};

@Component({
  selector: 'app-doctor-authorizations',
  templateUrl: './doctor-authorizations.component.html',
  styleUrls: ['./doctor-authorizations.component.scss']
})
export class DoctorAuthorizationsComponent implements OnInit, AfterViewInit {
  titleUnit = 'הרשאות רופאים ';
  Title1 = ' — ';
  Title2 = 'סה״כ תוצאות ';
  totalResults = 0;
  showGraph = false; // present to keep the same layout API as your template (unused)

  columns: (keyof Row)[] = [
    'departnentDescripton',
    'functionDescription',
    'docname',
    'cellNumber',
   // 'email',
    'link',
    'directManager',
    'directManager2'
 
  ];

  filterForm: FormGroup;
  matTableDataSource = new MatTableDataSource<Row>([]);
  dataSource: Row[] = [];
  filteredData: Row[] = [];

  // Autocomplete for department
  departmentOptions: string[] = [];
  filteredResponsibilities!: Observable<string[]>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    // build dynamic form controls for each column + globals
    const group: Record<string, FormControl> = {};
    this.columns.forEach(c => (group[c] = new FormControl('')));
    group['globalFilter'] = new FormControl('', Validators.maxLength(200));
    this.filterForm = this.fb.group(group);
  }

  ngOnInit(): void {
    // load all rows
    this.fetchData();

    // set up department autocomplete based on the form control
    this.filteredResponsibilities = this.getFormControl('departnentDescripton').valueChanges.pipe(
      startWith(''),
      map(v => (typeof v === 'string' ? v : '')),
      map(value => this.filterDept(value))
    );

    // per-field filtering (debounced)
    Object.keys(this.filterForm.controls).forEach(key => {
      this.filterForm.get(key)!.valueChanges
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });
  }

  ngAfterViewInit(): void {
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
  }

  private fetchData(): void {
    // supports optional server-side filtering later if you wish
    const url = `${(environment as any).apiUrl?.replace(/\/?$/, '/') || '/api/'}doctor-auth`;
    this.http.get<Row[]>(url, { params: new HttpParams() }).subscribe(rows => {
      this.dataSource = rows || [];
      this.filteredData = [...this.dataSource];
      this.matTableDataSource.data = this.filteredData;
      this.totalResults = this.filteredData.length;

      // build unique department list for autocomplete
      this.departmentOptions = Array.from(
        new Set(this.dataSource.map(r => (r.departnentDescripton || '').trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'he'));
    });
  }

  // ---- UI helpers ----
  getFormControl(column: keyof Row | 'globalFilter'): FormControl {
    return this.filterForm.get(column) as FormControl;
  }

  getColumnLabel(column: keyof Row): string {
    const labels: Record<keyof Row, string> = {
      departnentDescripton: 'מחלקה',
      functionDescription: 'תפקיד',
      cellNumber: 'נייד',
      docname: 'שם רופא',
      //email: 'דוא״ל',
      link: 'קישור',
      directManager: 'מנהל ישיר',
      directManager2: 'מנהל עקיף',
    };
    return labels[column] ?? column;
  }

  private filterDept(value: string): string[] {
    const v = (value || '').toLowerCase();
    if (!v) return this.departmentOptions;
    return this.departmentOptions.filter(opt => opt.toLowerCase().includes(v));
  }

  // ---- actions ----
  resetFilters(): void {
    const global = this.getFormControl('globalFilter').value;
    this.filterForm.reset();
    this.getFormControl('globalFilter').setValue(global ? '' : '');
    this.applyFilters();
    if (this.paginator) this.paginator.firstPage();
  }

  applyFilters(): void {
    const formVals = this.filterForm.value as Record<string, string>;
    const global = (formVals['globalFilter'] || '').toString().toLowerCase();

    this.filteredData = this.dataSource.filter(row => {
      // per-column contains
      const perCol = this.columns.every(col => {
        const ctlVal = (formVals[col] || '').toString().toLowerCase().trim();
        if (!ctlVal) return true;
        const val = ((row[col] ?? '') + '').toLowerCase();
        return val.includes(ctlVal);
      });

      // global contains across any column
      const globalOk =
        !global ||
        this.columns.some(col => (((row[col] ?? '') + '').toLowerCase().includes(global)));

      return perCol && globalOk;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const wb: XLSX.WorkBook = { Sheets: { Data: ws }, SheetNames: ['Data'] };
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'doctor_authorizations.xlsx';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  navigateToGraphPage() { this.showGraph = !this.showGraph; }
  goToHome() { this.router.navigate(['/MainPageReports']); }


  normalizeLink(link: string | null | undefined): string {
    if (!link) return '';
    const l = link.trim();
  
    // pass-throughs
    if (/^https?:\/\//i.test(l)) return l;
    if (/^mailto:/i.test(l)) return l;
  
    // www. → assume https
    if (/^www\./i.test(l)) return `https://${l}`;
  
    // UNC path \\server\share\file → file:/// (may be blocked by browsers)
    if (/^\\\\/.test(l)) return 'file:///' + l.replace(/\\/g, '/');
  
    // fallback: assume https
    return `https://${l}`;
  }
  
  openLink(link: string) {
    const url = this.normalizeLink(link);
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  }
  
  
  // Build the perm URL from the mobile number
makePermUrlFromMobile(mobile?: string): string {
  if (!mobile) return '';
  // keep digits only
  let d = mobile.replace(/\D/g, '');

  // normalize +972 or 972 → 0xxxxxxxxx
  if (d.startsWith('972')) d = '0' + d.substring(3);

  // if already starts with 0, keep it; else just use as-is
  return d ? `https://poria.is-great.org/perm/?id=${d}` : '';
}

// Decide what URL to use: prefer explicit link; otherwise derive from cellNumber
resolvePermUrl(row: Row): string {
  const explicit = (row as any).link as string | undefined;
  const url = explicit && explicit.trim() ? this.normalizeLink(explicit) : this.makePermUrlFromMobile(row.cellNumber);
  return url;
}

// Open the perm page in a new tab
openPerm(row: Row) {
  const url = this.resolvePermUrl(row);
  if (url) window.open(url, '_blank', 'noopener');
}

// Download the perm page as PDF via backend (Edge headless route)
downloadPermPdf(row: Row) {
  const url = this.resolvePermUrl(row); // from earlier snippet
  if (!url) return;

  // doctor name from row (support both 'docname' and 'DOCNAME' just in case)
  const doctor = (row as any).docname || (row as any).DOCNAME || 'doctor';
  const date = this.formatDateYMD(new Date());
  const base = this.sanitizeFileName(`${doctor} - ${date}`);
  const fileName = `${base}.pdf`;

  const api = `${(environment as any).apiUrl?.replace(/\/?$/, '/') || '/api/'}doctor-auth/pdf-from-url-edge`;

  // pass fileName to backend (so Content-Disposition is nice), and still set a.download as a fallback
  const params: any = { url, waitMs: 12000, maxAttempts: 2, fileName };

  this.http.get(api, { params, responseType: 'blob' })
    .subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;            // <-- doctor name + date
      a.click();
      URL.revokeObjectURL(a.href);
    }, _ => alert('PDF יצירה נכשלה'));
}
private formatDateYMD(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // e.g., 2025-09-14
}

private sanitizeFileName(s: string): string {
  // remove characters Windows/macOS won’t allow in file names
  return (s || '')
    .replace(/[\\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


}
