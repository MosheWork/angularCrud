import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';

import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);
type TraumaChartConfig = { labels: string[]; datasets: any[] };

export interface TimingRow {
  caseNumber: string;
  patientName: string;
  admissionTime: Date;
  targetTime: Date;
  minutes: number;
  diffText: string; // HH:MM
}

interface TraumaPatient {
  caseNumber: string;
  admissionDepartment: string;
  admissionTime: string;
  erReleaseTime: string;
  hospitalReleaseTime: string;
  ctTime: string | null;
  chestXRayTime: string | null;
  deathTime: string | null;
  surgeryTime: string | null;
  ultrasoundTechTime: string | null;
  shockRoom: string;
  patientName: string;
  departmentName: string;
  erDoctor: string;
  erNurse: string;
  receiveCause: string;
  receiveCauseDescription: string;
  remarks: string;
  relevant: number | null;
  month: number;
  week: number;
  year: number;
  transferToOtherInstitution: string;
  executionDetails: string;
  icdName?: string;
}


// ===== Simple timing helpers =====
function tStart(label: string) {
  const id = `${label}-${Math.random().toString(36).slice(2,7)}`;
  // prefer performance if available
  const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  console.time(id); // human-friendly
  return {
    step(stepLabel: string) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      console.log(`[TIMING] ${label} :: ${stepLabel} @ ${Math.round(now - start)} ms`);
    },
    end(finalLabel?: string) {
      if (finalLabel) console.log(`[TIMING] ${label} :: ${finalLabel}`);
      console.timeEnd(id);
    }
  };
}

// Optional: perf marks for Chrome Performance panel
function perfMark(name: string) {
  try { performance.mark(name); } catch {}
}
function perfMeasure(name: string, startMark: string, endMark: string) {
  try { performance.measure(name, startMark, endMark); } catch {}
}

@Component({
  selector: 'app-trauma-patients',
  templateUrl: './trauma-patients.component.html',
  styleUrls: ['./trauma-patients.component.scss']
})
export class TraumaPatientsComponent implements OnInit {
  displayedColumns: string[] = [
    'relevantToggle',
    'remarks',
    'relevant',
    'caseNumber',
    'patientName',
    'admissionDepartment',
    'departmentName',
    'admissionTime',
    'erReleaseTime',
    'hospitalReleaseTime',
    'ctTime',
    'chestXRayTime',
    'deathTime',
    'surgeryTime',
    'ultrasoundTechTime',
    'shockRoom',
    'icdName',
    'month',
    'week',
    'year',
    'receiveCause',
    'receiveCauseDescription',
    'erDoctor',
    'erNurse',
    'transferToOtherInstitution',
    'executionDetails'
  ];

