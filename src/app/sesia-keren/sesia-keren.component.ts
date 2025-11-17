import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';

import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';

interface FormControls {
  [key: string]: FormControl;
}

@Component({
  selector: 'app-sesia-keren',
  templateUrl: './sesia-keren.component.html',
  styleUrls: ['./sesia-keren.component.scss']
})
export class SesiaKerenComponent implements OnInit {

  showGraph = false;
  Title1: string = ' ניתוחי חדר ניתוח  - ';
  Title2: string = 'סה"כ תוצאות ';
  titleUnit: string = 'Sesia Keren ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  graphData: any[] = [];

  dataSource: any[] = [];
  filteredData: any[] = [];

  matTableDataSource: MatTableDataSource<any>;

  // 👇 Columns shown in table + used for filters
  columns: string[] = [
    'caseNumber',
    'patientName',
    'surgeryDate',
    'hDayOfWeek',
    'timeRoomEnter',
    'timeRoomExit',
    'department',
    'icd9',
    'keren',
    'drg',
    'surgeryRunk',
    'surgerY_NAME',
    'diagCode',
    'diagDesc',
    'secretaryDRG',
    'surgeryCodeList',
    'timeGroup'
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.loadData();

    // Per-column filters
    this.columns.forEach((column) => {
      this.getFormControl(column)?.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });

    // Global filter
    this.filterForm.get('globalFilter')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  // ====== BACKEND CALL ======
  loadData() {
    this.http.get<any[]>(environment.apiUrl + 'SesiaKeren/GetAll')
      .subscribe((data) => {
        // 🔁 Normalize keys from backend → front-end
        const normalized = data.map(d => ({
          caseNumber:      d.caseNumber      ?? d.CaseNumber      ?? '',
          patientName:     d.patientName     ?? d.PatientName     ?? '',
          surgeryDate:     d.surgeryDate     ?? d.SurgeryDate     ?? null,
          hDayOfWeek:      d.hDayOfWeek      ?? d.HDayOfWeek      ?? '',
          timeRoomEnter:   d.timeRoomEnter   ?? d.TIME_ROOM_ENTER ?? '',
          timeRoomExit:    d.timeRoomExit    ?? d.TIME_ROOM_EXIT  ?? '',
          department:      d.department      ?? d.Department      ?? '',
          icd9:            d.icd9            ?? d.icD9            ?? d.ICD9 ?? '',
          keren:           d.keren           ?? d.Keren           ?? '',
          drg:             d.drg             ?? d.DRG             ?? '',
          surgeryRunk:     d.surgeryRunk     ?? d.SurgeryRunk     ?? '',
          surgerY_NAME:    d.surgerY_NAME    ?? d.SURGERY_NAME    ?? '',
          diagCode:        d.diagCode        ?? d.DiagCode        ?? '',
          diagDesc:        d.diagDesc        ?? d.DiagDesc        ?? '',
          secretaryDRG:    d.secretaryDRG    ?? d.SecretaryDRG    ?? '',
          surgeryCodeList: d.surgeryCodeList ?? d.SurgeryCodeList ?? '',
          timeGroup:       d.timeGroup       ?? d.TimeGroup       ?? ''
        }));

        this.dataSource = normalized;
        this.filteredData = [...normalized];

        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        this.totalResults = this.filteredData.length;
        this.graphData = this.filteredData;
      });
  }

  // ====== FILTER FORM ======
  private createFilterForm() {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['pageSize'] = new FormControl(15);
    formControls['pageIndex'] = new FormControl(0);
    formControls['globalFilter'] = new FormControl('');

    return this.fb.group(formControls);
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }

  // ====== LABELS ======
  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      caseNumber:      'מספר מקרה',
      patientName:     'שם מטופל',
      surgeryDate:     'תאריך ניתוח',
      hDayOfWeek:      'יום בשבוע',
      timeRoomEnter:   'כניסה לחדר ניתוח',
      timeRoomExit:    'יציאה מחדר ניתוח',
      department:      'מחלקה',
      icd9:            'ICD9 פעולה',
      keren:           'קרן',
      drg:             'DRG',
      surgeryRunk:     'דירוג ניתוח',
      surgerY_NAME:    'שם ניתוח',
      diagCode:        'קוד אבחנה',
      diagDesc:        'תיאור אבחנה',
      secretaryDRG:    'DRG מזכירות',
      surgeryCodeList: 'רשימת קודי ניתוח',
      timeGroup:       'קבוצת זמן'
    };
    return columnLabels[column] || column;
  }

  // ====== FILTERING ======
  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toString().toLowerCase();

    this.filteredData = this.dataSource.filter((item) => {
      // Per-column filters
      const perColumnOk = this.columns.every((column) => {
        const filterVal = (filters[column] || '').toString().toLowerCase();
        if (!filterVal) return true;
        const value = (item[column] ?? '').toString().toLowerCase();
        return value.includes(filterVal);
      });

      if (!perColumnOk) return false;

      // Global filter
      if (globalFilter) {
        const found = this.columns.some((column) => {
          const value = (item[column] ?? '').toString().toLowerCase();
          return value.includes(globalFilter);
        });
        if (!found) return false;
      }

      return true;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.filterForm.get('pageSize')?.setValue(15);

    this.filteredData = [...this.dataSource];
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  // ====== EXCEL ======
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'SesiaKeren.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
