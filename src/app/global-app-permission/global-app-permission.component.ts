import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

/* =========================
   Excel limits & helpers
   ========================= */

// Excel hard cell limit (characters per cell)
const EXCEL_CELL_LIMIT = 32767;
// We chunk slightly below the limit to be safe
const CHUNK_LIMIT = 32000;

/**
 * Split a long string into chunks of "size" characters.
 * This prevents a single cell from exceeding Excel's 32,767 char limit.
 */
function splitToChunks(v: string, size = CHUNK_LIMIT): string[] {
  const s = (v ?? '').toString();
  if (!s) return [''];
  const chunks: string[] = [];
  for (let i = 0; i < s.length; i += size) {
    chunks.push(s.substring(i, i + size));
  }
  return chunks;
}

/** Keys that can get very long and should be chunked for Excel export */
const LONG_KEYS = [
  'adActivePermision',
  'ChamelleonGropPermision',
  'ChamelleonRestrictedGropPermision'
];

/** Column header labels used for Excel export */
const HEADER_LABELS: Record<string, string> = {
  profilePicture: 'תמונת פרופיל',
  employeeID: 'מס׳ עובד',
  name: 'שם',
  adUserName: 'AD משתמש',
  eitanChameleonADGroupPermision: 'קבוצה באיתן',
  namerUserActivePermision: 'NAMER',
  adActivePermision: 'AD קבוצות',
  ChamelleonGropPermision: 'Chameleon קבוצה',
  ChamelleonRestrictedGropPermision: 'Chameleon קבוצה מוגבלת',
  OnnLineActiveUser: 'משתמש פעיל Online',
  EVEActiveUser: 'משתמש פעיל EVE'
};

/**
 * Take a row and produce an Excel-safe object:
 * - short fields copied as-is (clamped if someone pastes an extreme value)
 * - long fields split across multiple "field_1", "field_2", ... keys
 */
function flattenRowForExcel(row: any): any {
  const out: any = {};
  // Copy short fields (clamp to avoid accidental oversize)
  for (const key of Object.keys(row)) {
    const val = row[key];
    if (!LONG_KEYS.includes(key)) {
      if (typeof val === 'string' && val.length > EXCEL_CELL_LIMIT) {
        out[key] = val.slice(0, CHUNK_LIMIT) + '…';
      } else {
        out[key] = val;
      }
    }
  }
  // Expand long fields into numbered chunks
  for (const key of LONG_KEYS) {
    const chunks = splitToChunks((row as any)[key] || '');
    if (chunks.length === 1) {
      out[key] = chunks[0];
    } else {
      chunks.forEach((c, idx) => {
        out[`${key}_${idx + 1}`] = c;
      });
    }
  }
  return out;
}

/**
 * Generate an ordered list of keys for the Excel sheet:
 * - use the table "columns" first
 * - append any chunked keys (like "adActivePermision_2") discovered in the flattened rows
 */
function headerOrderFromColumns(columns: string[], sample: any): string[] {
  const base = [...columns];
  const extras = Object.keys(sample || {}).filter(k => !base.includes(k));
  return [...base, ...extras];
}

/* =========================
   Component types
   ========================= */

type Row = {
  employeeID: string | null;
  name: string | null;
  adUserName: string | null;
  profilePicture: string | null;
  eitanChameleonADGroupPermision: string;
  namerUserActivePermision: string;
  adActivePermision: string;

  // Extra fields
  ChamelleonGropPermision: string;
  ChamelleonRestrictedGropPermision: string;
  OnnLineActiveUser: string;
  EVEActiveUser: string;
};

interface FormControls {
  [key: string]: FormControl;
}

/* =========================
   Component
   ========================= */

@Component({
  selector: 'app-global-app-permission',
  templateUrl: './global-app-permission.component.html',
  styleUrls: ['./global-app-permission.component.scss']
})
export class GlobalAppPermissionComponent implements OnInit {

  // Title text shown above the table
  Title1: string = ' הרשאות אפליקציות גלובליות - ';
  Title2: string = 'סה"כ תוצאות ';
  titleUnit: string = 'הרשאות ';
  totalResults: number = 0;

  // Material table controls
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Reactive form for filters (global search + toggles)
  filterForm: FormGroup;

