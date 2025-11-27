import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

type Row = {
  patient: number;
  unitName: string;
  admissionNo: string;
  idNum: string;
  name: string;
  ageYears: number | null;

  admissionMedicalRecord?: number | null;
  followUpMedicalRecord?: number | null;
  releaseMedicalRecord?: number | null;

  sugerAbove180Last72hYN: string;   // כן/לא
  sugerBelow70Last72hYN: string;    // כן/לא

  lastSugarResult?: number | null;
  hemoglobinLastResult?: number | null;

  sugerDiagnosis: string;           // כן/לא
  sugerDiagnosisText?: string | null;

  footEstimation: string;           // כן/לא
  insulin?: string | null;
};

type TriState = 'all' | 'yes' | 'no';

@Component({
  selector: 'app-diabetes-daily-report',
  templateUrl: './diabetes-daily-report.component.html',
  styleUrls: ['./diabetes-daily-report.component.scss']
})
export class DiabetesDailyReportComponent implements OnInit {

  titleUnit = 'דוח יומי סוכרת';
  Title1 = '— ';
  Title2 = 'סה״כ תוצאות ';
  totalResults = 0;
  loading = false;

  /** ---------- 3-state filters: הכל / כן / לא ---------- */
  sugarAboveFilter: TriState = 'all';
  sugarBelowFilter: TriState = 'all';
  diagnosisFilter: TriState = 'all';
  footFilter: TriState = 'all';
  insulinFilter: TriState = 'all';

  // base set for KPI counters (after text filters, before tri-state filters)
  private baseFilteredForKpi: Row[] = [];

  columns: (keyof Row)[] = [
    'unitName',
    'admissionNo',
    'idNum',
    'name',
    'ageYears',
    'sugerAbove180Last72hYN',
    'sugerBelow70Last72hYN',
    'lastSugarResult',
    'hemoglobinLastResult',
    'sugerDiagnosis',
    'sugerDiagnosisText',
    'footEstimation',
    'insulin'
  ];

  filterForm: FormGroup;
  matTableDataSource = new MatTableDataSource<Row>([]);
  dataSource: Row[] = [];
  filteredData: Row[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, fb: FormBuilder) {
    const ctrls: Record<string, FormControl> = {};
    this.columns.forEach(c => (ctrls[c] = new FormControl('')));
    ctrls['globalFilter'] = new FormControl('');
    this.filterForm = fb.group(ctrls);
  }

  ngOnInit(): void {
    this.load();

    Object.keys(this.filterForm.controls).forEach(k => {
      this.filterForm
        .get(k)!
        .valueChanges.pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });
  }