  isDateColumn(column: string): boolean {
    return [
      'admissionTime',
      'erReleaseTime',
      'hospitalReleaseTime',
      'ctTime',
      'chestXRayTime',
      'deathTime',
      'surgeryTime',
      'ultrasoundTechTime'
    ].includes(column);
  }
/// new
// Add this field in the class
private _pendingData: TraumaPatient[] = [];
///
  // כותרות בעברית לפי המפתחות החדשים (camelCase)
  columnHeaders: { [key: string]: string } = {
    remarks: 'הערות',
    relevant: 'רלוונטי',
    caseNumber: 'מס מקרה',
    patientName: 'שם מטופל',
    admissionDepartment: 'מחלקה בקבלה',
    departmentName: 'מחלקה מאשפזת',
    shockRoom: 'חדר הלם',
    admissionTime: 'זמן קבלה',
    erReleaseTime: 'זמן שחרור ממיון',
    hospitalReleaseTime: 'זמן שחרור בית חולים',
    transferToOtherInstitution: 'העברה למוסד אחר',
    deathTime: 'זמן פטירה',
    ctTime: 'זמן CT',
    surgeryTime: 'זמן ניתוחים',
    icdName: 'תאור פעולה',
    year: 'שנה',
    month: 'חודש',
    week: 'שבוע',
    receiveCauseDescription: 'סיבת קבלה',
    erDoctor: 'רופא במיון',
    erNurse: 'אח/ות במיון',
    chestXRayTime: 'זמן צילום חזה',
    ultrasoundTechTime: 'זמן טכנאי אולטרסאונד',
    executionDetails: 'פרטי ביצוע'
  };
  get displayedColumnsWithToggle(): string[] {
    return ['relevantToggle', ...this.displayedColumns];
  }


// detail rows: one per patient that has valid times and ShockRoom === 'X'
ctDetails: Array<{
  caseNumber: string;
  patientName: string;
  admissionDepartment: string;
  admissionTime: Date;
  targetTime: Date;
  minutes: number;
}> = [];

surgeryDetails: Array<{
  caseNumber: string;
  patientName: string;
  admissionDepartment: string;
  admissionTime: Date;
  targetTime: Date;
  minutes: number;
}> = [];

// one simple 3-bar chart per flow (CT / Surgery)
public ctBucketPercentChart: TraumaChartConfig = { labels: [], datasets: [] };
public surgBucketPercentChart: TraumaChartConfig = { labels: [], datasets: [] };
public get isCTMonth(): boolean   { return this.ctGrouping === 'month'; }
public get isSurgMonth(): boolean { return this.surgGrouping === 'month'; }
// keep your Hebrew X labels
private readonly BUCKET_LABELS_HE: string[] = [
  'מתחת ל-26 דק׳',
  'בין 26 ל-60 דק׳',
  'מעל 60 דק׳'
];
// bucket summaries
ctBuckets: Array<{ bucket: string; count: number }> = [];
surgeryBuckets: Array<{ bucket: string; count: number }> = [];
public shockRoomCode: string = 'V';          // selector default (you asked for V)
public detailsCT: TimingRow[] = [];
public detailsSurgery: TimingRow[] = [];
// grouping state + aggregated data
public ctGrouping: 'year' | 'quarter' | 'month' = 'year';
public surgGrouping: 'year' | 'quarter' | 'month' = 'year';
public aggCT: any[] = [];
public aggSurg: any[] = [];
// Chart config objects passed to <app-trauma-graph>
public ctGraphData: { labels: string[]; datasets: any[] } = { labels: [], datasets: [] };
public surgGraphData: { labels: string[]; datasets: any[] } = { labels: [], datasets: [] };
// לטבלאות האגרגציות (CT/ניתוחים)
ctDataSource = new MatTableDataSource<any>([]);
surgDataSource = new MatTableDataSource<any>([]);

// ViewChilds ייעודיים לטבלאות האגרגציות
@ViewChild('ctPaginator') ctPaginator!: MatPaginator;
@ViewChild('surgPaginator') surgPaginator!: MatPaginator;
@ViewChild('ctSort') ctSort!: MatSort;
@ViewChild('surgSort') surgSort!: MatSort;
public showCTGraph = false;
public showSurgGraph = false;
@ViewChild('mainPaginator') set _mainPaginator(p: MatPaginator) {
  if (p) {
    this.dataSource.paginator = p;
    this.dataSource._updateChangeSubscription();
  }
}

@ViewChild('mainSort') set _mainSort(s: MatSort) {
  if (s) {
    this.dataSource.sort = s;
    if (!this.dataSource.sortingDataAccessor) {
      this.dataSource.sortingDataAccessor = (item: any, prop: string) => {
        if (prop === 'relevant') return item.relevant ?? -1;
        if (this.isDateColumn(prop)) {
          const v = item[prop];
          if (!v || this.isDefaultDate(v)) return -Infinity;
          const t = v instanceof Date ? +v : +new Date(v);
          return Number.isNaN(t) ? -Infinity : t;
        }
        const val = item[prop];
        return val == null ? '' : val.toString().toLowerCase();
      };
    }
    this.dataSource._updateChangeSubscription();
  }
}

// NEW: simple togglers
public toggleCTGraph(): void {
  this.showCTGraph = !this.showCTGraph;
  console.log('[CT] toggle graph:', this.showCTGraph, 'chartConfig:', this.ctGraphData);
}
public toggleSurgGraph(): void {
  this.showSurgGraph = !this.showSurgGraph;
  console.log('[SURG] toggle graph:', this.showSurgGraph, 'chartConfig:', this.surgGraphData);
}


//
  filterForm: FormGroup;
  totalResults: number = 0;
  titleUnit: string = 'דוח טראומה';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';
  originalData: TraumaPatient[] = []; // ✅ Store the original dataset
  isLoading:boolean=true;

  selectedPatient: any | null = null;
  dataSource = new MatTableDataSource<TraumaPatient>([]);
  editMode: { [key: string]: boolean } = {};
  editForms: { [key: string]: FormGroup  } = {};
  filteredData: any[] = [];

  // Unique filter options
  uniqueYears: number[] = [];
  uniqueMonths: number[] = [];
  uniqueWeeks: number[] = [];
  uniqueAdmissionDepartments: string[] = [];
  uniqueShockRooms: string[] = [];
  uniqueTransfers: string[] = [];
  uniqueReceiveCauses: string[] = [];
  TransferToOtherInstitution: string[] = [];

