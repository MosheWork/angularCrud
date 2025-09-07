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
    this.matTableDataSource.paginator = this.mainPaginator;
    this.matTableDataSource.sort = this.sort;
    this.noDrugsMatTableDataSource.paginator = this.noDrugsPaginator;
    this.noDrugsMatTableDataSource.sort = this.noDrugsSort;
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
    const labels = this.timeGroupCounts.map(x => x.group);
    const data   = this.timeGroupCounts.map(x => x.count);
  
    // Colors
    const bgColors = labels.map(g =>
      this.isGreenGroup(g) ? 'rgba(165, 214, 167, 0.85)' : 'rgba(255, 205, 210, 0.85)' // light green / light red
    );
    const borderColors = labels.map(g =>
      this.isGreenGroup(g) ? 'rgba(76, 175, 80, 1)' : 'rgba(239, 83, 80, 1)'           // darker borders
    );
  
    this.chartData = {
      labels,
      datasets: [
        {
          label: 'כמות',
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1
        }
      ]
    };
  }
  
  
  // ← your example, adapted to COUNTS (no %)
  initializeChart(canvas: HTMLCanvasElement): void {
    if (this.chart) {
      this.chart.destroy();
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              // show counts, not percentage
              callback: (value: any) => `${value}`
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              // show the raw count in tooltip
              label: (context: any) => ` ${context.dataset.label}: ${context.raw}`
            }
          },
          legend: {
            display: true
          }
        }
      }
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
    // be a bit forgiving with spacing/casing if you want:
    const g = (group || '').toString().replace(/\s+/g, '').toLowerCase();
    return g === '2-between30and60';
  }
  
  trackByGroup = (_: number, item: { group: string }) => item.group;
  
}