  private load(): void {
    this.loading = true;

    this.http
      .get<Row[]>(`${environment.apiUrl}DiabetesDailyReport/get`)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: rows => {
          try {
            const norm = (rows || []).map((r: any) => ({
              patient: r.patient ?? 0,
              unitName: r.unitName ?? '',
              admissionNo: (r.admissionNo ?? '').toString(),
              idNum: r.idNum ?? '',
              name: r.name ?? '',
              ageYears: r.ageYears ?? null,

              admissionMedicalRecord: r.admissionMedicalRecord ?? null,
              followUpMedicalRecord: r.followUpMedicalRecord ?? null,
              releaseMedicalRecord: r.releaseMedicalRecord ?? null,

              sugerAbove180Last72hYN: r.sugerAbove180Last72hYN ?? '',
              sugerBelow70Last72hYN: r.sugerBelow70Last72hYN ?? '',

              lastSugarResult: r.lastSugarResult ?? null,
              hemoglobinLastResult: r.hemoglobinLastResult ?? null,

              sugerDiagnosis: r.sugerDiagnosis ?? '',
              sugerDiagnosisText: r.sugerDiagnosisText ?? null,

              footEstimation: r.footEstimation ?? '',
              insulin: r.insulin ?? ''
            })) as Row[];

            this.dataSource = norm;
            this.applyFilters();

            setTimeout(() => {
              this.matTableDataSource.paginator = this.paginator;
              this.matTableDataSource.sort = this.sort;
            });
          } catch (e) {
            console.error('Mapping error:', e);
            alert('שגיאה בעיבוד הנתונים');
          }
        },
        error: err => {
          console.error('Load error:', err);
          alert('שגיאה בטעינת דוח סוכרת יומי');
          this.loading = false;
        }
      });
  }

  getColumnLabel(c: keyof Row | 'globalFilter'): string {
    const labels: Record<string, string> = {
      unitName: 'שם יחידה',
      admissionNo: 'מס׳ אשפוז',
      idNum: 'תעודת זהות',
      name: 'שם מטופל',
      ageYears: 'גיל',
      sugerAbove180Last72hYN: 'סוכר >180 ב־72 שעות',
      sugerBelow70Last72hYN: 'סוכר <70 ב־72 שעות',
      lastSugarResult: 'תוצאת סוכר אחרונה',
      hemoglobinLastResult: 'המוגלובין אחרון',
      sugerDiagnosis: 'אבחנת סוכרת (כן/לא)',
      sugerDiagnosisText: 'טקסט אבחנת סוכרת',
      footEstimation: 'הערכת כף רגל',
      insulin: 'אינסולין אחרון',
      globalFilter: 'חיפוש'
    };
    return labels[c] ?? (c as string);
  }

  getFormControl(c: keyof Row | 'globalFilter') {
    return this.filterForm.get(c) as FormControl;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')!.setValue('');
    // reset tri-state filters
    this.sugarAboveFilter = 'all';
    this.sugarBelowFilter = 'all';
    this.diagnosisFilter = 'all';
    this.footFilter = 'all';
    this.insulinFilter = 'all';
    this.applyFilters();
    this.paginator?.firstPage();
  }

  applyFilters(): void {
    const vals = this.filterForm.value as Record<string, string>;
    const global = (vals['globalFilter'] || '').toLowerCase();

    // 1) base filter from form + global search
    const base = this.dataSource.filter(row => {
      const perCol = this.columns.every(col => {
        const needle = (vals[col as string] || '').toLowerCase().trim();
        if (!needle) return true;
        const val = ((row[col] ?? '') + '').toLowerCase();
        return val.includes(needle);
      });

      const globalOk =
        !global ||
        this.columns.some(col =>
          (((row[col] ?? '') + '').toLowerCase().includes(global))
        );

      return perCol && globalOk;
    });

    // used for all KPI counters
    this.baseFilteredForKpi = base;

    // 2) apply tri-state filters (AND)
    let afterToggles = base;

    // סוכר > 180
    if (this.sugarAboveFilter === 'yes') {
      afterToggles = afterToggles.filter(
        r => (r.sugerAbove180Last72hYN || '').trim() === 'כן'
      );
    } else if (this.sugarAboveFilter === 'no') {
      afterToggles = afterToggles.filter(
        r => (r.sugerAbove180Last72hYN || '').trim() !== 'כן'
      );
    }

    // סוכר < 70
    if (this.sugarBelowFilter === 'yes') {
      afterToggles = afterToggles.filter(
        r => (r.sugerBelow70Last72hYN || '').trim() === 'כן'
      );
    } else if (this.sugarBelowFilter === 'no') {
      afterToggles = afterToggles.filter(
        r => (r.sugerBelow70Last72hYN || '').trim() !== 'כן'
      );
    }

    // אבחנת סוכרת
    if (this.diagnosisFilter === 'yes') {
      afterToggles = afterToggles.filter(
        r => (r.sugerDiagnosis || '').trim() === 'כן'
      );
    } else if (this.diagnosisFilter === 'no') {
      afterToggles = afterToggles.filter(
        r => (r.sugerDiagnosis || '').trim() !== 'כן'
      );
    }

    // הערכת כף רגל
    if (this.footFilter === 'yes') {
      afterToggles = afterToggles.filter(
        r => (r.footEstimation || '').trim() === 'כן'
      );
    } else if (this.footFilter === 'no') {
      afterToggles = afterToggles.filter(
        r => (r.footEstimation || '').trim() !== 'כן'
      );
    }

    // אינסולין
    if (this.insulinFilter === 'yes') {
      afterToggles = afterToggles.filter(
        r => (r.insulin || '').toString().trim() !== ''
      );
    } else if (this.insulinFilter === 'no') {
      afterToggles = afterToggles.filter(
        r => (r.insulin || '').toString().trim() === ''
      );
    }

    // 3) push to table
    this.filteredData = afterToggles;
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
  }

  exportToExcel(): void {
    const hebrewData = this.filteredData.map(row => {
      const hebrewRow: Record<string, any> = {};
      this.columns.forEach(col => {
        const hebrewLabel = this.getColumnLabel(col);
        hebrewRow[hebrewLabel] = row[col];
      });
      return hebrewRow;
    });

    const ws = XLSX.utils.json_to_sheet(hebrewData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DiabetesDaily');
    XLSX.writeFile(wb, 'DiabetesDailyReport.xlsx');
  }

  // ===== KPI helpers =====

  get totalPatients(): number {
    return this.baseFilteredForKpi.length;
  }

  get above180Count(): number {
    return this.baseFilteredForKpi.filter(
      r => (r.sugerAbove180Last72hYN || '').trim() === 'כן'
    ).length;
  }

  get below70Count(): number {
    return this.baseFilteredForKpi.filter(
      r => (r.sugerBelow70Last72hYN || '').trim() === 'כן'
    ).length;
  }

  get diagnosisCount(): number {
    return this.baseFilteredForKpi.filter(
      r => (r.sugerDiagnosis || '').trim() === 'כן'
    ).length;
  }

  get footCount(): number {
    return this.baseFilteredForKpi.filter(
      r => (r.footEstimation || '').trim() === 'כן'
    ).length;
  }

  get insulinCount(): number {
    return this.baseFilteredForKpi.filter(
      r => (r.insulin || '').toString().trim() !== ''
    ).length;
  }

  // small helpers for HTML
  onSugarAboveFilterChange(val: TriState) {
    this.sugarAboveFilter = val;
    this.applyFilters();
  }

  onSugarBelowFilterChange(val: TriState) {
    this.sugarBelowFilter = val;
    this.applyFilters();
  }

  onDiagnosisFilterChange(val: TriState) {
    this.diagnosisFilter = val;
    this.applyFilters();
  }

  onFootFilterChange(val: TriState) {
    this.footFilter = val;
    this.applyFilters();
  }

  onInsulinFilterChange(val: TriState) {
    this.insulinFilter = val;
    this.applyFilters();
  }

  // cell styling – highlight extreme sugar values if desired
  getCellClass(c: string, row: Row): Record<string, boolean> {
    const isHigh =
      c === 'lastSugarResult' &&
      row.lastSugarResult != null &&
      row.lastSugarResult > 180;

    const isLow =
      c === 'lastSugarResult' &&
      row.lastSugarResult != null &&
      row.lastSugarResult < 70;

    return {
      'danger-high': isHigh,
      'danger-low': isLow
    };
  }
}