  // @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private datePipe: DatePipe

  ) {
    this.filterForm = this.createFilterForm();
  }




  ngOnInit(): void {
    // 1) sorting accessor for main table
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      if (property === 'relevant') return item.relevant ?? -1;
  
      if (this.isDateColumn(property)) {
        const v = item[property];
        if (!v || this.isDefaultDate(v)) return -Infinity;
        const t = v instanceof Date ? +v : +new Date(v);
        return Number.isNaN(t) ? -Infinity : t;
      }
  
      const val = item[property];
      return val == null ? '' : val.toString().toLowerCase();
    };
  
    // 2) fetch + set up filters
    this.fetchTraumaPatients();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }
  
  // gAfterViewInit(): void {
  //   // attach once

  
  //   // now push data in the next tick so MatTable renders only the first page
  //   requestAnimationFrame(() => {
  //     if (this._pendingData.length) {
  //       this.dataSource.data = this._pendingData;
  //       this._pendingData = [];
  //       this.wireMainTable();
  //     }
  //     this.isLoading = false;
  //   });
  
  //   // existing CT/Surg attachments:
  //   if (this.ctPaginator) this.ctDataSource.paginator = this.ctPaginator;
  //   if (this.ctSort)      this.ctDataSource.sort      = this.ctSort;
    
  //   if (this.surgPaginator) this.surgDataSource.paginator = this.surgPaginator;
  //   if (this.surgSort)      this.surgDataSource.sort      = this.surgSort;
  // }
  


  fetchTraumaPatients() {
    const t = tStart('fetchTraumaPatients');
    this.isLoading = true;
    perfMark('fetchTraumaPatients:start');
  
    const url = environment.apiUrl.replace(/\/$/, '') + '/Trauma/GetTraumaPatients';
  
    this.http.get<TraumaPatient[]>(url).subscribe({
      next: (raw) => {
        t.step('HTTP complete');
        const data = raw ?? [];
        console.log('[DATA] rows:', data.length);
  
        // ---------- preprocess rows (search string + timestamps) ----------
        const tPrep = tStart('prepRows');
        this.originalData = data.map(r => ({
          ...r,
          // one-time searchable string for global filter
          __search: Object.values(r as any)
            .map(v => (v ?? '').toString().toLowerCase())
            .join('|'),
          // numeric timestamps to avoid repeated Date parsing
          _admissionTs: r.admissionTime ? +new Date(r.admissionTime) : null,
          _ctTs:        r.ctTime        ? +new Date(r.ctTime)        : null,
          _surgTs:      r.surgeryTime   ? +new Date(r.surgeryTime)   : null
        }));
        tPrep.end('prepRows done');
  
        // ---------- unique filter options ----------
        const tU = tStart('buildUniqueFilters');
        this.uniqueYears = [...new Set(data.map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
        this.uniqueMonths = [...new Set(data.map(i => i.month).filter(Boolean))].sort((a, b) => b - a);
        this.uniqueWeeks = [...new Set(data.map(i => i.week).filter(Boolean))].sort((a, b) => b - a);
        this.uniqueAdmissionDepartments = [...new Set(data.map(i => i.admissionDepartment).filter(Boolean))].sort();
        this.uniqueShockRooms = [...new Set(data.map(i => i.shockRoom).filter(Boolean))].sort();
        this.uniqueTransfers = [...new Set(data.map(i => i.transferToOtherInstitution).filter(Boolean))].sort();
        this.uniqueReceiveCauses = [...new Set(data.map(i => i.receiveCauseDescription).filter(Boolean))].sort();
        tU.end('unique filters done');
  
        // ---------- initial dataset for the table (no filters yet) ----------
        this.filteredData = [...this.originalData];
        this.totalResults = this.filteredData.length;
  
        // ---------- compute metrics & timing tables ONCE ----------
        const tMetrics = tStart('recomputeMetrics');
        this.recomputeMetrics();
        tMetrics.end('recomputeMetrics done');
  
        const tTables = tStart('buildTimingTables');
        this.buildTimingTables();
        tTables.end('buildTimingTables done');
  
        // ---------- DO NOT bind to mat-table yet (avoid rendering 3k rows) ----------
        this._pendingData = this.filteredData;
  
        // mark code portion done
        t.end('fetchTraumaPatients code done');
        perfMark('fetchTraumaPatients:end');
        perfMeasure('fetchTraumaPatients total', 'fetchTraumaPatients:start', 'fetchTraumaPatients:end');
  
        // this ensures only the first page renders
        requestAnimationFrame(() => {
          if (this._pendingData.length) {
            this.dataSource.data = this._pendingData;
            this._pendingData = [];
          }
          this.isLoading = false; // flip loading AFTER first bind
          // optional: measure first paint
          const tPaint = tStart('first-table-paint');
          requestAnimationFrame(() => tPaint.end('first table paint done'));
        });
      },
      error: (err) => {
        console.error('Error fetching trauma patients:', err);
        this.isLoading = false;
        t.end('fetchTraumaPatients error');
      }
    });
  }
  
  // ngAfterViewInit(): void {
  //   this.wireMainTable();
  //   requestAnimationFrame(() => {
  //     if (this._pendingData.length) {
  //       this.dataSource.data = this._pendingData;
  //       this._pendingData = [];
  //       this.wireMainTable(); // table just got data, re-attach to be safe
  //     }
  //     this.isLoading = false;
  //   });
  // }
  
  
  
  

  private createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: new FormControl(''),
      relevantFilter: new FormControl(''),
      YearFilter: new FormControl([]),
      MonthFilter: new FormControl([]),
      WeekFilter: new FormControl([]),
      AdmissionDepartmentFilter: new FormControl([]),
      ShockRoomFilter: new FormControl([]),
      TransferFilter: new FormControl([]),
      ReceiveCauseDesFilter: new FormControl([])
    });
  }
  applyFilters() {
    const t = tStart('applyFilters');
    const f = this.filterForm.value;
  
    const globalFilter = (f.globalFilter || '').toLowerCase();
    const selectedYears  = f.YearFilter || [];
    const selectedMonths = f.MonthFilter || [];
    const selectedWeeks  = f.WeekFilter || [];
    const selectedAdmissionDepartments = f.AdmissionDepartmentFilter || [];
    const selectedShockRooms = f.ShockRoomFilter || [];
    const selectedTransfers  = f.TransferFilter || [];
    const selectedReceiveCauses = f.ReceiveCauseDesFilter || [];
    const relevantFilter = f.relevantFilter;
  
    const tFilter = tStart('filter pass');
    this.filteredData = this.originalData.filter((item:any) => {
      const matchesGlobal = globalFilter ? item.__search?.includes(globalFilter) : true;
  
      let matchesRelevant = true;
      if (relevantFilter === 'לא עודכן') matchesRelevant = item.relevant === null;
      else if (relevantFilter === '1')   matchesRelevant = item.relevant === 1;
      else if (relevantFilter === '2')   matchesRelevant = item.relevant === 2;
  
      const matchesYear = selectedYears.length   ? selectedYears.includes(item.year) : true;
      const matchesMonth = selectedMonths.length ? selectedMonths.includes(item.month) : true;
      const matchesWeek = selectedWeeks.length   ? selectedWeeks.includes(item.week) : true;
      const matchesAdmissionDepartment = selectedAdmissionDepartments.length ? selectedAdmissionDepartments.includes(item.admissionDepartment) : true;
      const matchesShockRoom = selectedShockRooms.length ? selectedShockRooms.includes(item.shockRoom) : true;
      const matchesTransfer  = selectedTransfers.length ? selectedTransfers.includes(item.transferToOtherInstitution) : true;
      const matchesReceiveCause = selectedReceiveCauses.length ? selectedReceiveCauses.includes(item.receiveCauseDescription) : true;
  
      return matchesGlobal && matchesRelevant && matchesYear && matchesMonth && matchesWeek &&
             matchesAdmissionDepartment && matchesShockRoom && matchesTransfer && matchesReceiveCause;
    });
    tFilter.end('filter pass done');
  
    this.dataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
    t.step(`after filter: ${this.totalResults} rows`);
  
    const tMetrics = tStart('recomputeMetrics');
    this.recomputeMetrics();
    tMetrics.end();
  
    const tTables = tStart('buildTimingTables');
    this.buildTimingTables();
    tTables.end();
  
    // setTimeout(() => {
    //   if (this.mainPaginator) {
    //     this.mainPaginator.firstPage();
    //     // do NOT reassign paginator/sort here; they’re already attached
    //   }
    // });
    t.end('applyFilters done');
  }
  

  resetFilters() {
    this.filterForm.reset({
      globalFilter: '',
      relevantFilter: '1',
      YearFilter: [],
      MonthFilter: [],
      WeekFilter: [],
      AdmissionDepartmentFilter: [],
      ShockRoomFilter: [],
      TransferFilter: [],
      ReceiveCauseDesFilter: []
    });

    this.filteredData = [...this.originalData];
    this.dataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;

  
  }

  
  

  exportToExcel() {
    if (!this.filteredData.length) {
      console.warn('No data available to export.');
      return;
    }

    const columnHeaders: { [key: string]: string } = this.columnHeaders;

    const formatted = this.filteredData.map(item => {
      const row: any = {};
      Object.keys(item).forEach((key) => {
        if (columnHeaders[key]) {
          row[columnHeaders[key]] = (item as any)[key];
        }
      });
      return row;
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formatted);
    const wb: XLSX.WorkBook = { Sheets: { 'טראומה': ws }, SheetNames: ['טראומה'] };
    XLSX.writeFile(wb, 'טראומה.xlsx');
  }
  
  enableEdit(caseNumber: string): void {
    this.editMode[caseNumber] = true;
  }

  cancelEdit(caseNumber: string): void {
    this.editMode[caseNumber] = false;
  }

  saveEdit(): void {
    if (!this.selectedPatient) return;
  
    // ✅ form is stored under camelCase key
    const key = this.selectedPatient.caseNumber;
    const fg = this.editForms[key];
    if (!fg) {
      console.error('[saveEdit] form group not found for', key);
      return;
    }
  
    // ✅ send PascalCase keys to match backend model
    const payload = {
      CaseNumber: this.selectedPatient.caseNumber,
      Remarks:    fg.get('Remarks')?.value ?? '',
      Relevant:   Number(fg.get('Relevant')?.value ?? this.selectedPatient.relevant ?? 0)
    };
  
    console.log('[saveEdit] POST InsertTraumaRemark', payload);
  
    const url = `${environment.apiUrl}`.replace(/\/$/, '') + '/Trauma/InsertTraumaRemark';
    this.http.post(url, payload).subscribe({
      next: (res) => {
        console.log('✅ saved', res);
        this.fetchTraumaPatients(); // reload table with remarks + relevant
        this.closeDialog();
      },
      error: (err) => {
        console.error('❌ save error', err, payload);
        alert('שגיאה בשמירה');
      }
    });
  }
  
  

  getFormControl(caseNumber: string, field: string): FormControl {
    return this.editForms[caseNumber]?.get(field) as FormControl;
  }

  openDialog(patient: TraumaPatient) {
    this.selectedPatient = patient;
  
    if (!this.editForms[patient.caseNumber]) {
      this.editForms[patient.caseNumber] = new FormGroup({
        CaseNumber: new FormControl(patient.caseNumber), // PascalCase for backend
        Remarks:    new FormControl(patient.remarks ?? ''),
        Relevant:   new FormControl(patient.relevant ?? null)
      });
    }
  }
  
  closeDialog() {
    this.selectedPatient = null;
  }
  isDefaultDate(value: any): boolean {
    const date = new Date(value);
    return date.getFullYear() === 1900;
  }

  onRelevantToggle(element: TraumaPatient, isChecked: boolean) {
    element.relevant = isChecked ? 1 : 0;

    // שומר ל־backend בפורמט PascalCase (כמו קודם)
    const updatedData = {
      CaseNumber: element.caseNumber,
      Relevant: element.relevant,
      Remarks: element.remarks || ''
    };

    this.http.post(environment.apiUrl + 'Trauma/InsertTraumaRemark', updatedData).subscribe(
      () => this.fetchTraumaPatients(),
      (error) => console.error('Error updating Relevant:', error)
    );
  }
  formatDialogValue(column: string, value: any): string {
    if (this.isDateColumn(column) && value && !this.isDefaultDate(value)) {
      return this.datePipe.transform(value, 'dd/MM/yyyy HH:mm') || '';
    }
    return value;
  }
  onDialogRelevantToggle(checked: boolean): void {
    if (!this.selectedPatient) return;
  
    // 1) call the same backend/update logic you use in the table
    this.onRelevantToggle(this.selectedPatient, checked);
  
    // 2) keep dialog model in sync
    const newVal = checked ? 1 : 0;
    this.selectedPatient = { ...this.selectedPatient, relevant: newVal };
  
    // 3) keep the dialog form control (Relevant) in sync, if present
    const fg = this.editForms?.[this.selectedPatient.caseNumber];
    fg?.get('Relevant')?.setValue(newVal, { emitEvent: false });
  
    // 4) (optional) reflect immediately in the table’s datasource
    const idx = this.dataSource.data.findIndex(
      (r: any) => r.caseNumber === this.selectedPatient.caseNumber
    );
    if (idx > -1) {
      const copy = [...this.dataSource.data];
      copy[idx] = { ...copy[idx], relevant: newVal };
      this.dataSource.data = copy;
    }
  }


  //

  /** returns Date or null (filters null/empty/"1900-01-01" placeholders) */
private toRealDate(v: any): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() === 1900) return null;   // your sentinel
  return d;
}

