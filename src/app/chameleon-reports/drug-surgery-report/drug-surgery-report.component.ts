import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef ,ElementRef,} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ProcedureICD9ManagerDialogComponent } from './procedure-icd9-manager-dialog/procedure-icd9-manager-dialog.component';
import { AuthenticationService } from '../../../app/services/authentication-service/authentication-service.component';
import { Chart, registerables, ChartData, ChartConfiguration } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(ChartDataLabels);  // ← add this


@Component({
  selector: 'app-drug-surgery-report',
  templateUrl: './drug-surgery-report.component.html',
  styleUrls: ['./drug-surgery-report.component.scss'],
})
export class DrugSurgeryReportComponent implements OnInit, AfterViewInit {
  filteredResponsibilities: any | undefined;
  showGraph = false;
  Title1 = 'דו״ח תרופות וניתוחים - ';
  Title2 = 'תוצאות סה״כ: ';
  titleUnit = 'מחלקת ניתוחים ';
  totalResults = 0;
  isLoading = false;
  UserName: string = '';
  totalRows: number = 0;
  noDrugsPercentage: number = 0;
  lastCounts: number[] = [];
  lastPercents: number[] = [];

  profilePictureUrl: string = 'assets/default-user.png';
  LoginUserName: string = '';
  DisplayUserName: string = '';
  profilePicture: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('mainSort') sort!: MatSort;
  @ViewChild('mainPaginator') mainPaginator!: MatPaginator;
  @ViewChild('noDrugsPaginator') noDrugsPaginator!: MatPaginator;
  @ViewChild('noDrugsSort') noDrugsSort!: MatSort;
  @ViewChild('timeGroupCanvas') timeGroupCanvas!: ElementRef<HTMLCanvasElement>;

// ▼ Pivot for "GiveOrderName × TimeGroup"
giveOrderMatrixColumns: string[] = ['giveOrderName', 'total']; // safe initial columns
giveOrderMatrixData = new MatTableDataSource<any>([]);

@ViewChild('matrixPaginator') matrixPaginator!: MatPaginator;
@ViewChild('matrixSort') matrixSort!: MatSort;
showMatrixGraph = false;
@ViewChild('matrixCanvas') matrixCanvas!: ElementRef<HTMLCanvasElement>;
matrixChart: Chart | null = null;

// ▼ add near your other chart fields
@ViewChild('monthlyCanvas') monthlyCanvas!: ElementRef<HTMLCanvasElement>;
monthlyChart: Chart | null = null;
showMonthlyGraph = false;
chartHeightMonthly = 600;

// internal arrays for the plugin
monthLabels: string[] = [];
monthValidCounts: number[] = [];
monthInvalidCounts: number[] = [];
monthTotals: number[] = [];   

procedureNameOptions: string[] = [];
yearOptions: number[] = [];
monthOptions: number[] = [];  // 1..12 that actually appear in the data
monthPercents: number[] = [];   // 0..100 for the Y axis

  timeGroupCounts: Array<{ group: string; count: number }> = [];
  maxTimeGroupCount = 0;
  chart: Chart | null = null;
  chartType: any = 'bar';
  chartData: any = { labels: [], datasets: [{ label: 'כמות', data: [] }] };
  filterForm: FormGroup;
  graphData: any[] = [];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
// --- sizes (px) you like
chartHeightMain  =820;   // main TimeGroup chart (tab 1)
chartHeightMatrix = 820;  // matrix Valid% chart (tab 3)
  noDrugsDataSource: any[] = [];
  filteredNoDrugsData: any[] = [];
  noDrugsMatTableDataSource = new MatTableDataSource<any>([]);

  
  // 🔹 Main table columns — added `topProcedure`
  columns: string[] = [
    'admissionNo',
    'drug',
    'basicName',
    'drugGiveTime',
    'operationStartTime',
    'operationEndTime',
    'minutesDiff',
    'giveOrderName',
    'mainDoctor',
    'anesthetic',
    'procedureICD9',
    'procedureName',
    'topProcedure',            // 🔹 NEW COLUMN
    'surgeryDepartment',
    'operationDurationHHMM',
    'drugGivenAfterOperationEnd',
    'execution_UnitNameAfterOrderStop',
    'hoursFromOperationEndToOrderStop',
  ];

  // "No drugs" table
  noDrugsColumns: string[] = [
    'admissionNo',
    'operationStartTime',
    'operationEndTime',
    'operationDurationHHMM',
    'giveOrderName',
    'mainDoctor',
    'anesthetic',
    'procedureICD9',
    'procedureName',
    'surgeryDepartment'
  ];

  // 🔹 Filter options (auto-populated)
  topProcedureOptions: number[] = [];
  surgeryDepartmentOptions: string[] = [];
  giveOrderNameOptions: string[] = [];
  timeGroupOptions: string[] = [];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.autoLogin();

    this.http.get<any[]>(environment.apiUrl + 'DrugSurgeryReport').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource.data = this.filteredData;
      this.buildGiveOrderMatrix();   // ← add this

      this.calculateSummary(data);
      this.updateGauge();
      this.refreshMonthlyChart();


