import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MainSurgeryDialogComponent, MainSurgeryDialogData } from './main-surgery-dialog/main-surgery-dialog.component';


import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';



interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-main-surgery',
  templateUrl: './main-surgery.component.html',
  styleUrls: ['./main-surgery.component.scss']
})
export class MainSurgeryComponent implements OnInit {

  showGraph = false;

  totalResults = 0;
  departmentOptions: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData: any[] = [];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  // Displayed columns (you can re-order/trim if needed)
// Columns actually shown in the table (no comments)
columns: string[] = [
  'CaseNumber',
  'PatientName',
  'SurgeryDate',
  'Keren',
  'DRG',
  'SURGERY_NAME',
  'Department',
  'ICD9',
  'SurgeryRunk',
  'DiagCode',
];

// (optional) keep this if you want a list of ALL data fields for other logic
allFields: string[] = [
  'CaseNumber','PatientName','SurgeryDate','HDayOfWeek','Keren','DRG','SURGERY_NAME',
  'Department','ICD9','DischargeDate','SurgeryLangth','SurgeryRunk','DoingText',
  'MainSurgeonNameFirst1','MainSurgeonNameLast1','MainSurgeonEmail1','MainSurgeonCell1',
  'MainSurgeonNameFirst2','MainSurgeonNameLast2','MainSurgeonEmail2','MainSurgeonCell2',
  'DiagCode','DiagDesc'
];


  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.fetchData();
    this.filterForm.get('DepartmentFilter')?.valueChanges
    .pipe(debounceTime(50))        // avoid distinctUntilChanged on arrays
    .subscribe(() => this.applyFilters());
  
    // Per-column filters (debounced)
    this.columns.forEach((column) => {
      this.filterForm.get(column)?.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });

    // Global + range filters
    this.filterForm.get('globalFilter')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());

    this.filterForm.get('fromDate')?.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged())
      .subscribe(() => this.applyFilters());

    this.filterForm.get('toDate')?.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  // Load once (front-end filtering). If you want server-side filtering, see fetchWithBackendFilters()
  fetchData(): void {
    // Optional: pass backend date range if provided (keeps payload smaller)
    let params = new HttpParams();
    const from = this.filterForm.get('fromDate')?.value;
    const to = this.filterForm.get('toDate')?.value;
    if (from) params = params.set('from', this.toApiDate(from));
    if (to) params = params.set('to', this.toApiDate(to));

    this.http.get<any[]>(environment.apiUrl + 'MainSurgery/GetAll', { params })
      .subscribe(data => {
        this.dataSource = data || [];
        this.filteredData = [...this.dataSource];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.totalResults = this.filteredData.length;
        this.graphData = this.filteredData;
        this.departmentOptions = Array.from(new Set(
          (this.dataSource || [])
            .map(r => (r.Department ?? '').toString().trim())
            .filter(v => v.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'he')); // nice for Hebrew
        
      });
  }

  // If you prefer querying the backend for every change, call this instead of applyFilters()
  fetchWithBackendFilters(): void {
    let params = new HttpParams();
    const from = this.filterForm.get('fromDate')?.value;
    const to = this.filterForm.get('toDate')?.value;
    if (from) params = params.set('from', this.toApiDate(from));
    if (to) params = params.set('to', this.toApiDate(to));

    // Back-end supports departments, icd9, drg, keyword (comma-separated)
    const dep = (this.filterForm.get('Department')?.value || '').trim();
    const icd9 = (this.filterForm.get('ICD9')?.value || '').trim();
    const drg = (this.filterForm.get('DRG')?.value || '').trim();
    const kw = (this.filterForm.get('SURGERY_NAME')?.value || this.filterForm.get('PatientName')?.value || '').trim();

    if (dep) params = params.set('departments', dep);
    if (icd9) params = params.set('icd9', icd9);
    if (drg) params = params.set('drg', drg);
    if (kw) params = params.set('keyword', kw);

    this.http.get<any[]>(environment.apiUrl + 'MainSurgery/GetAll', { params })
      .subscribe(data => {
        this.dataSource = data || [];
        this.applyFilters();
      });
  }

  private toApiDate(d: any): string {
    // ensures YYYY-MM-DD
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

 private createFilterForm() {
  const formControls: FormControls = {};
  this.columns.forEach((column) => {
    formControls[column] = new FormControl('');
  });

  formControls['pageSize'] = new FormControl(5);
  formControls['pageIndex'] = new FormControl(0);
  formControls['globalFilter'] = new FormControl('');
  formControls['fromDate'] = new FormControl(null);
  formControls['toDate'] = new FormControl(null);

  // NEW: multi-select for Department
  formControls['DepartmentFilter'] = new FormControl<string[]>([]);

  return this.fb.group(formControls);
}


  getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      CaseNumber: 'מספר תיק',
      PatientName: 'שם מטופל',
      SurgeryDate: 'תאריך ניתוח',
      HDayOfWeek: 'יום בשבוע',
      Keren: 'קרן',
      DRG: 'DRG',
      SURGERY_NAME: 'שם ניתוח',
      Department: 'מחלקה',
      ICD9: 'ICD9',
      DischargeDate: 'תאריך שחרור',
      SurgeryLangth: 'משך ניתוח',
      SurgeryRunk: 'דירוג ניתוח',
      DoingText: 'סטטוס ביצוע',
      MainSurgeonNameFirst1: 'מנתח 1 - שם פרטי',
      MainSurgeonNameLast1: 'מנתח 1 - שם משפחה',
      MainSurgeonEmail1: 'מנתח 1 - אימייל',
      MainSurgeonCell1: 'מנתח 1 - נייד',
      MainSurgeonNameFirst2: 'מנתח 2 - שם פרטי',
      MainSurgeonNameLast2: 'מנתח 2 - שם משפחה',
      MainSurgeonEmail2: 'מנתח 2 - אימייל',
      MainSurgeonCell2: 'מנתח 2 - נייד',
      DiagCode: 'קוד אבחנה',
      DiagDesc: 'תיאור אבחנה'
    };
    return labels[column] || column;
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
    const fromDate = filters['fromDate'] ? new Date(filters['fromDate']) : null;
    const toDate = filters['toDate'] ? new Date(filters['toDate']) : null;

    this.filteredData = this.dataSource.filter((item) => {
      // Per-column contains
      const perColumnOk = this.columns.every((column) => {
        const filterVal = (filters[column] || '').toString().trim().toLowerCase();
        if (!filterVal) return true;
        const cell = (item[column] ?? '').toString().toLowerCase();
        return cell.includes(filterVal);
      });

      if (!perColumnOk) return false;

      // Global contains
      const globalOk =
        !globalFilter ||
        this.columns.some((column) => ((item[column] ?? '').toString().toLowerCase().includes(globalFilter)));

      if (!globalOk) return false;

      // Date range (by SurgeryDate)
      if (fromDate || toDate) {
        const dVal = item['SurgeryDate'] ? new Date(item['SurgeryDate']) : null;
        if (!dVal) return false;
        if (fromDate && dVal < fromDate) return false;
        if (toDate) {
          // include the whole 'to' day
          const toPlus = new Date(toDate);
          toPlus.setHours(23, 59, 59, 999);
          if (dVal > toPlus) return false;
        }
      }
// Department multi-select filter
const depSel: string[] = this.filterForm.get('DepartmentFilter')?.value || [];
if (depSel.length) {
  const curDep = (item['Department'] ?? '').toString().toLowerCase();
  const match = depSel.some(d => d.toLowerCase() === curDep);
  if (!match) return false;
}

      return true;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
    this.graphData = this.filteredData;

    // Return to first page whenever filters change
    setTimeout(() => this.paginator?.firstPage(), 0);
  }

  resetFilters() {
    const pageSize = this.filterForm.get('pageSize')?.value || 5;
    this.filterForm.reset();
    this.filterForm.get('pageSize')?.setValue(pageSize);
    this.filterForm.get('globalFilter')?.setValue('');
    this.filterForm.get('DepartmentFilter')?.setValue([]);   // NEW

    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'MainSurgery_filtered.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }
// main-surgery.component.ts
// main-surgery.component.ts
openDetails(row: any) {
  this.dialog.open(MainSurgeryDialogComponent, {
    width: '600px',
    direction: 'rtl',
    data: {
      CaseNumber: row.CaseNumber,
      PatientName: row.PatientName,
      SurgeryDate: row.SurgeryDate,
      Department: row.Department,
      DRG: row.DRG,
      ICD9: row.ICD9,
      SURGERY_NAME: row.SURGERY_NAME,
      SurgeryRunk: row.SurgeryRunk,
      DoingText: row.DoingText,

      MainSurgeonNameFirst1: row.MainSurgeonNameFirst1,
      MainSurgeonNameLast1:  row.MainSurgeonNameLast1,
      MainSurgeonEmail1:     (row.MainSurgeonEmail1 || '').trim(),
      MainSurgeonCell1:      (row.MainSurgeonCell1  || '').trim(),
      MainSurgeonNameFirst2: row.MainSurgeonNameFirst2,
      MainSurgeonNameLast2:  row.MainSurgeonNameLast2,
      MainSurgeonEmail2:     (row.MainSurgeonEmail2 || '').trim(),
      MainSurgeonCell2:      (row.MainSurgeonCell2  || '').trim(),
    } as MainSurgeryDialogData
  });
}



}