/** minutes (>=0) or null if invalid */
private minutesDiff(from: any, to: any): number | null {
  const a = this.toRealDate(from);
  const b = this.toRealDate(to);
  if (!a || !b) return null;
  const mins = Math.round((+b - +a) / 60000);
  return mins >= 0 ? mins : null;
}

/** optional: keep only the last row per caseNumber (if you have duplicates) */
// private uniqueByCase(rows: TraumaPatient[]): TraumaPatient[] {
//   const map = new Map<string, TraumaPatient>();
//   for (const r of rows) map.set(r.caseNumber, r);
//   return Array.from(map.values());
// }

private buildDetails(
  rows: TraumaPatient[],
  targetKey: 'ctTime' | 'surgeryTime'
) {
  type Detail = {
    caseNumber: string;
    patientName: string;
    admissionDepartment: string;
    admissionTime: Date;
    targetTime: Date;
    minutes: number;
  };

  const arr: Detail[] = rows
    // only shock room = 'X'
    .filter(r => (r.shockRoom ?? '').toString().trim().toUpperCase() === 'V')
    // map to details with minutes diff; drop invalid
    .map(r => {
      const mins = this.minutesDiff(r.admissionTime, (r as any)[targetKey]);
      if (mins === null) return null;
      return {
        caseNumber: r.caseNumber,
        patientName: r.patientName,
        admissionDepartment: r.admissionDepartment,
        admissionTime: this.toRealDate(r.admissionTime)!,
        targetTime: this.toRealDate((r as any)[targetKey])!,
        minutes: mins
      } as Detail;
    })
    .filter((x): x is Detail => !!x);

  return arr.sort((a, b) => a.minutes - b.minutes);
}