      // 🔹 Build dropdown options
      this.buildFilterOptions(this.dataSource);
    });

    this.http.get<any[]>(environment.apiUrl + 'DrugSurgeryReport/NoDrugs').subscribe(data => {
      this.noDrugsDataSource = data;
      this.filteredNoDrugsData = [...data];
      this.noDrugsMatTableDataSource.data = this.filteredNoDrugsData;
      this.updateGauge();
    });
  }

  ngAfterViewInit() {
    this.noDrugsMatTableDataSource.filterPredicate = (data: any, filter: string) => {
      const fields = [
        'admissionNo',
        'operationStartTime',
        'operationEndTime',
        'operationDurationHHMM',
        'giveOrderName',
        'mainDoctor',
        'anesthetic',
        'procedureICD9',
        'procedureName',
        'surgeryDepartment'
      ];
    
      const haystack = fields
        .map(f => (data?.[f] ?? data?.[f[0].toUpperCase() + f.slice(1)] ?? '')) // also tolerate GiveOrderName/SurgeryDepartment
        .join(' | ')
        .toString()
        .toLowerCase();
    
      return haystack.includes(filter);
    };
    
    this.matTableDataSource.paginator = this.mainPaginator;
    this.matTableDataSource.sort = this.sort;
    this.noDrugsMatTableDataSource.paginator = this.noDrugsPaginator;
    this.noDrugsMatTableDataSource.sort = this.noDrugsSort;
    this.giveOrderMatrixData.paginator = this.matrixPaginator;
this.giveOrderMatrixData.sort      = this.matrixSort;
  }

  // 🔹 Build distinct/sorted options for dropdowns
  private buildFilterOptions(data: any[]) {
    this.topProcedureOptions = Array.from(
      new Set((data || []).map(r => this.parseTopProcedure(r?.topProcedure))
        .filter((n): n is number => typeof n === 'number' && !isNaN(n)))
    ).sort((a, b) => a - b);
  
    this.surgeryDepartmentOptions = this.distinctSorted(data.map(r => r?.surgeryDepartment));
    this.giveOrderNameOptions     = this.distinctSorted(data.map(r => r?.giveOrderName));
    this.timeGroupOptions         = this.distinctSorted(data.map(r => r?.timeGroup));


    // 1) ProcedureName
this.procedureNameOptions = this.distinctSorted((data || []).map(r => r?.procedureName));

// 2) Year (numeric ascending, unique)
this.yearOptions = Array.from(
  new Set(
    (data || [])
      .map(r => this.getRowYear(r))
      .filter((y): y is number => typeof y === 'number')
  )
).sort((a, b) => a - b);

// 3) Month (only months that appear, numeric ascending 1..12)
this.monthOptions = Array.from(
  new Set(
    (data || [])
      .map(r => this.getRowMonthNumber(r))
      .filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 12)
  )
).sort((a, b) => a - b);

  }
  
  
  private distinctSorted(arr: any[]): string[] {
    return Array.from(
      new Set(
        (arr || [])
          .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
          .map(v => String(v))
      )
    ).sort((a, b) => a.localeCompare(b, 'he'));
  }

  updateGauge() {
    const mainCount = this.matTableDataSource?.data?.length || 0;
    const noDrugsCount = this.noDrugsMatTableDataSource?.data?.length || 0;
    this.totalRows = mainCount + noDrugsCount;
    this.noDrugsPercentage = this.totalRows > 0 ? +(noDrugsCount / this.totalRows * 100).toFixed(1) : 0;
  }

  getUserDetailsFromDBByUserName(username: string): void {
    this.http.get<any>(`${environment.apiUrl}ServiceCRM/GetEmployeeInfo?username=${username}`)
      .subscribe((data) => {
        this.DisplayUserName = data.UserName;
        this.profilePictureUrl = `${data.ProfilePicture}`;
        this.cdr.detectChanges();
      });
  }

  autoLogin() {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const url = environment.apiUrl + 'User/current';
    this.http.get(url, { headers, withCredentials: true }).subscribe(
      (response: any) => console.log(response),
      (error) => console.error('Error:', error)
    );
  }

  // 🔹 Added 4 controls for new filters
  private createFilterForm() {
    const formControls: any = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['pageSize'] = new FormControl(10);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');
    formControls['procedureNameFilter'] = new FormControl<string[] | null>(null); // multi
    formControls['yearFilter']         = new FormControl<number[] | null>(null);  // multi
    formControls['monthFilter']        = new FormControl<number[] | null>(null);  // multi
    
    // NEW filter controls:
    formControls['topProcedure'] = new FormControl(null);         // number, threshold filter (<=)
    formControls['surgeryDepartmentFilter'] = new FormControl(''); // text equality
    formControls['giveOrderNameFilter'] = new FormControl('');     // text equality
    formControls['timeGroup'] = new FormControl('');      
    formControls['topProcedureFilter'] = new FormControl<number | null>(null);

    return this.fb.group(formControls);
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }

  // 🔹 Add label for the new column
  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      admissionNo: 'מספר מקרה',
      orderID: 'מזהה הזמנה',
      drug: 'קוד אנטיביוטיקה',
      basicName: 'אנטיביוטיקה ',
      drugGiveTime: 'זמן מתן תרופה',
      operationStartTime: 'זמן תחילת ניתוח',
      operationEndTime: 'זמן סיום ניתוח',
      minutesDiff: 'זמן ממתן תרופה עד חתך (בדקות)',
      entryUser: 'מקודד',
      giveOrderName: 'נותן התרופה',
      mainDoctor: 'רופא מנתח',
      anesthetic: 'מרדים',
      execStatusName: 'סטטוס מתן',
      procedureICD9: 'קוד פרוצדורה',
      procedureName: 'שם פרוצדורה',
      topProcedure: 'TopProcedure', // 🔹 label for the new column
      surgeryDepartment: 'מחלקת ניתוח',
      operationDurationHHMM: 'משך ניתוח',
      drugGivenAfterOperationEnd: 'נרשמה תרופה לאחר סיום ניתוח',
      execution_UnitNameAfterOrderStop: 'שם מחלקה נותנת תרופה',
      hoursFromOperationEndToOrderStop: 'המשך מתן תרופה לאחר סיום ניתוח (שעות)',
    };
    return columnLabels[column] || column;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.patchValue({
      globalFilter: '',
      topProcedure: null,
      surgeryDepartmentFilter: '',
      giveOrderNameFilter: '',
      timeGroup: ''
    }, { emitEvent: false });

    this.applyFilters();
    this.filteredData = [...this.dataSource];
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  // 🔹 Apply the 4 new filters in addition to your existing logic
  applyFilters() {
    // keep graph counts fresh if graph view is on
    if (this.showGraph) this.buildTimeGroupCounts();
  
    const f = this.filterForm.value;
    const globalFilter = (f['globalFilter'] || '').toLowerCase();
  
    // ── existing selects ──────────────────────────────────────────────
    const selDept  = (f['surgeryDepartmentFilter'] || '').trim();
    const selGive  = (f['giveOrderNameFilter'] || '').trim();
    const selGroup = (f['timeGroup'] || '').trim();
  
    // TopProcedure threshold logic (10..selected)
    const selTopRaw = this.filterForm.get('topProcedureFilter')?.value;
    const selTop: number | null =
      selTopRaw === null || selTopRaw === undefined || selTopRaw === '' ? null : Number(selTopRaw);
    const allowedSteps = selTop === null ? null : this.topProcedureOptions.filter(n => n <= selTop);
  
    // ── NEW multi-selects ─────────────────────────────────────────────
    const selProcedures: string[] = (f['procedureNameFilter'] || []) as string[];
    const selYears: number[]      = (f['yearFilter'] || []) as number[];
    const selMonths: number[]     = (f['monthFilter'] || []) as number[];
  
    const wantProc  = selProcedures?.length > 0;
    const wantYear  = selYears?.length > 0;
    const wantMonth = selMonths?.length > 0;
  
    // ── MAIN TABLE FILTER ─────────────────────────────────────────────
    this.filteredData = (this.dataSource || []).filter(item => {
      // topProcedure step (choose 20 -> allow 10 & 20)
      const itemTop = this.parseTopProcedure(item?.topProcedure);
      const topOk   = allowedSteps === null ? true : (itemTop !== null && allowedSteps.includes(itemTop));
  
      // single-selects
      const deptOk  = !selDept  || String(item?.surgeryDepartment || '') === selDept;
      const giveOk  = !selGive  || String(item?.giveOrderName     || '') === selGive;
      const groupOk = !selGroup || String(item?.timeGroup         || '') === selGroup;
  
      // multi-selects
      const itemProc = String(item?.procedureName ?? '');
      const itemYear = this.getRowYear(item);
      const itemMon  = this.getRowMonthNumber(item);
  
      const procOk  = !wantProc  || (itemProc && selProcedures.includes(itemProc));
      const yearOk  = !wantYear  || (itemYear !== null && selYears.includes(itemYear));
      const monthOk = !wantMonth || (itemMon  !== null && selMonths.includes(itemMon));
  
      // generic per-column text filters, but skip 'topProcedure' so it doesn't override step logic
      const perColumnOk = this.columns.every(column => {
        if (column === 'topProcedure') return true;
        const ctlVal = f[column];
        if (!ctlVal) return true;
        const value = String(item[column] ?? '').toLowerCase();
        return value.includes(String(ctlVal).toLowerCase());
      });
  
      const globalOk = !globalFilter ||
        this.columns.some(column => String(item[column] || '').toLowerCase().includes(globalFilter));
  
      return perColumnOk && globalOk && topOk && deptOk && giveOk && groupOk && procOk && yearOk && monthOk;
    });
  
    // bind main table + count
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.filter = ''; // prevent MatTable built-in filter interference
    this.matTableDataSource.paginator = this.mainPaginator;
  
    // ── NO-DRUGS TABLE FILTER ─────────────────────────────────────────
    this.filteredNoDrugsData = (this.noDrugsDataSource || []).filter(item => {
      // single-selects
      const deptOk  = !selDept  || String(item?.surgeryDepartment ?? item?.SurgeryDepartment ?? '') === selDept;
      const giveOk  = !selGive  || String(item?.giveOrderName     ?? item?.GiveOrderName     ?? '') === selGive;
      const groupOk = !selGroup || String(item?.timeGroup         ?? item?.TimeGroup         ?? '') === selGroup;
  
      // multi-selects
      const itemProc = String(item?.procedureName ?? item?.ProcedureName ?? '');
      const itemYear = this.getRowYear(item);
      const itemMon  = this.getRowMonthNumber(item);
  
      const procOk  = !wantProc  || (itemProc && selProcedures.includes(itemProc));
      const yearOk  = !wantYear  || (itemYear !== null && selYears.includes(itemYear));
      const monthOk = !wantMonth || (itemMon  !== null && selMonths.includes(itemMon));
  
      // global text filter over the displayed columns in this table
      const globalOk = !globalFilter || this.noDrugsColumns.some(c =>
        String(item?.[c] ?? item?.[c[0].toUpperCase() + c.slice(1)] ?? '').toLowerCase().includes(globalFilter)
      );
  
      return deptOk && giveOk && groupOk && procOk && yearOk && monthOk && globalOk;
    });
  
    // bind no-drugs table
    this.noDrugsMatTableDataSource.data = this.filteredNoDrugsData;
    if (this.noDrugsMatTableDataSource.paginator) this.noDrugsMatTableDataSource.paginator.firstPage();
  
    // ── PIVOT + CHARTS + GAUGE ────────────────────────────────────────
    this.buildGiveOrderMatrix();   // pivot table + (if on) matrix chart refresh inside
    if (this.showGraph) this.refreshChart();          // TimeGroup chart
    if (this.showMatrixGraph) this.refreshMatrixChart();
    this.refreshMonthlyChart();    // monthly stacked Valid vs Total
    this.graphData = this.filteredData;
    this.updateGauge();
  }
  
  
  

  exportToExcel() {
    const dataToExport = this.filteredData.map(item => ({
      ...item,
      operationStartTime: item.operationStartTime ? new Date(item.operationStartTime) : null,
      operationEndTime: item.operationEndTime ? new Date(item.operationEndTime) : null,
      drugGiveTime: item.drugGiveTime ? new Date(item.drugGiveTime) : null
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

    const dateCols = ['OperationStartTime', 'OperationEndTime', 'DrugGiveTime'];
    dateCols.forEach((_, i) => {
      const colRef = XLSX.utils.encode_col(i);
      if (worksheet[`${colRef}1`]) worksheet[`${colRef}1`].z = 'yyyy-mm-dd hh:mm';
      for (let row = 2; row <= dataToExport.length + 1; row++) {
        const cellRef = `${colRef}${row}`;
        if (worksheet[cellRef]) worksheet[cellRef].z = 'yyyy-mm-dd hh:mm';
      }
    });

    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, 'drug_surgery_report.xlsx');
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  getCellClass(column: string, value: any): string {
    if (column === 'minutesDiff') {
      if (value >= 60) return 'cell-red';
      else if (value >= 30) return 'cell-green';
      else if (value >= 0) return 'cell-orange';
    }
    return '';
  }

  calculateSummary(data: any[]): void {
    this.summary = { green: 0, orange: 0, red: 0, negativeOrEmpty: 0, total: data.length };
    this.originalData = data;

    data.forEach(row => {
      const minutes = Number(row.minutesDiff);
      if (minutes == null || isNaN(minutes) || minutes < 0) this.summary.negativeOrEmpty++;
      else if (minutes > 60) this.summary.red++;
      else if (minutes >= 30) this.summary.green++;
      else if (minutes >= 0) this.summary.orange++;
    });
  }

  summary = { green: 0, orange: 0, red: 0, negativeOrEmpty: 0, total: 0 };
  selectedColor: string | null = null;
  originalData: any[] = [];

  applyColorFilter(color: string): void {
    this.selectedColor = color;
    const filtered = this.originalData.filter(row => {
      const minutes = Number(row.minutesDiff);
      if (color === 'green')  return minutes >= 30 && minutes <= 60;
      if (color === 'orange') return minutes >= 0  && minutes < 30;
      if (color === 'red')    return minutes > 60;
      return true;
    });
    this.matTableDataSource.data = filtered;
  }

  clearColorFilter(): void {
    this.selectedColor = null;
    this.matTableDataSource.data = this.originalData;
  }

  openProcedureDialog(): void {
    this.dialog.open(ProcedureICD9ManagerDialogComponent, { width: '1200px', height: '1000px' });
  }

  canManageICD9(): boolean {
    const u = (this.LoginUserName || '').trim().toLowerCase();
    return ['mmaman', 'habuzayyad', 'rkoury', 'owertheim'].includes(u);
  }

  applyNegativeOrEmptyFilter(): void {
    this.selectedColor = 'negativeOrEmpty';
    const filtered = this.originalData.filter(row => {
      const minutes = Number(row.minutesDiff);
      return minutes == null || isNaN(minutes) || minutes < 0;
    });
    this.matTableDataSource.data = filtered;
  }

  // Existing exports...
  exportToExcelMain() {
    const dataToExport = this.matTableDataSource.data;
    if (dataToExport.length === 0) { alert('אין נתונים להורדה'); return; }

    const exportData = dataToExport.map(row => {
      const newRow: any = {};
      this.columns.forEach(col => {
        const label = this.getColumnLabel(col);
        newRow[label] = row[col];
      });
      return newRow;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'דו״ח תרופות וניתוחים': worksheet }, SheetNames: ['דו״ח תרופות וניתוחים'] };
    XLSX.writeFile(workbook, 'drug_surgery_report.xlsx');
  }

  exportToExcelNoDrugs() {
    const dataToExport = this.noDrugsMatTableDataSource.data;
    if (dataToExport.length === 0) { alert('אין נתונים להורדה'); return; }

    const exportData = dataToExport.map(row => {
      const newRow: any = {};
      this.noDrugsColumns.forEach(col => {
        const label = this.getColumnLabel(col);
        newRow[label] = row[col];
      });
      return newRow;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'ללא תרופות ברשימה': worksheet }, SheetNames: ['ללא תרופות ברשימה'] };
    XLSX.writeFile(workbook, 'no_drugs_report.xlsx');
  }

  applyMainFilter(event: any) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.matTableDataSource.filter = filterValue;
  }

  applyNoDrugsFilter(event: any) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.noDrugsMatTableDataSource.filter = filterValue;
  }

  private parseTopProcedure(v: any): number | null {
    if (v === null || v === undefined) return null;
    const m = String(v).match(/\d+/);
    return m ? Number(m[0]) : null;
  }
  private buildTimeGroupCounts(): void {
    const rows = this.matTableDataSource?.data ?? [];
    const raw = new Map<string, number>();
  
    for (const r of rows) {
      const label = this.normalizeTimeGroupLabel(this.getRowTimeGroup(r));
      raw.set(label, (raw.get(label) ?? 0) + 1);
    }
  
    // 1) exact order for the five wanted buckets (include zeroes)
    const preferred = this.TIMEGROUP_ORDER.map(l => ({
      group: l,
      count: raw.get(l) ?? 0
    }));
  
    // 2) any extras after the five (by count desc)
    const extras = Array.from(raw.entries())
      .filter(([l]) => !this.TIMEGROUP_ORDER.includes(l))
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count);
  
    this.timeGroupCounts = [...preferred, ...extras];
  
    this.maxTimeGroupCount = this.timeGroupCounts.length
      ? Math.max(...this.timeGroupCounts.map(x => x.count))
      : 0;
  }
  
  
  
  private setChartDataFromCounts(): void {
    const labels  = this.timeGroupCounts.map(x => x.group);
    const counts  = this.timeGroupCounts.map(x => x.count);
    const total   = counts.reduce((a, b) => a + b, 0);
    const percents = counts.map(c => total ? +((c / total) * 100).toFixed(1) : 0);
  
    this.lastCounts   = counts;
    this.lastPercents = percents;
  
    const backgroundColor = labels.map(g =>
      this.isGreenGroup(g) ? 'rgba(165, 214, 167, 0.85)' : 'rgba(255, 205, 210, 0.85)'
    );
    const borderColor = labels.map(g =>
      this.isGreenGroup(g) ? 'rgba(76, 175, 80, 1)' : 'rgba(239, 83, 80, 1)'
    );
  
    // Pie → use percents; Bar → use counts
    const datasetData = this.chartType === 'pie' ? percents : counts;
  
    this.chartData = {
      labels,
      datasets: [{
        label: this.chartType === 'pie' ? 'אחוזים' : 'כמות',
        data: datasetData,
        backgroundColor,
        borderColor,
        borderWidth: 1
      }]
    };
  }
  
  
  
  
  // ← your example, adapted to COUNTS (no %)
  initializeChart(canvas: HTMLCanvasElement): void {
    if (this.chart) this.chart.destroy();
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const isPie = this.chartType === 'pie';
  
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 24 } }, // room for top labels
      plugins: {
        legend: { display: true, position: isPie ? 'right' : 'top' },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const idx   = context.dataIndex;
              const label = context.label || '';
              if (isPie) {
                const count = this.lastCounts[idx] ?? 0;
                const pct   = this.lastPercents[idx] ?? context.raw;
                return `${label}: ${count} (${pct}%)`;
              } else {
                const count = this.lastCounts[idx] ?? context.raw;
                const pct   = this.lastPercents[idx] ?? 0;
                return `${label}: ${count} (${pct}%)`;
              }
            }
          }
        },
        datalabels: {
          // ✅ show labels on BOTH pie and bar
          display: true,
          formatter: (value: number, ctx: any) => {
            const i = ctx.dataIndex;
            if (isPie) {
              // value already percent for pie
              return `${Number(value).toFixed(1)}%`;
            } else {
              const count = this.lastCounts[i] ?? value;
              const pct   = this.lastPercents[i] ?? 0;
              // Hide tiny bars if you want:
              // if (count < 1) return '';
              return `${count} (${pct}%)`;
            }
          },
          color: '#111',
          font: { weight: '600' },
          // 🔼 put label above the bar
          anchor: isPie ? 'center' : 'end',
          align:  isPie ? 'center' : 'end',
          offset: isPie ? 0 : 6,
          clip: false
        }
      }
    };
  
    if (!isPie) {
      options.scales = {
        y: {
          beginAtZero: true,
          ticks: { callback: (v: any) => `${v}` }
        }
      };
    }
  
    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options
    });
  }
  
  
  
  private refreshChart(): void {
    this.buildTimeGroupCounts();
    this.setChartDataFromCounts();
  
    // 🔒 ensure category order is applied
    if (this.chart) {
      const oldLabels = (this.chart.data?.labels as string[]) ?? [];
      const newLabels = (this.chartData.labels as string[]) ?? [];
      const sameOrder =
        oldLabels.length === newLabels.length &&
        oldLabels.every((v, i) => v === newLabels[i]);
  
      if (!sameOrder) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  
    if (this.chart) {
      this.chart.data.labels = this.chartData.labels;
      this.chart.data.datasets = this.chartData.datasets;
      this.chart.update();
    } else if (this.timeGroupCanvas?.nativeElement) {
      setTimeout(() => this.initializeChart(this.timeGroupCanvas.nativeElement));
    }
  }
  
  toggleGraph(): void {
    this.showGraph = !this.showGraph;
  
    if (this.showGraph) {
      // show graph
      setTimeout(() => this.refreshChart(), 0);
    } else {
      // show table → rebind sort/paginator after *ngIf renders
      setTimeout(() => {
        this.matTableDataSource.paginator = this.mainPaginator;
        this.matTableDataSource.sort = this.sort;
        this.cdr.detectChanges();
      }, 0);
    }
  }
  
  
 // Replace the current isGreenGroup with this:
 private isGreenGroup(group: string): boolean {
  if (!group) return false;
  const g = group.toString().normalize('NFKC').toLowerCase().replace(/\s+/g,'').replace(/[‐–—−-]/g,'-');

  // canonical
  if (g === 'in60min') return true;

  // old & friendly aliases -> still treat as green
  if (g === 'in30min' || g === '2-between30and60' || /30\D*60/.test(g) || /0\D*60/.test(g) || /(<=|upto|under)\s*60/.test(g) || g.includes('עד60'))
    return true;

  return false;
}


  
  trackByGroup = (_: number, item: { group: string }) => item.group;

  setChartType(type: 'bar' | 'pie'): void {
    if (this.chartType === type) return;
    this.chartType = type;
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    setTimeout(() => this.refreshChart(), 0);
  }
  
  private getRowTimeGroup(row: any): string {
    return String((row?.timeGroup ?? row?.TimeGroup ?? '')).trim() || 'ללא';
  }
  private getRowGiveOrderName(row: any): string {
    return String((row?.giveOrderName ?? row?.GiveOrderName ?? '')).trim() || 'ללא';
  }

  private buildGiveOrderMatrix(): void {
    const rows = this.matTableDataSource?.data ?? [];
  
    const tgSet = new Set<string>();
    const map = new Map<string, Map<string, number>>(); // GiveOrderName -> (TimeGroup -> count)
  
    for (const r of rows) {
      const name = this.getRowGiveOrderName(r);
      const tgRaw = this.getRowTimeGroup(r);
      const tg    = this.normalizeTimeGroupLabel(tgRaw);   // ✅ normalize here
      tgSet.add(tg);
  
      if (!map.has(name)) map.set(name, new Map<string, number>());
      const inner = map.get(name)!;
      inner.set(tg, (inner.get(tg) ?? 0) + 1);
    }
  
    const timeGroups = Array.from(tgSet.values())
      .sort((a, b) => a.localeCompare(b, 'he'));
  
    this.giveOrderMatrixColumns = ['giveOrderName', ...timeGroups, 'total', 'validPercent'];
  
    const tableRows = Array.from(map.entries()).map(([name, inner]) => {
      const row: any = { giveOrderName: name };
      let sum = 0, validCount = 0;
  
      for (const tg of timeGroups) {
        const c = inner.get(tg) ?? 0;
        row[tg] = c;
        sum += c;
        if (this.isGreenGroup(tg)) validCount += c;   // ✅ green = In60Min
      }
  
      row.total = sum;
      row.validPercent = sum ? Number(((validCount / sum) * 100).toFixed(1)) : 0;
      return row;
    });
  
    this.giveOrderMatrixData.data = tableRows;
  
    Promise.resolve().then(() => {
      if (this.matrixPaginator) this.giveOrderMatrixData.paginator = this.matrixPaginator;
      if (this.matrixSort)      this.giveOrderMatrixData.sort      = this.matrixSort;
    });
  
    if (this.showMatrixGraph) setTimeout(() => this.refreshMatrixChart(), 0);
  }
  
  
  
  applyGiveOrderMatrixFilter(ev: Event): void {
    const value = (ev.target as HTMLInputElement)?.value ?? '';
    this.giveOrderMatrixData.filter = value.trim().toLowerCase();
  }
  
  // If you used the earlier arrow-function version, keep it or use this method form:
  exportGiveOrderMatrix(): void {
    const rows = this.giveOrderMatrixData.data;
    if (!rows?.length) { alert('אין נתונים להורדה'); return; }
  
    const dynamicCols = this.giveOrderMatrixColumns
      .filter(c => c !== 'giveOrderName' && c !== 'total' && c !== 'validPercent');
  
    const translated = rows.map((r: any) => {
      const out: any = { 'נותן התרופה': r.giveOrderName };
      for (const col of dynamicCols) out[col] = r[col];   // each TimeGroup column
      out['סה״כ']  = r.total;
      out['Valid%'] = r.validPercent;                     // numeric percent
      return out;
    });
  
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(translated);
    const wb: XLSX.WorkBook = {
      Sheets: { 'ספירה לפי נותן התרופה' : ws },
      SheetNames: ['ספירה לפי נותן התרופה']
    };
    XLSX.writeFile(wb, 'giveordername_timegroup_counts.xlsx');
  }
  
 // Sum the "valid" (green) bucket(s) for a pivot row
private computeValidCountForRow(row: any): number {
  let valid = 0;
  for (const col of this.giveOrderMatrixColumns) {
    if (col === 'giveOrderName' || col === 'total' || col === 'validPercent') continue;
    if (this.isGreenGroup(col)) {
      valid += Number(row[col] ?? 0);
    }
  }
  return valid;
}

// Build + render (or update) the matrix chart
private refreshMatrixChart(): void {
  const rows = this.giveOrderMatrixData?.data ?? [];

  // Sort by Valid% desc
  const sorted = [...rows].sort(
    (a, b) => Number(b.validPercent ?? 0) - Number(a.validPercent ?? 0)
  );

  const labels: string[] = [];
  const validPercents: number[] = [];
  const invalidPercents: number[] = [];
  const validCounts: number[] = [];
  const invalidCounts: number[] = [];

  for (const r of sorted) {
    const total = Number(r.total ?? 0);
    const vCount = this.computeValidCountForRow(r);
    const iCount = Math.max(0, total - vCount);

    const vPct = total ? +(vCount / total * 100).toFixed(1) : 0;
    const iPct = +(100 - vPct).toFixed(1);

    labels.push(r.giveOrderName);
    validPercents.push(vPct);
    invalidPercents.push(iPct);
    validCounts.push(vCount);
    invalidCounts.push(iCount);
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Valid%',
        data: validPercents,
        backgroundColor: 'rgba(165, 214, 167, 0.85)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
        stack: 'percent'
      },
      {
        label: 'Not valid%',
        data: invalidPercents,
        backgroundColor: 'rgba(255, 205, 210, 0.85)',
        borderColor: 'rgba(239, 83, 80, 1)',
        borderWidth: 1,
        stack: 'percent'
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // horizontal bars
    scales: {
      x: {
        min: 0,
        max: 100,
        stacked: true,                 // ← stack along X
        ticks: { callback: (v: any) => `${v}%` }
      },
      y: { stacked: true }             // ← and stack categories
    },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        callbacks: {
          // Show counts + percents in tooltip
          label: (ctx: any) => {
            const i = ctx.dataIndex;
            if (ctx.datasetIndex === 0) {
              return `Valid: ${validCounts[i]} (${validPercents[i]}%)`;
            } else {
              return `Not valid: ${invalidCounts[i]} (${invalidPercents[i]}%)`;
            }
          }
        }
      },
      datalabels: {
        display: true,
        formatter: (value: number, ctx: any) => {
          // Hide tiny slivers to reduce clutter
          if (value < 5) return '';
          return `${Number(value).toFixed(1)}%`;
        },
        color: '#111',
        font: { weight: 600 },
        anchor: 'center',
        align: 'center',
        clip: false
      }
    }
  };

  if (this.matrixChart) {
    this.matrixChart.data = chartData as any;
    this.matrixChart.options = options;
    this.matrixChart.update();
    return;
  }

  const canvas = this.matrixCanvas?.nativeElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  this.matrixChart = new Chart(ctx, { type: 'bar', data: chartData as any, options });
}

