import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
    // TopProcedure numeric options
    const nums = Array.from(
      new Set(
        (data || [])
          .map(r => Number(r?.topProcedure))
          .filter(n => !isNaN(n))
      )
    ).sort((a, b) => a - b);
    this.topProcedureOptions = nums;

    // Generic text options
    this.surgeryDepartmentOptions = this.distinctSorted(data.map(r => r?.surgeryDepartment));
    this.giveOrderNameOptions = this.distinctSorted(data.map(r => r?.giveOrderName));
    this.timeGroupOptions = this.distinctSorted(data.map(r => r?.timeGroup)); // assumes backend returns `timeGroup`
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
    formControls['timeGroup'] = new FormControl('');               // text equality

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
    const f = this.filterForm.value;
    const globalFilter = (f['globalFilter'] || '').toLowerCase();
  
    // ✅ Normalize topProcedure to number | null
    const selTopRaw = this.filterForm.get('topProcedure')?.value;
    const selTop: number | null =
      selTopRaw === null || selTopRaw === undefined || selTopRaw === ''
        ? null
        : Number(selTopRaw);
  
    const selDept: string = (f['surgeryDepartmentFilter'] || '').trim();
    const selGive: string = (f['giveOrderNameFilter'] || '').trim();
    const selGroup: string = (f['timeGroup'] || '').trim();
  
    this.filteredData = this.dataSource.filter((item) => {
      // ✅ TopProcedure threshold (<=)
      const itemTopNum =
        item?.topProcedure === null || item?.topProcedure === undefined || item?.topProcedure === ''
          ? null
          : Number(item.topProcedure);
  
      const topOk =
        selTop === null || (itemTopNum !== null && !isNaN(itemTopNum) && itemTopNum <= selTop);
  
      // Equality filters (skip when empty)
      const deptOk = !selDept || String(item?.surgeryDepartment || '') === selDept;
      const giveOk = !selGive || String(item?.giveOrderName || '') === selGive;
      const groupOk = !selGroup || String(item?.timeGroup || '') === selGroup;
  
      // Existing per-column text filters
      const perColumnOk = this.columns.every((column) => {
        const ctlVal = f[column];
        if (!ctlVal) return true;
        const value = String(item[column] ?? '').toLowerCase();
        return value.includes(String(ctlVal).toLowerCase());
      });
  
      // Global search
      const globalOk =
        !globalFilter ||
        this.columns.some((column) => String(item[column] || '').toLowerCase().includes(globalFilter));
  
      return perColumnOk && globalOk && topOk && deptOk && giveOk && groupOk;
    });
  
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
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
}