  // Data sources
  dataSource: Row[] = [];                  // original data
  filteredData: Row[] = [];                // filtered view
  matTableDataSource: MatTableDataSource<Row>; // Material wrapper (paging/sort)

  // Column order for the table
  columns = [
    'profilePicture', 'employeeID','name','adUserName',
    'eitanChameleonADGroupPermision','namerUserActivePermision','adActivePermision',
    'ChamelleonGropPermision','ChamelleonRestrictedGropPermision',
    'OnnLineActiveUser','EVEActiveUser'
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    // Initialize the reactive form and the material table
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<Row>([]);
  }

  /**
   * Lifecycle hook
   * - Loads data from API
   * - Normalizes keys/casing
   * - Wires form changes to filtering
   */
  ngOnInit(): void {
    this.http.get<any[]>(environment.apiUrl + 'GlobalAppPermission/all')
      .subscribe(data => {
        // Normalize payload casing and map to our Row type
        const rows: Row[] = data.map(d => ({
          employeeID: (d.employeeID ?? d.EmployeeID ?? null)?.toString() ?? null,
          name: d.name ?? d.Name ?? null,
          adUserName: d.adUserName ?? d.ADUserName ?? null,
          profilePicture: d.profilePicture ?? d.ProfilePicture ?? null,

          eitanChameleonADGroupPermision: d.eitanChameleonADGroupPermision ?? d.EitanChameleonADGroupPermision ?? '',
          namerUserActivePermision:       d.namerUserActivePermision ?? d.NAMERUserActivePermision ?? '',
          adActivePermision:              d.adActivePermision ?? d.ADActivePermision ?? '',

          ChamelleonGropPermision:           d.ChamelleonGropPermision ?? d.chamelleonGropPermision ?? '',
          ChamelleonRestrictedGropPermision: d.ChamelleonRestrictedGropPermision ?? d.chamelleonRestrictedGropPermision ?? '',
          OnnLineActiveUser:                 d.OnnLineActiveUser ?? d.onnLineActiveUser ?? '',
          EVEActiveUser:                     d.EVEActiveUser ?? d.eveActiveUser ?? ''
        }));

        // Bind to UI
        this.dataSource = rows;
        this.filteredData = [...rows];
        this.matTableDataSource = new MatTableDataSource<Row>(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        // Re-apply filters on any change (debounced)
        this.filterForm.valueChanges
          .pipe(debounceTime(100), distinctUntilChanged())
          .subscribe(() => this.applyFilters());

        // Initial filter calc (sets totalResults)
        this.applyFilters();
      });
  }

  /**
   * Return the display label for a column key in the table header.
   */
  getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      employeeID: 'מס׳ עובד',
      name: 'שם',
      adUserName: 'AD משתמש',
      profilePicture: 'תמונת פרופיל',
      eitanChameleonADGroupPermision: 'קבוצה באיתן',
      namerUserActivePermision: 'NAMER',
      adActivePermision: 'AD קבוצות',
      ChamelleonGropPermision: 'Chameleon קבוצה',
      ChamelleonRestrictedGropPermision: 'Chameleon קבוצה מוגבלת',
      OnnLineActiveUser: 'משתמש פעיל Online',
      EVEActiveUser: 'משתמש פעיל EVE'
    };
    return labels[column] ?? column;
  }

  /**
   * Build the reactive form with all filters:
   * - globalFilter: free text search across all columns
   * - has*Only: slide toggles that keep rows with non-empty values in a given column
   */
  private createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],
      hasEitanOnly: [false],
      hasNamerOnly: [false],
      hasAdActiveOnly: [false],
      hasChameleonOnly: [false],
      hasChameleonRestrictedOnly: [false],
      hasOnlineOnly: [false],
      hasEveOnly: [false]
    });
  }

  /**
   * Utility: determine if a value is considered "present" (non-empty after trim)
   */
  private hasValue(v: any): boolean {
    if (v === null || v === undefined) return false;
    const s = String(v).trim();
    return s.length > 0;
  }

  /**
   * Utility: get a typed FormControl by column key (used by templates if needed)
   */
  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }

  /**
   * Apply all active filters:
   * - slide toggles: keep rows with non-empty values in the respective fields
   * - global text filter: includes a row if any visible column contains the term
   * Updates: filteredData, matTableDataSource, and totalResults.
   */
  applyFilters(): void {
    const {
      globalFilter,
      hasEitanOnly,
      hasNamerOnly,
      hasAdActiveOnly,
      hasChameleonOnly,
      hasChameleonRestrictedOnly,
      hasOnlineOnly,
      hasEveOnly
    } = this.filterForm.value;

    const gf = (globalFilter || '').toString().toLowerCase();

    this.filteredData = this.dataSource.filter(r => {
      // Toggle filters → keep only if value exists
      if (hasEitanOnly && !this.hasValue(r.eitanChameleonADGroupPermision)) return false;
      if (hasNamerOnly && !this.hasValue(r.namerUserActivePermision)) return false;
      if (hasAdActiveOnly && !this.hasValue(r.adActivePermision)) return false;
      if (hasChameleonOnly && !this.hasValue(r.ChamelleonGropPermision)) return false;
      if (hasChameleonRestrictedOnly && !this.hasValue(r.ChamelleonRestrictedGropPermision)) return false;
      if (hasOnlineOnly && !this.hasValue(r.OnnLineActiveUser)) return false;
      if (hasEveOnly && !this.hasValue(r.EVEActiveUser)) return false;

      // Global filter across visible columns
      if (!gf) return true;
      return this.columns.some(c => (r as any)[c]?.toString().toLowerCase().includes(gf));
    });

    // Push results to the table + paginator
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  /**
   * Export the filtered grid to XLSX, chunking very long text columns
   * so no cell exceeds Excel's 32,767 char limit.
   * Also sets human-friendly column headers.
   */
  exportToExcel(): void {
    try {
      // 1) Flatten/Chunk each row
      const flat = this.filteredData.map(r => flattenRowForExcel(r));

      // 2) Build ordered headers (table order + any chunked extras)
      const headerOrder = headerOrderFromColumns(this.columns, flat[0] || {});

      // 3) Create display-labeled objects in header order
      const labeled = flat.map(row => {
        const obj: any = {};
        for (const key of headerOrder) {
          const baseKey = key.includes('_') ? key.split('_')[0] : key;
          const suffix = key.includes('_') ? ` (${key.split('_')[1]})` : '';
          const label = (HEADER_LABELS[key] || HEADER_LABELS[baseKey] || key) + suffix;
          obj[label] = row[key] ?? '';
        }
        return obj;
      });

      // 4) Build worksheet/workbook
      const ws = XLSX.utils.json_to_sheet(labeled);
      const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };

      // 5) Write and download
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'GlobalAppPermission.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      // Optional: fallback to CSV if XLSX fails for any reason
      this.exportToCsvFallback();
    }
  }

  /**
   * CSV fallback exporter (optional).
   * Uses the same flattening/chunking so each line stays reasonable.
   */