// Toggle table/graph in the 3rd tab
toggleMatrixGraph(): void {
  this.showMatrixGraph = !this.showMatrixGraph;
  if (this.showMatrixGraph) {
    setTimeout(() => this.refreshMatrixChart(), 0);
  } else {
    // table is shown now
    setTimeout(() => this.attachMatrixTableAdapters(), 0);
    if (this.matrixChart) { this.matrixChart.destroy(); this.matrixChart = null; }
  }
}

onTabChange(ev: any): void {
  if (ev?.index === 2) {
    setTimeout(() => {
      this.attachMatrixTableAdapters();
      if (this.showMatrixGraph) this.refreshMatrixChart();
    }, 0);
  }
}

setMainChartHeight(h: number) {
  this.chartHeightMain = h;
  // let Angular paint then tell Chart.js to recompute layout
  setTimeout(() => this.chart?.resize(), 0);
}

setMatrixChartHeight(h: number) {
  this.chartHeightMatrix = h;
  setTimeout(() => this.matrixChart?.resize(), 0);
}
 

private attachMatrixTableAdapters(): void {
  if (!this.giveOrderMatrixData) return;

  // IMPORTANT: define the accessor BEFORE assigning .sort
  this.giveOrderMatrixData.sortingDataAccessor = (item: any, property: string) => {
    // numeric columns
    if (property === 'total' || property === 'validPercent' || this.giveOrderMatrixColumns.includes(property)) {
      const v = item?.[property];
      const n = Number(v);
      return isNaN(n) ? -Infinity : n; // put missing at the bottom
    }
    // default string compare
    const s = (item?.[property] ?? '').toString().toLowerCase();
    return s;
  };

  // Re-attach paginator & sort after DOM exists
  this.giveOrderMatrixData.paginator = this.matrixPaginator;
  this.giveOrderMatrixData.sort = this.matrixSort;

  // Nudge Angular + MatSort
  this.cdr.detectChanges();
  this.matrixSort?.sortChange.emit(this.matrixSort.active ? {active: this.matrixSort.active, direction: this.matrixSort.direction} : {active: 'total', direction: 'desc'});
}
// Desired order for the first-tab graph:
private readonly TIMEGROUP_ORDER = [
  'In60Min','Morethen60','AfterStart','NoTime'
];

