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

/** Split a long string into chunks so no cell exceeds Excel limits */
function splitToChunks(v: string, size = CHUNK_LIMIT): string[] {
  const s = (v ?? '').toString();
  if (!s) return [''];
  const chunks: string[] = [];
  for (let i = 0; i < s.length; i += size) {
    chunks.push(s.substring(i, i + size));
  }
  return chunks;
}

/** Keys that can be very long and must be chunked for Excel */
const LONG_KEYS = [
  'adActivePermision',
  'ChamelleonGropPermision',
  'ChamelleonRestrictedGropPermision'
];

/** Column labels for Excel export */
const HEADER_LABELS: Record<string, string> = {
  profilePicture: 'תמונת פרופיל',
  employeeID: 'מס׳ עובד',
  name: 'שם',
  adUserName: 'AD משתמש',
  eitanChameleonADGroupPermision: 'קבוצה באיתן',
  namerUserActivePermision: 'NAMER',
  adActivePermision: 'קבוצות ב-AD',
  ChamelleonGropPermision: 'Chameleon קבוצה',
  ChamelleonRestrictedGropPermision: 'Chameleon קבוצה מוגבלת',
  OnnLineActiveUser: 'משתמש פעיל Online',
  EVEActiveUser: 'משתמש פעיל EVE',

  // ⬅️ חדשים
  departnentDescripton: 'מחלקה',
  functionDescription: 'תפקיד',
  description: 'סיבת סיום עבודה'
};


/** Convert one row into an Excel-safe object (splits long cells) */
function flattenRowForExcel(row: any): any {
  const out: any = {};
  // Copy short fields (clamp if someone pasted extreme text)
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
    if (chunks.length === 1) out[key] = chunks[0];
    else chunks.forEach((c, idx) => (out[`${key}_${idx + 1}`] = c));
  }
  return out;
}

