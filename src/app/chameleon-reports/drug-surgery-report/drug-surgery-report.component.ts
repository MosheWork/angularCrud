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
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import ChartDataLabels from 'chartjs-plugin-datalabels';


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
    if (this.showGraph) this.buildTimeGroupCounts();

    const f = this.filterForm.value;
    const globalFilter = (f['globalFilter'] || '').toLowerCase();
  
    // read from the separate control
    const selTopRaw = this.filterForm.get('topProcedureFilter')?.value;
    const selTop: number | null =
      selTopRaw === null || selTopRaw === undefined || selTopRaw === '' ? null : Number(selTopRaw);
  
    const selDept  = (f['surgeryDepartmentFilter'] || '').trim();
    const selGive  = (f['giveOrderNameFilter'] || '').trim();
    const selGroup = (f['timeGroup'] || '').trim();
  
    // steps set: if 40 selected, [10,20,30,40] (derived from existing options)
    const allowedSteps = selTop === null ? null : this.topProcedureOptions.filter(n => n <= selTop);
  
    this.filteredData = this.dataSource.filter(item => {
      const itemTop = this.parseTopProcedure(item?.topProcedure);
  
      // step logic (choose 20 -> allow 10 & 20)
      const topOk = allowedSteps === null ? true : (itemTop !== null && allowedSteps.includes(itemTop));
  
      const deptOk  = !selDept  || String(item?.surgeryDepartment || '') === selDept;
      const giveOk  = !selGive  || String(item?.giveOrderName     || '') === selGive;
      const groupOk = !selGroup || String(item?.timeGroup         || '') === selGroup;
      this.filteredNoDrugsData = this.noDrugsDataSource.filter(item => {
        const deptOk  = !selDept  || String(item?.surgeryDepartment ?? item?.SurgeryDepartment ?? '') === selDept;
        const giveOk  = !selGive  || String(item?.giveOrderName     ?? item?.GiveOrderName     ?? '') === selGive;
        const groupOk = !selGroup || String(item?.timeGroup         ?? item?.TimeGroup         ?? '') === selGroup; // harmless if missing
        return deptOk && giveOk && groupOk;
      });
    
      this.noDrugsMatTableDataSource.data = this.filteredNoDrugsData;
      if (this.noDrugsMatTableDataSource.paginator) this.noDrugsMatTableDataSource.paginator.firstPage();
      // generic per-column text filters, but skip 'topProcedure' so it doesn't override step logic
      const perColumnOk = this.columns.every(column => {
        if (column === 'topProcedure') return true; // ⬅️ critical
        const ctlVal = f[column];
        if (!ctlVal) return true;
        const value = String(item[column] ?? '').toLowerCase();
        return value.includes(String(ctlVal).toLowerCase());
      });
  
      const globalOk = !globalFilter ||
        this.columns.some(column => String(item[column] || '').toLowerCase().includes(globalFilter));
  
      return perColumnOk && globalOk && topOk && deptOk && giveOk && groupOk;
    });
  
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.buildGiveOrderMatrix();
    if (this.showGraph) {
      this.refreshChart();
    }
    this.matTableDataSource.filter = ''; // don’t let MatTable’s built-in filter fight ours
    this.matTableDataSource.paginator = this.mainPaginator;
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
    const map = new Map<string, number>();
  
    for (const r of rows) {
      // Support both timeGroup and TimeGroup keys
      const key = String((r?.timeGroup ?? r?.TimeGroup ?? '')).trim() || 'ללא';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  
    this.timeGroupCounts = Array.from(map.entries())
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count);
  
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
  
    const showDatalabels = this.chartType === 'pie';
  
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'right' },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const idx   = context.dataIndex;
              const label = context.label || '';
              if (this.chartType === 'pie') {
                const count = this.lastCounts[idx] ?? 0;
                const pct   = this.lastPercents[idx] ?? context.raw;
                return `${label}: ${count} (${pct}%)`;
              } else {
                const val = context.raw;
                return `${label}: ${val}`;
              }
            }
          }
        },
        datalabels: {
          display: showDatalabels,
          formatter: (value: number, _ctx: any) => `${value}%`,
          color: '#111',            // readable on light colors
          font: { weight: '600' },
          anchor: 'center',
          align: 'center',
          clip: false
        }
      }
    };
  
    if (this.chartType === 'bar') {
      options.scales = {
        y: {
          beginAtZero: true,
          ticks: { callback: (value: any) => `${value}` }
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
    // rebuild counts from current filtered table, update chart
    this.buildTimeGroupCounts();
    this.setChartDataFromCounts();
  
    if (this.chart) {
      this.chart.data.labels = this.chartData.labels;
      this.chart.data.datasets = this.chartData.datasets;
      this.chart.update();
    } else if (this.timeGroupCanvas?.nativeElement) {
      // first render after toggle
      setTimeout(() => this.initializeChart(this.timeGroupCanvas.nativeElement));
    }
  }
  
  toggleGraph(): void {
    this.showGraph = !this.showGraph;
  
    if (this.showGraph) {
      // wait for *ngIf to insert the canvas, then render
      setTimeout(() => this.refreshChart(), 0);
    } else {
      // optional: clean up when hiding
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }
  
  private isGreenGroup(group: string): boolean {
    const g = (group || '').toString().replace(/\s+/g, '').toLowerCase();
    return g === '2-between30and60';
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
      const tg   = this.getRowTimeGroup(r);
      tgSet.add(tg);
  
      if (!map.has(name)) map.set(name, new Map<string, number>());
      const inner = map.get(name)!;
      inner.set(tg, (inner.get(tg) ?? 0) + 1);
    }
  
    const timeGroups = Array.from(tgSet.values()).sort((a, b) => a.localeCompare(b, 'he'));
  
    // Columns: name | …timeGroups… | total | validPercent
    this.giveOrderMatrixColumns = ['giveOrderName', ...timeGroups, 'total', 'validPercent'];
  
    const tableRows = Array.from(map.entries()).map(([name, inner]) => {
      const row: any = { giveOrderName: name };
      let sum = 0;
      let validCount = 0;
  
      for (const tg of timeGroups) {
        const c = inner.get(tg) ?? 0;
        row[tg] = c;
        sum += c;
        if (this.isGreenGroup ? this.isGreenGroup(tg) : (tg || '').replace(/\s+/g,'').toLowerCase() === '2-between30and60') {
          validCount += c;
        }
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

    if (this.showMatrixGraph) {
      // keep chart in sync with current pivot
      setTimeout(() => this.refreshMatrixChart(), 0);
    }
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

  // ✅ sort high → low by Valid%
  const sorted = [...rows].sort(
    (a, b) => Number(b.validPercent ?? 0) - Number(a.validPercent ?? 0)
  );

  const labels = sorted.map(r => r.giveOrderName);
  const data   = sorted.map(r => Number(r.validPercent ?? 0));

  const backgroundColor = 'rgba(165, 214, 167, 0.85)';
  const borderColor     = 'rgba(76, 175, 80, 1)';

  const chartData = {
    labels,
    datasets: [{
      label: 'Valid%',
      data,
      backgroundColor,
      borderColor,
      borderWidth: 1
    }]
  };

  if (this.matrixChart) {
    this.matrixChart.data = chartData as any;
    this.matrixChart.update();
    return;
  }

  const canvas = this.matrixCanvas?.nativeElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  this.matrixChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // horizontal bars, top = highest
      scales: {
        x: { min: 0, max: 100, ticks: { callback: (v:any) => `${v}%` } }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true,
          formatter: (v:number) => `${Number(v).toFixed(1)}%`,
          color: '#111',
          font: { weight: 600 },
          anchor: 'center',
          align: 'center',
          clip: false
        }
      }
    }
  });
}
// Toggle table/graph in the 3rd tab
toggleMatrixGraph(): void {
  this.showMatrixGraph = !this.showMatrixGraph;
  if (this.showMatrixGraph) {
    // ensure canvas exists after *ngIf
    setTimeout(() => this.refreshMatrixChart(), 0);
  } else {
    if (this.matrixChart) {
      this.matrixChart.destroy();
      this.matrixChart = null;
    }
  }
}
onTabChange(ev: any): void {
  // index 2 = third tab
  if (ev?.index === 2) {
    // ensure the table gets its paginator/sort once tab is rendered
    setTimeout(() => {
      if (this.matrixPaginator) this.giveOrderMatrixData.paginator = this.matrixPaginator;
      if (this.matrixSort)      this.giveOrderMatrixData.sort      = this.matrixSort;

      // if graph is toggled on, (re)build it now that canvas exists
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
   
}