// Map any backend label variant → our canonical display label above
private normalizeTimeGroupLabel(raw: string): string {
  const s = (raw || '')
    .toString()
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‐–—−-]/g, '-')   // unify dashes
    .replace(/\s+/g, '');       // remove spaces

  // ✅ everything up to 60 min → one bucket
  if (s === 'in60min' || s === 'in30min' || s === '2-between30and60' ||
      /0\D*60/.test(s) || /30\D*60/.test(s) || /(<=|upto|under)\s*60/.test(s) || s.includes('עד60'))
    return 'In60Min';

  if (/(morethen60|morethan60|over60|>60|60\+)/.test(s) || s === '3-morethen60') return 'Morethen60';
  if (/(afterstart|after-incision|afterincision|<0|minus|negative)/.test(s) || s === '4-afterstart') return 'AfterStart';
  if (/(notime|ללא|איןשעה|missing|null)/.test(s) || s === '5-notime' || s === 'ללא') return 'NoTime';

  const trimmed = (raw || '').toString().trim();
  return trimmed ? trimmed : 'NoTime';
}

private getRowMonthKey(r: any): string {
  // prefer operationStartTime, then drugGiveTime
  const d = r?.operationStartTime || r?.drugGiveTime || r?.OperationStartTime || r?.DrugGiveTime;
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; // YYYY-MM
}
private buildMonthlyValidSeries(): void {
  const rows = this.matTableDataSource?.data ?? [];
  const byMonth = new Map<string, {valid: number; invalid: number; total: number}>();

  for (const r of rows) {
    const month = this.getRowMonthKey(r);
    const tg    = this.normalizeTimeGroupLabel(this.getRowTimeGroup(r));
    const rec   = byMonth.get(month) || {valid: 0, invalid: 0, total: 0};

    if (this.isGreenGroup(tg)) rec.valid += 1; else rec.invalid += 1;
    rec.total += 1;
    byMonth.set(month, rec);
  }

  const entries = Array.from(byMonth.entries()).sort(([a],[b]) => a.localeCompare(b));

  this.monthLabels        = entries.map(([m])  => m);
  this.monthValidCounts   = entries.map(([,v]) => v.valid);
  this.monthInvalidCounts = entries.map(([,v]) => v.invalid);
  this.monthTotals        = entries.map(([,v]) => v.total);
  this.monthPercents      = entries.map(([,v]) => v.total ? +(v.valid / v.total * 100).toFixed(1) : 0);
}