/** Generate ordered headers: table columns first, then any chunked extras */
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
    ChamelleonGropPermision: string;
    ChamelleonRestrictedGropPermision: string;
    OnnLineActiveUser: string;
    EVEActiveUser: string;
  
    // קיים כבר לסינון עובד פעיל/לא פעיל (לא מוצג בטבלה)
    endWorkDate: string | null;
  
    // ⬅️ חדשים
    description: string;              // מ-EP_EndWorkReason.Description
    departnentDescripton: string;     // מ-EP_Departnents.DepartnentDescripton
    functionDescription: string;      // מ-EP_Functions.FunctionDescription
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

  // Reactive form for filters (global search + toggles + dropdown)
  filterForm: FormGroup;

  // Data sources
  dataSource: Row[] = [];                         // original data
  filteredData: Row[] = [];                       // filtered view
  matTableDataSource: MatTableDataSource<Row>;    // Material wrapper (paging/sort)

  // Column order for the table (NO endWorkDate here on purpose)
  columns = [
    'profilePicture', 'employeeID','name','adUserName',
    'departnentDescripton', 'functionDescription', 'description', 
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
   * Parse a "truthy/active" string into boolean when possible.
   * Returns: true / false / null (unknown or empty)
   */
  private parseBoolish(v: any): boolean | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim().toLowerCase();
    if (s === '') return null;

    // numeric
    if (!isNaN(+s)) return +s !== 0;

    // true-ish
    if (['true','t','yes','y','כן','active','פעיל','on'].includes(s)) return true;

    // false-ish
    if (['false','f','no','n','לא','inactive','לא פעיל','off'].includes(s)) return false;

    // fallback: any non-empty value treated as "has value" → consider active
    return true;
  }

  /**
   * Lifecycle hook: load data, normalize, wire filters.
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
          EVEActiveUser:                     d.EVEActiveUser ?? d.eveActiveUser ?? '',
        
          endWorkDate: d.endWorkDate ?? d.EndWorkDate ?? null,
        
          // ⬅️ חדשים (שמות העמודות מה-SQL)
          description: d.Description ?? d.description ?? '',
          departnentDescripton: d.DepartnentDescripton ?? d.departnentDescripton ?? '',
          functionDescription: d.FunctionDescription ?? d.functionDescription ?? ''
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

  /** Display labels in the table header */
  getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      employeeID: 'ת"ז ',
      name: 'שם',
      adUserName: 'AD משתמש',
      profilePicture: 'תמונת פרופיל',
      eitanChameleonADGroupPermision: 'קבוצה באיתן',
      namerUserActivePermision: 'NAMER',
      adActivePermision: 'קבוצות ב-AD',
      ChamelleonGropPermision: 'Chameleon קבוצה',
      ChamelleonRestrictedGropPermision: 'Chameleon קבוצה מוגבלת',
      OnnLineActiveUser: 'משתמש פעיל Online',
      EVEActiveUser: 'משתמש פעיל EVE',
  
      // ⬅️ חדשים
      departnentDescripton: '(onnline)מחלקה',
      functionDescription: '(onnline)תפקיד',
      description: 'סיבת סיום עבודה'
    };
    return labels[column] ?? column;
  }
  


  private createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],

      // existing toggles (presence filter)
      hasEitanOnly: [false],
      hasNamerOnly: [false],
      hasAdActiveOnly: [false],
      hasChameleonOnly: [false],
      hasChameleonRestrictedOnly: [false],

      
      onlineFilter: ['active'],

      activeToggle: [null as boolean | null],

      
      hasEveOnly: [false],
      hasEitanPsychOnly: [false],
    });
  }

  private hasValue(v: any): boolean {
    if (v === null || v === undefined) return false;
    const s = String(v).trim();
    return s.length > 0;
  }

  getFormControl(key: string): FormControl {
    return (this.filterForm.get(key) as FormControl) || new FormControl('');
  }


  applyFilters(): void {
    const {
      globalFilter,
      hasEitanOnly,
      hasNamerOnly,
      hasAdActiveOnly,
      hasChameleonOnly,
      hasChameleonRestrictedOnly,
      onlineFilter,       // 'all' | 'active' | 'inactive'
      activeToggle,       // null | true | false
      hasEveOnly,
      hasEitanPsychOnly,
    } = this.filterForm.value;

    const gf = (globalFilter || '').toString().toLowerCase();

    this.filteredData = this.dataSource.filter(r => {
      // Presence filters
      if (hasEitanOnly && !this.hasValue(r.eitanChameleonADGroupPermision)) return false;
      if (hasNamerOnly && !this.hasValue(r.namerUserActivePermision)) return false;
      if (hasAdActiveOnly && !this.hasValue(r.adActivePermision)) return false;
      if (hasChameleonOnly && !this.hasValue(r.ChamelleonGropPermision)) return false;
      if (hasChameleonRestrictedOnly && !this.hasValue(r.ChamelleonRestrictedGropPermision)) return false;
      if (hasEveOnly && !this.hasValue(r.EVEActiveUser)) return false;
      if (hasEitanPsychOnly) {
        const s = (r.eitanChameleonADGroupPermision ?? '').toString();
        // look for U_ChamPsyc as a whole token between start/end or delimiters
        const hasPsych = /(^|[,\s;|])U_ChamPsyc([,\s;|]|$)/i.test(s);
        if (!hasPsych) return false;
      }
      // Active/Inactive toggle (based on EndWorkDate)
      // true  => Active  (EndWorkDate == null)
      // false => Inactive (EndWorkDate != null)
      if (activeToggle === true && r.endWorkDate !== null) return false;
      if (activeToggle === false && r.endWorkDate === null) return false;

      // Online dropdown
      if (onlineFilter !== 'all') {
        const onlineParsed = this.parseBoolish(r.OnnLineActiveUser); // true/false/null
        if (onlineFilter === 'active' && onlineParsed !== true) return false;
        if (onlineFilter === 'inactive' && onlineParsed !== false) return false;
      }

      // Global text filter across visible columns
      if (!gf) return true;
      return this.columns.some(c => (r as any)[c]?.toString().toLowerCase().includes(gf));
    });

    // Push results to the table + paginator
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  /** Export current filtered view to XLSX (safe for long text) */
  exportToExcel(): void {
    try {
      const flat = this.filteredData.map(r => flattenRowForExcel(r));
      const headerOrder = headerOrderFromColumns(this.columns, flat[0] || {});
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

      const ws = XLSX.utils.json_to_sheet(labeled);
      const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };
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
      this.exportToCsvFallback();
    }
  }

  /** CSV fallback exporter (ES2018-safe, typed) */
  private exportToCsvFallback(): void {
    const flat: Array<Record<string, any>> =
      this.filteredData.map(r => flattenRowForExcel(r)) as Array<Record<string, any>>;

    const colSet = new Set<string>();
    flat.forEach((row: Record<string, any>) => {
      Object.keys(row).forEach((k: string) => colSet.add(k));
    });
    const cols: string[] = Array.from(colSet);

    const esc = (s: any): string => {
      const v = (s ?? '').toString().replace(/"/g, '""');
      return `"${v}"`;
    };

    const header = cols.join(',');
    const rows = flat.map((row: Record<string, any>) =>
      cols.map((c: string) => esc(row[c])).join(',')
    );
    const csv = [header, ...rows].join('\r\n');

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

  /** Reset all filters (global text + toggles + dropdown) */
  resetAllFilters(): void {
    this.filterForm.reset({
      globalFilter: '',
      hasEitanOnly: false,
      hasNamerOnly: false,
      hasAdActiveOnly: false,
      hasChameleonOnly: false,
      hasChameleonRestrictedOnly: false,
      onlineFilter: 'all',   // dropdown back to "all"
      activeToggle: null,    // no Active/Inactive filter
      hasEveOnly: false,
      hasEitanPsychOnly: false,  // NEW

    });
    this.applyFilters();
  }

  /** Navigate to home (if used in template) */
  goToHome(): void {
    this.router.navigate(['/MainPageReports']);
  }
}