// Put this in your component (replaces exportToCsvFallback)
private exportToCsvFallback(): void {
  // 1) Flatten/Chunk and type the rows
  const flat: Array<Record<string, any>> =
    this.filteredData.map(r => flattenRowForExcel(r)) as Array<Record<string, any>>;

  // 2) Build a deterministic column list without flatMap (ES2018 safe)
  const colSet = new Set<string>();
  flat.forEach((row: Record<string, any>) => {
    Object.keys(row).forEach((k: string) => colSet.add(k));
  });
  const cols: string[] = Array.from(colSet);

  // 3) CSV-escape helper
  const esc = (s: any): string => {
    const v = (s ?? '').toString().replace(/"/g, '""');
    return `"${v}"`;
  };

  // 4) Compose CSV
  const header = cols.join(',');
  const rows = flat.map((row: Record<string, any>) =>
    cols.map((c: string) => esc(row[c])).join(',')
  );
  const csv = [header, ...rows].join('\r\n');

  // 5) Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GlobalAppPermission.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


  /**
   * Reset all filters (global text + toggles) to defaults and re-apply.
   */
  resetAllFilters(): void {
    this.filterForm.reset({
      globalFilter: '',
      hasEitanOnly: false,
      hasNamerOnly: false,
      hasAdActiveOnly: false,
      hasChameleonOnly: false,
      hasChameleonRestrictedOnly: false,
      hasOnlineOnly: false,
      hasEveOnly: false
    });
    this.applyFilters();
  }

  /**
   * Navigate back to home (if you render a home button in the template).
   */
  goToHome(): void {
    this.router.navigate(['/MainPageReports']);
  }
}