private insideCountPlugin = {
  id: 'insideCount',
  afterDatasetsDraw: (chart: any) => {
    const meta = chart.getDatasetMeta(0);        // the % dataset
    if (!meta?.data?.length) return;

    const { ctx } = chart;
    const yScale = chart.scales.y;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 12px sans-serif';
    ctx.fillStyle = '#111';

    meta.data.forEach((bar: any, i: number) => {
      // center point inside the bar = halfway between base (0%) and value (%)
      const baseY = bar.base ?? yScale.getPixelForValue(0);
      const valueY = bar.y;
      const cx = bar.x;
      const cy = (baseY + valueY) / 2;

      const valid = this.monthValidCounts[i] ?? 0;
      const total = this.monthTotals[i] ?? 0;
      if (total > 0) ctx.fillText(`${valid}/${total}`, cx, cy);
    });

    ctx.restore();
  }
};

private topPercentPlugin = {
  id: 'topPercent',
  afterDatasetsDraw: (chart: any) => {
    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    if (!xScale || !yScale) return;

    this.monthPercents.forEach((pct, i) => {
      const x = xScale.getPixelForValue(i);
      const y = yScale.getPixelForValue(pct) - 6; // a bit above the bar top

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = '#111';
      ctx.fillText(`${pct}%`, x, y);
      ctx.restore();
    });
  }
};

