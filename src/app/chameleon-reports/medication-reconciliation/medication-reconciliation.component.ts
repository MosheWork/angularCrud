import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup } from '@angular/forms';

/* ---------------------- Helpers: lowercase first letter --------------------- */
function lowerFirst(s: string): string {
  if (!s || typeof s !== 'string') return s as any;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Recursively lower-first every own key of objects/arrays you get from backend */
function normalizeKeys<T = any>(input: any): T {
  if (Array.isArray(input)) {
    return input.map(v => normalizeKeys(v)) as any;
  }
  if (input && typeof input === 'object') {
    const out: any = {};
    Object.keys(input).forEach(k => {
      const nk = lowerFirst(k);
      out[nk] = normalizeKeys((input as any)[k]);
    });
    return out as T;
  }
  return input as T;
}

/* ----------------------------- New interfaces ------------------------------ */
// keys are camelCase (first letter lowercased)
export interface MedicationReconciliationModel {
  admission_No: string;
  admission_Date: string;      // if you want Date, convert after normalize
  unitName: string;
  comboText_15536: string;
  comboText_15537: string;
  consiliums: string;

  // entry users
  userName_15536: string;
  userName_15537: string;
}

@Component({
  selector: 'app-medication-reconciliation',
  templateUrl: './medication-reconciliation.component.html',
  styleUrls: ['./medication-reconciliation.component.scss']
})
export class MedicationReconciliationComponent implements OnInit {
  // columns updated to camelCase
  displayedColumns: string[] = [
    'admission_No',
    'admission_Date',
    'unitName',
    'comboText_15536',
    'comboText_15537',
    'userName_15536',
    'userName_15537',
    'consiliums'
  ];

  dataSource = new MatTableDataSource<MedicationReconciliationModel>();
  stillHospitalizedDataSource = new MatTableDataSource<MedicationReconciliationModel>();

  isLoading = true;
  departments: string[] = [];
  filterForm: FormGroup;
  tabIndex = 0;

  // Gauges / counters
  stillValidCount = 0;
  stillInvalidCount = 0;
  stillTotalCount = 0;
  stillValidPercentage = 0;

  dischargedValidCount = 0;
  dischargedInvalidCount = 0;
  dischargedTotalCount = 0;
  dischargedValidPercentage = 0;

  originalData: MedicationReconciliationModel[] = [];
  originalStillInHospitalData: MedicationReconciliationModel[] = [];

  @ViewChild('globalSearchInput') globalSearchInput!: any;

  // ✅ Discharged
  private _dischargedPaginator!: MatPaginator;
  @ViewChild('dischargedPaginator') set dischargedPaginatorSetter(p: MatPaginator) {
    this._dischargedPaginator = p;
    if (this.dataSource) this.dataSource.paginator = p;
  }
  get dischargedPaginator(): MatPaginator {
    return this._dischargedPaginator;
  }

  private _dischargedSort!: MatSort;
  @ViewChild('dischargedSort') set dischargedSortSetter(s: MatSort) {
    this._dischargedSort = s;
    if (this.dataSource) this.dataSource.sort = s;
  }
  get dischargedSort(): MatSort {
    return this._dischargedSort;
  }

  // ✅ Still Hospitalized
  private _stillHospitalizedPaginator!: MatPaginator;
  @ViewChild('stillHospitalizedPaginator') set stillHospitalizedPaginatorSetter(p: MatPaginator) {
    this._stillHospitalizedPaginator = p;
    if (this.stillHospitalizedDataSource) this.stillHospitalizedDataSource.paginator = p;
  }
  get stillHospitalizedPaginator(): MatPaginator {
    return this._stillHospitalizedPaginator;
  }

  private _stillHospitalizedSort!: MatSort;
  @ViewChild('stillHospitalizedSort') set stillHospitalizedSortSetter(s: MatSort) {
    this._stillHospitalizedSort = s;
    if (this.stillHospitalizedDataSource) this.stillHospitalizedDataSource.sort = s;
  }
  get stillHospitalizedSort(): MatSort {
    return this._stillHospitalizedSort;
  }

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      department: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadDischargedData();
    this.loadStillHospitalizedData();
  }

  /* ------------------------------ Data loading ------------------------------ */
  loadDischargedData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/MedicationReconciliation`)
      .subscribe({
        next: raw => {
          // normalize keys from backend (first letter lowercased)
          const data = normalizeKeys<MedicationReconciliationModel[]>(raw);

          // (optional) if you want to truly treat dates as Date objects:
          // data.forEach(d => d.admission_Date = d.admission_Date ? new Date(d.admission_Date) as any : d.admission_Date);

          this.originalData = data;
          this.dataSource.data = data;

          this.departments = [...new Set(data.map(row => row.unitName).filter(Boolean))];
          this.isLoading = false;

          // metrics based on camelCase keys
          this.dischargedTotalCount = data.length;
          this.dischargedValidCount = data.filter(row => row.comboText_15536?.trim() === 'כן').length;
          this.dischargedInvalidCount = this.dischargedTotalCount - this.dischargedValidCount;
          this.dischargedValidPercentage = this.dischargedTotalCount
            ? Math.round((this.dischargedValidCount / this.dischargedTotalCount) * 100)
            : 0;

          this.filterForm.valueChanges.subscribe(() => this.applyFormFilter());
        },
        error: err => {
          console.error('❌ Failed to load discharged data:', err);
          this.isLoading = false;
        }
      });
  }

  loadStillHospitalizedData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/MedicationReconciliation/StilinHospital`)
      .subscribe({
        next: raw => {
          const data = normalizeKeys<MedicationReconciliationModel[]>(raw);

          this.originalStillInHospitalData = data;
          this.stillHospitalizedDataSource.data = data;

          this.stillTotalCount = data.length;
          this.stillValidCount = data.filter(row => row.comboText_15536?.trim() === 'כן').length;
          this.stillInvalidCount = this.stillTotalCount - this.stillValidCount;
          this.stillValidPercentage = this.stillTotalCount
            ? Math.round((this.stillValidCount / this.stillTotalCount) * 100)
            : 0;
        },
        error: err => {
          console.error('❌ Failed to load still hospitalized data:', err);
        }
      });
  }

  /* ------------------------------ Global filter ----------------------------- */
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    const activeDataSource = this.tabIndex === 0 ? this.stillHospitalizedDataSource : this.dataSource;

    activeDataSource.filterPredicate = (data, filter) =>
      Object.values(data).some(val => val?.toString().toLowerCase().includes(filter));

    activeDataSource.filter = filterValue;
  }

  /* --------------------------------- Form filter ---------------------------- */
  applyFormFilter(): void {
    const { department, startDate, endDate } = this.filterForm.value;

    const matchesFilters = (row: MedicationReconciliationModel) => {
      const matchesDept = !department || row.unitName === department;

      // if you cast admission_Date to Date above, adjust accordingly
      const dateObj = new Date(row.admission_Date);
      const matchesStart = !startDate || dateObj >= new Date(startDate);
      const matchesEnd = !endDate || dateObj <= new Date(endDate);

      return matchesDept && matchesStart && matchesEnd;
    };

    // Discharged
    const filteredDischarged = this.originalData.filter(matchesFilters);
    this.dataSource.data = filteredDischarged;
    this.dischargedTotalCount = filteredDischarged.length;
    this.dischargedValidCount = filteredDischarged.filter(r => r.comboText_15536?.trim() === 'כן').length;
    this.dischargedInvalidCount = this.dischargedTotalCount - this.dischargedValidCount;
    this.dischargedValidPercentage = this.dischargedTotalCount
      ? Math.round((this.dischargedValidCount / this.dischargedTotalCount) * 100)
      : 0;

    // Still hospitalized
    const filteredStill = this.originalStillInHospitalData.filter(matchesFilters);
    this.stillHospitalizedDataSource.data = filteredStill;
    this.stillTotalCount = filteredStill.length;
    this.stillValidCount = filteredStill.filter(r => r.comboText_15536?.trim() === 'כן').length;
    this.stillInvalidCount = this.stillTotalCount - this.stillValidCount;
    this.stillValidPercentage = this.stillTotalCount
      ? Math.round((this.stillValidCount / this.stillTotalCount) * 100)
      : 0;

    // re-bind paginator/sort
    setTimeout(() => {
      if (this.dischargedPaginator) this.dataSource.paginator = this.dischargedPaginator;
      if (this.dischargedSort) this.dataSource.sort = this.dischargedSort;

      if (this.stillHospitalizedPaginator) this.stillHospitalizedDataSource.paginator = this.stillHospitalizedPaginator;
      if (this.stillHospitalizedSort) this.stillHospitalizedDataSource.sort = this.stillHospitalizedSort;
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.dataSource.filter = '';
    this.dataSource.data = this.originalData;

    if (this.globalSearchInput) {
      this.globalSearchInput.nativeElement.value = '';
    }

    setTimeout(() => {
      if (this.dischargedPaginator) this.dataSource.paginator = this.dischargedPaginator;
      if (this.dischargedSort) this.dataSource.sort = this.dischargedSort;
    });
  }

  onTabChange(event: any): void {
    this.tabIndex = event.index;

    setTimeout(() => {
      if (this.tabIndex === 0 && this.stillHospitalizedPaginator && this.stillHospitalizedSort) {
        this.stillHospitalizedDataSource.paginator = this.stillHospitalizedPaginator;
        this.stillHospitalizedDataSource.sort = this.stillHospitalizedSort;
      } else if (this.tabIndex === 1 && this.dischargedPaginator && this.dischargedSort) {
        this.dataSource.paginator = this.dischargedPaginator;
        this.dataSource.sort = this.dischargedSort;
      }
    }, 0);
  }
}