private toBucket(minutes: number): string {
  if (minutes < 26) return 'Under 26 Min';
  if (minutes <= 60) return 'Between 26 and 60 Min';
  return 'More than 60 Min';
}

private buildBuckets(details: Array<{ minutes: number }>) {
  const counts = new Map<string, number>([
    ['Under 26 Min', 0],
    ['Between 26 and 60 Min', 0],
    ['More than 60 Min', 0]
  ]);
  for (const d of details) {
    const b = this.toBucket(d.minutes);
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  return Array.from(counts, ([bucket, count]) => ({ bucket, count }));
}

/** call this whenever data/filters change */
private recomputeMetrics() {
  const base = this.filteredData?.length ? this.filteredData as TraumaPatient[] : this.originalData;

  this.ctDetails      = this.buildDetails(base, 'ctTime');
  this.ctBuckets      = this.buildBuckets(this.ctDetails);

  this.surgeryDetails = this.buildDetails(base, 'surgeryTime');
  this.surgeryBuckets = this.buildBuckets(this.surgeryDetails);

  // NEW: percent charts
  const ctCounts   = this.getBucketCounts(this.ctDetails);
  const surgCounts = this.getBucketCounts(this.surgeryDetails);
  this.ctBucketPercentChart   = this.makeBucketPercentChart('קבלה → CT', ctCounts);
  this.surgBucketPercentChart = this.makeBucketPercentChart('קבלה → ניתוחים', surgCounts);
}


  // --- build timing tables from raw data (originalData) ---
  private buildTimingTables(): void {
    const base = (this.filteredData?.length ? this.filteredData : this.originalData) || [];
    const wantCode = (this.shockRoomCode || '').trim().toUpperCase();
  
    const isValidDate = (v: any) => !!v && !this.isDefaultDate(v);
    const toDate = (v: any) => (v instanceof Date ? v : new Date(v));
    const fmtDiff = (mins: number) => {
      const m = Math.max(0, Math.round(mins));
      const h = Math.floor(m / 60);
      const mm = (m % 60).toString().padStart(2, '0');
      return `${h}:${mm}`;
    };
  
    // קבלה → CT
    this.detailsCT = base
      .filter(r =>
        (r.shockRoom || '').trim().toUpperCase() === wantCode &&
        isValidDate(r.admissionTime) &&
        isValidDate(r.ctTime)
      )
      .map(r => {
        const a = toDate(r.admissionTime);
        const t = toDate(r.ctTime);
        const minutes = (t.getTime() - a.getTime()) / 60000;
        return {
          caseNumber: r.caseNumber,
          patientName: r.patientName,
          admissionTime: a,
          targetTime: t,
          minutes: Math.round(minutes),
          diffText: fmtDiff(minutes)
        } as TimingRow;
      })
      .sort((a, b) => a.minutes - b.minutes);
  
    // קבלה → ניתוחים
    this.detailsSurgery = base
      .filter(r =>
        (r.shockRoom || '').trim().toUpperCase() === wantCode &&
        isValidDate(r.admissionTime) &&
        isValidDate(r.surgeryTime)
      )
      .map(r => {
        const a = toDate(r.admissionTime);
        const t = toDate(r.surgeryTime);
        const minutes = (t.getTime() - a.getTime()) / 60000;
        return {
          caseNumber: r.caseNumber,
          patientName: r.patientName,
          admissionTime: a,
          targetTime: t,
          minutes: Math.round(minutes),
          diffText: fmtDiff(minutes)
        } as TimingRow;
      })
      .sort((a, b) => a.minutes - b.minutes);
  
    // refresh aggregates
    this.updateAggCT();
    this.updateAggSurg();
  }
  
  private classifyBucket(mins: number): 'under26' | 'between26_60' | 'over60' {
    if (mins < 26) return 'under26';
    if (mins <= 60) return 'between26_60';
    return 'over60';
  }
  
  private computeAggregate(rows: TimingRow[], mode: 'year' | 'quarter' | 'month'): any[] {
    const map = new Map<string, any>();
  
    for (const r of rows) {
      const d = r.admissionTime instanceof Date ? r.admissionTime : new Date(r.admissionTime);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const quarter = Math.floor((month - 1) / 3) + 1;
  
      const key =
        mode === 'year'
          ? `${year}`
          : mode === 'quarter'
          ? `${year}|Q${quarter}`
          : `${year}|M${month.toString().padStart(2, '0')}`;
  
      if (!map.has(key)) {
        map.set(key, {
          year,
          quarter: mode === 'quarter' ? quarter : undefined,
          month: mode === 'month' ? month : undefined,
          under26: 0,
          between26_60: 0,
          over60: 0,
          total: 0
        });
      }
      const o = map.get(key);
      o[this.classifyBucket(r.minutes)]++;
      o.total++;
    }
  
    const out = Array.from(map.values());
    out.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.quarter != null && b.quarter != null) return a.quarter - b.quarter;
      if (a.month != null && b.month != null) return a.month - b.month;
      return 0;
    });
    return out;
  }
  
  // column sets for mat-table
  public get ctColumns(): string[] {
    return this.columnsForMode(this.ctGrouping);
  }
  public get surgColumns(): string[] {
    return this.columnsForMode(this.surgGrouping);
  }
  private columnsForMode(mode: 'year' | 'quarter' | 'month'): string[] {
    const base = ['year'];
    if (mode === 'quarter') base.push('quarter');
    if (mode === 'month') base.push('month');
    return [...base, 'under26', 'between26_60', 'over60', 'total'];
  }
  
  // actions
  public onShockRoomCodeChange(code: string): void {
    this.shockRoomCode = (code || 'V').toUpperCase();
    this.buildTimingTables();
  }
  public setCTGrouping(mode: 'year' | 'quarter' | 'month') {
    this.ctGrouping = mode;
    this.updateAggCT();
  }
  public setSurgGrouping(mode: 'year' | 'quarter' | 'month') {
    this.surgGrouping = mode;
    this.updateAggSurg();
  }