private refreshMonthlyChart(): void {
  // build counts per month first
  this.buildMonthlyValidSeries();

  const labels = this.monthLabels;

  // % Valid per month (0..100)
  const percents: number[] = labels.map((_, i) => {
    const t = this.monthTotals[i] ?? 0;
    const v = this.monthValidCounts[i] ?? 0;
    return t ? +(v / t * 100).toFixed(1) : 0;
  });

  // colors: green if ≥ 90%, else red
  const barColors: string[]   = percents.map(p => p >= 90 ? 'rgba(165, 214, 167, 0.85)' : 'rgba(255, 205, 210, 0.85)');
  const borderColors: string[]= percents.map(p => p >= 90 ? 'rgba(76, 175, 80, 1)'      : 'rgba(239, 83, 80, 1)');

  const data: ChartData<'bar', number[], string> = {
    labels,
    datasets: [{
      type: 'bar',
      label: '% Valid',
      data: percents,
      backgroundColor: barColors,
      borderColor: borderColors,
      borderWidth: 1,
      datalabels: { display: false }   // we draw our own labels inside the bar
    } as any]
  };

  const chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: false,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: false },
      y: {
        beginAtZero: true,
        min: 0, max: 100,
        ticks: { stepSize: 10, callback: (v) => `${v}%` }
      }
    },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        callbacks: {
          title: (items: any[]) => labels[items[0].dataIndex] || '',
          label: (item: any) => {
            const i = item.dataIndex;
            const t = this.monthTotals[i] ?? 0;
            const v = this.monthValidCounts[i] ?? 0;
            const p = percents[i] ?? 0;
            return `Valid: ${v}/${t} (${p}%)`;
          }
        }
      }
    }
  };

  // (re)create chart
  if (this.monthlyChart) { this.monthlyChart.destroy(); this.monthlyChart = null; }
  const canvas = this.monthlyCanvas?.nativeElement;
  if (!canvas) return;
  const ctx2 = canvas.getContext('2d');
  if (!ctx2) return;

  this.monthlyChart = new Chart(ctx2, {
    type: 'bar',
    data,
    options: chartOptions,
    // draw % above bar + valid/total *inside* the bar
    plugins: [this.topPercentPlugin, this.insideCountPlugin]
  });
}


