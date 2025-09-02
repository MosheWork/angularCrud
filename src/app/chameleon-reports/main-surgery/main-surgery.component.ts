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
import { finalize } from 'rxjs/operators'; // ⬅ add



interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-main-surgery',
  templateUrl: './main-surgery.component.html',
  styleUrls: ['./main-surgery.component.scss']
})
export class MainSurgeryComponent implements OnInit {

  isLoading = true;
  kerenOptions: string[] = [];

  // 👤 User/profile (you can overwrite these from your auth service/localStorage)
  UserName = 'משתמש';
  profilePictureUrl = 'assets/user.png';
  backgroundImageUrl = 'assets/bg.jpg';   // put your background here
  logoUrl = 'assets/logo.png';

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
  'caseNumber',
  'patientName',
  'surgeryDate',
  'drg',
  'surgerY_NAME',
  'department',
  'diagCode',
  'icd9',
  'keren',
  'surgeryRunk',
  'registrarBillingRecommendation',
  'registrarComments',
  'registrarRequestForReportCorrection',
  'surgeryCodeList',
  'secretaryDRG'
];

// (optional) keep this if you want a list of ALL data fields for other logic
allFields: string[] = [
  'caseNumber','patientName','surgeryDate','hDayOfWeek','keren','drg','surgerY_NAME',
  'department','icd9','dischargeDate','surgeryLangth','surgeryRunk','doingText',
  'mainSurgeonNameFirst1','mainSurgeonNameLast1','mainSurgeonEmail1','mainSurgeonCell1',
  'mainSurgeonNameFirst2','mainSurgeonNameLast2','mainSurgeonEmail2','mainSurgeonCell2',
  'diagCode','diagDesc','registrarBillingRecommendation','registrarComments','registrarRequestForReportCorrection'
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
    this.loadUserProfile();      // ⬅ optional helper below

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
      this.filterForm.get('KerenFilter')?.valueChanges
  .pipe(debounceTime(50))
  .subscribe(() => this.applyFilters());
  }
  onSplashDone() {
    // do something after splash hides, if you want
  }
  
  private loadUserProfile() {
    this.isLoading = true;

    // Example: pull from localStorage / auth service
    const displayName = localStorage.getItem('displayName');
    const photoUrl = localStorage.getItem('photoUrl');
    const bgUrl = localStorage.getItem('bgUrl');
    const logo = localStorage.getItem('logoUrl');

    if (displayName) this.UserName = displayName;
    if (photoUrl) this.profilePictureUrl = photoUrl;
    if (bgUrl) this.backgroundImageUrl = bgUrl;
    if (logo) this.logoUrl = logo;
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
        //this.filteredData = [...this.dataSource];
        //this.matTableDataSource = new MatTableDataSource(this.filteredData);
        // ✅ Build Keren options AFTER data arrives
this.kerenOptions = Array.from(new Set(
  (this.dataSource || [])
    .map(r => (r.keren ?? r.Keren ?? r['KEREN'] ?? '').toString().trim())
    .filter(v => v.length > 0)
)).sort((a, b) => a.localeCompare(b, 'he'));
        this.applyFilters();

        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.totalResults = this.filteredData.length;
        this.graphData = this.filteredData;
        this.departmentOptions = Array.from(new Set(
          (this.dataSource || [])
            .map(r => (r.department ?? '').toString().trim())
            .filter(v => v.length > 0)
        )).sort((a, b) => a.localeCompare(b, 'he'));
        
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
 // Back-end supports departments, icd9, drg, keyword (comma-separated)
const dep = (this.filterForm.get('department')?.value || '').trim();
const icd9 = (this.filterForm.get('icd9')?.value || '').trim();
const drg  = (this.filterForm.get('drg')?.value  || '').trim();
const kw   = (this.filterForm.get('surgeryName')?.value || this.filterForm.get('patientName')?.value || '').trim();


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
    const to = new Date();
    to.setHours(23, 59, 59, 999);
  
    const from = new Date();
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
  
    const formControls: FormControls = {};
    this.columns.forEach((column) => (formControls[column] = new FormControl('')));
  
    formControls['pageSize'] = new FormControl(5);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');
    formControls['fromDate'] = new FormControl(from);  // last 30 days start
    formControls['toDate'] = new FormControl(to);      // today end-of-day
    formControls['DepartmentFilter'] = new FormControl<string[]>([]);
    formControls['KerenFilter'] = new FormControl<string[]>([]);

  
    return this.fb.group(formControls);
  }
  
  


  getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      caseNumber: 'מספר מקרה',
      patientName: 'שם מטופל',
      surgeryDate: 'תאריך ניתוח',
      hDayOfWeek: 'יום בשבוע',
      keren: 'קרן',
      drg: ' לפי זימון DRG',
      surgerY_NAME: 'שם ניתוח',
      department: 'מחלקה',
      icd9: 'פעולה - ICD9',
      dischargeDate: 'תאריך שחרור',
      surgeryLangth: 'משך ניתוח',
      surgeryRunk: 'דירוג ניתוח',
      doingText: 'סטטוס ביצוע',
      mainSurgeonNameFirst1: 'מנתח 1 - שם פרטי',
      mainSurgeonNameLast1: 'מנתח 1 - שם משפחה',
      mainSurgeonEmail1: 'מנתח 1 - אימייל',
      mainSurgeonCell1: 'מנתח 1 - נייד',
      mainSurgeonNameFirst2: 'מנתח 2 - שם פרטי',
      mainSurgeonNameLast2: 'מנתח 2 - שם משפחה',
      mainSurgeonEmail2: 'מנתח 2 - אימייל',
      mainSurgeonCell2: 'מנתח 2 - נייד',
      diagCode: 'קוד אבחנה',
      diagDesc: 'תיאור אבחנה',
      registrarBillingRecommendation: 'המלצת רשמת לחיוב',
      registrarComments: 'הערות רשמת',
      registrarRequestForReportCorrection: 'פניית רשמת לתיקון דוח'
    };
    return labels[column] || column;
  }
  

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();
    const fromDate = filters['fromDate'] ? new Date(filters['fromDate']) : null;
    const toDate   = filters['toDate']   ? new Date(filters['toDate'])   : null;
  
    this.filteredData = this.dataSource.filter((item) => {
      // per-column contains
      const perColumnOk = this.columns.every((column) => {
        const filterVal = (filters[column] || '').toString().trim().toLowerCase();
        if (!filterVal) return true;
        const cell = (item[column] ?? '').toString().toLowerCase();
        return cell.includes(filterVal);
      });
      if (!perColumnOk) return false;
  
      // global contains
      const globalOk = !globalFilter ||
        this.columns.some((column) => ((item[column] ?? '').toString().toLowerCase().includes(globalFilter)));
      if (!globalOk) return false;
  
   // date range (surgeryDate)
if (fromDate || toDate) {
  const dVal = item['surgeryDate'] ? new Date(item['surgeryDate']) : null;
  if (!dVal) return false;
  if (fromDate && dVal < fromDate) return false;
  if (toDate) {
    const toPlus = new Date(toDate);
    toPlus.setHours(23, 59, 59, 999);
    if (dVal > toPlus) return false;
  }
}


   // Department multi-select
const depSel: string[] = this.filterForm.get('DepartmentFilter')?.value || [];
if (depSel.length) {
  const curDep = (item['department'] ?? '').toString().toLowerCase();
  const match = depSel.some(d => d.toLowerCase() === curDep);
  if (!match) return false;
}

  // Keren multi-select
const kerenSel: string[] = this.filterForm.get('KerenFilter')?.value || [];
if (kerenSel.length) {
  const curKeren = (item['keren'] ?? '').toString().toLowerCase();
  const matchK = kerenSel.some(k => (k || '').toLowerCase() === curKeren);
  if (!matchK) return false;
}
      return true;
    });
  
    this.totalResults = this.filteredData.length;
  
    // (Re)bind table here
    if (!this.matTableDataSource) {
      this.matTableDataSource = new MatTableDataSource<any>(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
    } else {
      this.matTableDataSource.data = this.filteredData;
    }
  
    // go back to first page on filter change
    setTimeout(() => this.paginator?.firstPage(), 0);
  }
  

  resetFilters() {
    const pageSize = this.filterForm.get('pageSize')?.value || 5;
    this.filterForm.reset();
    this.filterForm.get('pageSize')?.setValue(pageSize);
    this.filterForm.get('globalFilter')?.setValue('');
    this.filterForm.get('DepartmentFilter')?.setValue([]);   
    this.filterForm.get('KerenFilter')?.setValue([]);


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
  const ref = this.dialog.open(MainSurgeryDialogComponent, {
    width: '600px',
    direction: 'rtl',
    data: {
      // core fields the dialog shows (keys kept as dialog expects)
      CaseNumber: row.caseNumber,
      PatientName: row.patientName,
      SurgeryDate: row.surgeryDate ? new Date(row.surgeryDate) : null,
      Department: row.department,
      DRG: row.drg,
      DiagCode: row.diagCode,
      ICD9: row.icd9,
      SURGERY_NAME: row.surgeryName,
      SurgeryRunk: row.surgeryRunk,
      DoingText: row.doingText,
    
      MainSurgeonNameFirst1: row.mainSurgeonNameFirst1,
      MainSurgeonNameLast1:  row.mainSurgeonNameLast1,
      MainSurgeonEmail1:     (row.mainSurgeonEmail1 || '').trim(),
      MainSurgeonCell1:      (row.mainSurgeonCell1  || '').trim(),
      MainSurgeonNameFirst2: row.mainSurgeonNameFirst2,
      MainSurgeonNameLast2:  row.mainSurgeonNameLast2,
      MainSurgeonEmail2:     (row.mainSurgeonEmail2 || '').trim(),
      MainSurgeonCell2:      (row.mainSurgeonCell2  || '').trim(),
    
      // latest comment snapshot
      RegistrarBillingRecommendation: row.registrarBillingRecommendation ?? '',
      RegistrarComments: row.registrarComments ?? '',
      RegistrarRequestForReportCorrection: row.registrarRequestForReportCorrection ?? '',
      CommentDate: row.commentDate ? new Date(row.commentDate) : null,
      CommentId: row.commentId ?? null
    } as MainSurgeryDialogData & {
      RegistrarBillingRecommendation?: string;
      RegistrarComments?: string;
      RegistrarRequestForReportCorrection?: string;
      CommentDate?: Date | null;
      CommentId?: number | null;
    }
    
  });

  // refresh table after saving in dialog
  ref.afterClosed().subscribe(res => {
    if (res?.updated) this.fetchData(); // or this.fetchWithBackendFilters();
  });
}




openMOHPriceList() {
  window.open(
    'https://www.gov.il/he/Departments/DynamicCollectors/moh-price-list?skip=0',
    '_blank'
  );
}

openICD9Mapping() {
  window.open(
    'https://www.gov.il/he/Departments/DynamicCollectors/moh-price-list?skip=0&moh_price_list_type=4',
    '_blank'
  );
}

}