// CT
public updateAggCT() {
  this.aggCT = this.computeAggregate(this.detailsCT, this.ctGrouping);
  this.ctDataSource.data = this.aggCT;
  if (this.ctPaginator) this.ctDataSource.paginator = this.ctPaginator;
  if (this.ctSort)      this.ctDataSource.sort      = this.ctSort;

  if (this.ctGrouping === 'quarter') {
    this.ctGraphData    = this.makeQuarterSubgroupChartConfig(this.aggCT);
    this.ctMonthCharts  = undefined;
  } else if (this.ctGrouping === 'month') {
    this.ctMonthCharts  = this.makeMonthSplitChartConfigs(this.aggCT);
    this.ctGraphData    = { labels: [], datasets: [] }; // not used in month mode
  } else { // year
    this.ctGraphData    = this.makeSeriesChartJs(this.aggCT, 'year');
    this.ctMonthCharts  = undefined;
  }
}

// Surgery
public updateAggSurg() {
  this.aggSurg = this.computeAggregate(this.detailsSurgery, this.surgGrouping);
  this.surgDataSource.data = this.aggSurg;
  if (this.surgPaginator) this.surgDataSource.paginator = this.surgPaginator;
  if (this.surgSort)      this.surgDataSource.sort      = this.surgSort;

  if (this.surgGrouping === 'quarter') {
    this.surgGraphData   = this.makeQuarterSubgroupChartConfig(this.aggSurg);
    this.surgMonthCharts = undefined;
  } else if (this.surgGrouping === 'month') {
    this.surgMonthCharts = this.makeMonthSplitChartConfigs(this.aggSurg);
    this.surgGraphData   = { labels: [], datasets: [] };
  } else { // year
    this.surgGraphData   = this.makeSeriesChartJs(this.aggSurg, 'year');
    this.surgMonthCharts = undefined;
  }
}

  
  
  
  
  
  // exports
  public exportAggCTToExcel(): void {
    this.exportAggregate(this.aggCT, this.ctGrouping, 'סיכום_קבלה_עד_CT.xlsx');
  }
  public exportAggSurgeryToExcel(): void {
    this.exportAggregate(this.aggSurg, this.surgGrouping, 'סיכום_קבלה_עד_ניתוחים.xlsx');
  }
  private exportAggregate(rows: any[], mode: 'year'|'quarter'|'month', fileName: string) {
    if (!rows?.length) return;
    const titleMap: Record<string, string> = {
      year: 'שנה',
      quarter: 'רבעון',
      month: 'חודש',
      under26: 'מתחת ל-26 דק׳',
      between26_60: 'בין 26 ל-60 דק׳',
      over60: 'מעל 60 דק׳',
      total: 'סה״כ מקרים'
    };
    const data = rows.map(r => ({
      [titleMap['year']]: r.year,
      ...(mode === 'quarter' ? { [titleMap['quarter']]: r.quarter } : {}),
      ...(mode === 'month' ? { [titleMap['month']]: r.month } : {}),
      [titleMap['under26']]: r.under26,
      [titleMap['between26_60']]: r.between26_60,
      [titleMap['over60']]: r.over60,
      [titleMap['total']]: r.total
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { 'סיכום' : ws }, SheetNames: ['סיכום'] };
    XLSX.writeFile(wb, fileName);
  }

  
  public exportCTToExcel(): void {
    this.exportTimingToExcel(this.detailsCT, 'זמן_מקבלה_עד_CT.xlsx', 'זמן CT');
  }
  
  public exportSurgeryToExcel(): void {
    this.exportTimingToExcel(this.detailsSurgery, 'זמן_מקבלה_עד_ניתוחים.xlsx', 'זמן ניתוחים');
  }
  
  private exportTimingToExcel(rows: TimingRow[], fileName: string, targetLabel: string): void {
    if (!rows?.length) return;
    const data = rows.map(r => ({
      'מס׳ מקרה': r.caseNumber,
      'שם מטופל': r.patientName,
      'זמן קבלה': this.datePipe.transform(r.admissionTime, 'dd/MM/yyyy HH:mm'),
      [targetLabel]: this.datePipe.transform(r.targetTime, 'dd/MM/yyyy HH:mm'),
      'הפרש (ש:ד)': r.diffText,
      'דקות': r.minutes
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { 'טבלה' : ws }, SheetNames: ['טבלה'] };
    XLSX.writeFile(wb, fileName);
  }





// X-axis has 3 buckets; each dataset is one year (color per year)
/** Build Chart.js data: X = 3 buckets; each dataset = a year */


/** Localized bucket labels on the X axis */
private readonly BUCKET_LABELS = [
  'מתחת ל-26 דק׳',
  'בין 26 ל-60 דק׳',
  'מעל 60 דק׳'
];

/**
 * Build a Chart.js-compatible config with one dataset per period,
 * using the *current* grouping: 'year' | 'quarter' | 'month'.
 *
 * Input rows are the result of computeAggregate(...), so each row has:
 *   { year, (quarter|month?), under26, between26_60, over60, total }
 */
private makeSeriesChartJs(
  rows: Array<{year:number; under26:number; between26_60:number; over60:number}>,
  mode: 'year'|'quarter'|'month'
) {
  const labels = ['מתחת ל-26 דק׳','בין 26 ל-60 דק׳','מעל 60 דק׳'];

  const datasets = rows.map(r => {
    const u = r.under26 ?? 0, b = r.between26_60 ?? 0, o = r.over60 ?? 0;
    const total = u + b + o;
    const pct = (n:number) => (total ? (n * 100) / total : 0);
    const t = `${r.year}`;

    return {
      label: t,
      data: [pct(u), pct(b), pct(o)],
      rawCounts: [u, b, o],
      rawTotal: total,
      bottomLabels: [t, t, t]
    };
  });

  return { labels, datasets };
}


private makeQuarterSubgroupChartConfig(
  rows: Array<{ year:number; quarter:number; under26:number; between26_60:number; over60:number; }>
): { labels: string[]; datasets: any[] } {

  const labels = ['מתחת ל-26 דק׳', 'בין 26 ל-60 דק׳', 'מעל 60 דק׳'];
  const years = Array.from(new Set(rows.map(r => r.year))).sort((a,b)=>a-b);
  const pct = (n:number, d:number) => d ? (n * 100) / d : 0;

  const qColor: Record<number, string> = {
    1: 'rgba(54, 162, 235, 0.6)',
    2: 'rgba(255, 99, 132, 0.6)',
    3: 'rgba(255, 206, 86, 0.6)',
    4: 'rgba(75, 192, 192, 0.6)',
  };

  const datasets: any[] = [];
  for (const y of years) {
    for (let q = 1; q <= 4; q++) {
      const r = rows.find(x => x.year === y && x.quarter === q);
      const u = r?.under26 ?? 0;
      const b = r?.between26_60 ?? 0;
      const o = r?.over60 ?? 0;
      const total = u + b + o;

      const t = `${y} רבעון ${q}`; // ⬅️ THIS is the time text you wanted

      datasets.push({
        label: `${y}-Q${q}`,
        data: [pct(u,total), pct(b,total), pct(o,total)],
        rawCounts: [u, b, o],
        rawTotal: total,

        // ⬇️ Bottom time label (repeated for the 3 buckets)
        bottomLabels: [t, t, t],

        backgroundColor: qColor[q],
        borderColor: qColor[q].replace('0.6','1'),
        borderWidth: 1,
        barPercentage: 0.85,
        categoryPercentage: 0.9
      });
    }
  }

  return { labels, datasets };
}




/** Chart config: 3 buckets on X; inside each bucket sub-bars for every (Year × Month). */
/** Month split: 3 separate charts (one per bucket) with X = YYYY-MM (sorted). */
private makeMonthSplitChartConfigs(
  rows: Array<{ year:number; month:number; under26:number; between26_60:number; over60:number; }>
) {
  // unique sets
  const months = Array.from(new Set(rows.map(r => r.month))).sort((a,b)=>a-b);   // 1..12 present
  const years  = Array.from(new Set(rows.map(r => r.year))).sort((a,b)=>a-b);   // 2023,2024,2025..

  // build ordered points: month-major, year-minor
  const pts: Array<{label:string; year:number; u:number; b:number; o:number}> = [];
  for (const m of months) {
    for (const y of years) {
      const r = rows.find(rr => rr.year === y && rr.month === m);
      const mm = String(m).padStart(2,'0');
      pts.push({
        label: `${y}-${mm}`,
        year: y,
        u: r?.under26 ?? 0,
        b: r?.between26_60 ?? 0,
        o: r?.over60 ?? 0
      });
    }
  }

  const labels = pts.map(p => p.label);

  // palette per year -> one color per bar depending on its year
  const palette = [
    'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
  ];
  const yearColor = new Map<number,string>();
  years.forEach((y,i)=>yearColor.set(y, palette[i % palette.length]));

  const bg = pts.map(p => yearColor.get(p.year)!);

  return {
    under:   { labels, datasets: [{ label: 'מתחת ל-26 דק׳', data: pts.map(p => p.u), backgroundColor: bg }] },
    between: { labels, datasets: [{ label: 'בין 26 ל-60 דק׳', data: pts.map(p => p.b), backgroundColor: bg }] },
    over:    { labels, datasets: [{ label: 'מעל 60 דק׳',    data: pts.map(p => p.o), backgroundColor: bg }] }
  };
}


// inside TraumaPatientsComponent class:

// when grouping = 'month', we split into 3 charts
public ctMonthCharts?: { under: {labels:string[];datasets:any[]},
                         between: {labels:string[];datasets:any[]},
                         over: {labels:string[];datasets:any[]} };

public surgMonthCharts?: { under: {labels:string[];datasets:any[]},
                           between: {labels:string[];datasets:any[]},
                           over: {labels:string[];datasets:any[]} };

/** Count rows into the three buckets */
private getBucketCounts(details: Array<{ minutes: number }>) {
  let u = 0, b = 0, o = 0;
  for (const d of details) {
    if (d.minutes < 26) u++;
    else if (d.minutes <= 60) b++;
    else o++;
  }
  const total = u + b + o;
  return { u, b, o, total };
}

/** Build a 3-bar % chart (with labels above bars) */
private makeBucketPercentChart(
  title: string,
  counts: { u:number; b:number; o:number; total:number }
): TraumaChartConfig {
  const { u, b, o, total } = counts;
  const pct = (n:number) => (total ? (n * 100) / total : 0);

  return {
    labels: ['מתחת ל-26 דק׳', 'בין 26 ל-60 דק׳', 'מעל 60 דק׳'],
    datasets: [{
      label: title,
      data: [pct(u), pct(b), pct(o)],               // % values for Y
      backgroundColor: ['#7fc97f', '#beaed4', '#fdc086'],
      borderColor:    ['#7fc97f', '#beaed4', '#fdc086'],
      borderWidth: 1,
      // 👇 custom fields for bottom labels
      rawCounts: [u, b, o],
      rawTotal: total
    }]
  };
}



}