setMonthlyChartHeight(h: number) {
  this.chartHeightMonthly = h;
  setTimeout(() => this.monthlyChart?.resize(), 0);
}
private getRowPrimaryDate(r: any): Date | null {
  // same priority you used for monthly chart
  const tryFields = [
    r?.operationStartTime, r?.OperationStartTime,
    r?.drugGiveTime,       r?.DrugGiveTime,
    r?.operationEndTime,   r?.OperationEndTime
  ];
  for (const f of tryFields) {
    const d = this.parseDateLike(f);
    if (d) return d;
  }
  return null;
}

private getRowYear(r: any): number | null {
  const d = this.getRowPrimaryDate(r);
  return d ? d.getFullYear() : null;
}

private getRowMonthNumber(r: any): number | null {
  const d = this.getRowPrimaryDate(r);
  return d ? (d.getMonth() + 1) : null; // 1..12
}
private parseDateLike(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  // Handle strings: ISO, 'yyyy-MM-dd HH:mm', '/Date(...)' ticks, etc.
  if (typeof v === 'string') {
    // /Date(1699488000000)/
    const m = v.match(/\/Date\((\d+)\)\//);
    if (m) {
      const d = new Date(Number(m[1]));
      return isNaN(d.getTime()) ? null : d;
    }
    // Try replace space with 'T' for non-ISO SQL strings
    const isoish = v.includes(' ') ? v.replace(' ', 'T') : v;
    const d = new Date(isoish);
    return isNaN(d.getTime()) ? null : d;
  }

  // Ticks or millis as number
  if (typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}


}
