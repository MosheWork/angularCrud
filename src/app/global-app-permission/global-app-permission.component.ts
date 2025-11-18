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
export interface AdGroupOption {
  groupDesc: string;  // "איתן"
  groups: string;     // "U_ChamDoctor,U_ChamNurse,..."
}
/** Keys that can be very long and must be chunked for Excel */
const LONG_KEYS = [
  'adActivePermision',
  'ChamelleonGropPermision',
  'ChamelleonRestrictedGropPermision',
  'metaVision'  

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

  // חדשים
  departnentDescripton: '(onnline) מחלקה',
  functionDescription: '(onnline) תפקיד',
  metaVision: 'metaVision',
  description: 'סיבת סיום עבודה',

  // MetaVision – Hebrew roles (optional for Excel)
  metaVisionRoles: 'תפקידי MetaVision'
};

/** MetaVision AD groups → Hebrew role name */
const METAVISION_GROUPS: { adGroup: string; labelHe: string }[] = [
  { adGroup: 'U_MV_Admins',                    labelHe: 'מנהל מערכת / מערכות מידע' },
  { adGroup: 'U_MV_ICU_DOC',                   labelHe: 'רופא/ה ט.נ כללי' },
  { adGroup: 'U_MV_PICU_DOC',                  labelHe: 'רופא/ה ט.נ ילדים' },
  { adGroup: 'U_MV_DOC_CONSULT',               labelHe: 'רופא/ה מייעצ/ת' },
  { adGroup: 'U_MV_DOCTORS_READONLY',          labelHe: 'רופא/ה קריאה בלבד' },
  { adGroup: 'U_MV_ICU_NURSE',                 labelHe: 'אח/ות ט.נ כללי' },
  { adGroup: 'U_MV_PICU_NURSE',                labelHe: 'אח/ות ט.נ ילדים' },
  { adGroup: 'U_MV_NURSE_READONLY',            labelHe: 'אח/ות קריאה בלבד' },
  { adGroup: 'U_MV_PHYSIOTHERAPISTS',          labelHe: 'פיזיותרפיסט/ית' },
  { adGroup: 'U_MV_DIETICIANS',                labelHe: 'תזונאי/ת' },
  { adGroup: 'U_MV_OCCUPATIONAL_THERAPISTS',   labelHe: 'מרפא/ת בעיסוק' },
  { adGroup: 'U_MV_SOCIAL_WORKERS',            labelHe: 'עובד/ת סוציאלית' },
  { adGroup: 'U_MV_COMMUNICATION_CLINICS',     labelHe: 'קלינאי/ת תקשורת' },
  { adGroup: 'U_MV_PSYCHOLOGISTS',             labelHe: 'פסיכולוג/ית' },
  { adGroup: 'U_MV_STAGER',                    labelHe: "סטאז'ר/ית" },
  { adGroup: 'U_MV_NURSING_STUDENT',           labelHe: 'סטודנט/ית לסיעוד' },
  { adGroup: 'U_MV_MEDICAL_STUDENTS',          labelHe: 'סטודנט/ית לרפואה' },
  { adGroup: 'U_MV_MEDICAL_RECORDS',           labelHe: 'רשמ/ת רפואי/ת' },
  { adGroup: 'U_MV_SECRETARY',                 labelHe: 'מזכיר/ה רפואי/ת' },
  { adGroup: 'U_MV_NURSES_MGMT',               labelHe: 'מנהלת הסיעוד' },
  { adGroup: 'U_MV_RISK_MGMT',                 labelHe: 'בטיחות הטיפול' },
  { adGroup: 'U_MV_PHARMACISTS',               labelHe: 'רוקח/ת' },
  { adGroup: 'U_MV_CONTROLLERS',               labelHe: 'בקר/ית' },
  { adGroup: 'U_MV_CLINICAL_RESEARCHES',       labelHe: 'מתאמ/ת מחקר' },
  { adGroup: 'U_MV_DOC_ASSISTANTS',            labelHe: 'עוזר/ת רופא' },
  { adGroup: 'U_MV_ANESTHESIOLOGISTS',         labelHe: 'רופא/ה מרדימ/ה' },
  { adGroup: 'U_MV_DOCTORS_TEST',              labelHe: 'רופא/ה טסט' },
  { adGroup: 'U_MV_NURSES_TEST',               labelHe: 'אח/ות טסט' },
  { adGroup: 'U_MV_PARA',                      labelHe: 'קבוצת פרא רפואי' }
];

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

  // Active / not active
  endWorkDate: string | null;

  // חדשים
  description: string;              // EP_EndWorkReason.Description
  metaVision: string;              // EP_EndWorkReason.Description

  departnentDescripton: string;     // EP_Departnents.DepartnentDescripton
  functionDescription: string;      // EP_Functions.FunctionDescription

  // MetaVision – comma-separated Hebrew roles (derived)
  metaVisionRoles?: string;
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
  Title1: string = ' הרשאות אפליקציות גלובליות - ';
  Title2: string = 'סה"כ תוצאות ';
  titleUnit: string = 'הרשאות ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  // what user chooses in the multi-select (by GroupDesc, e.g. "איתן")
selectedGroupDescs: string[] = [];

// all AD group codes (U_ChamDoctor, U_ChamNurse, ...) derived from selection
selectedGroupsFlat: string[] = [];
  filterForm: FormGroup;
  adGroups: AdGroupOption[] = [];
  selectedAdGroups: string[] = []; // this will hold [Group] values
  dataSource: Row[] = [];
  filteredData: Row[] = [];
  matTableDataSource: MatTableDataSource<Row>;

  // Column order (endWorkDate intentionally not shown)
  columns = [
    'profilePicture', 'employeeID', 'name', 'adUserName',
    'departnentDescripton', 'functionDescription', 'description','metaVision',
    'eitanChameleonADGroupPermision', 'namerUserActivePermision', 'adActivePermision',
    'ChamelleonGropPermision', 'ChamelleonRestrictedGropPermision',
    'OnnLineActiveUser', 'EVEActiveUser',
    // 'metaVisionRoles' // ← uncomment if you want a column with MetaVision roles in Hebrew
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
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
      const rows: Row[] = data.map(d => {
        const adActive = d.adActivePermision ?? d.ADActivePermision ?? '';
  
        // find MV roles for this row (Hebrew labels)
        const adStr = (adActive || '').toString();
        const mvLabels: string[] = [];
        METAVISION_GROUPS.forEach(g => {
          const regex = new RegExp(`(^|[;,\\s|])${g.adGroup}([;,\\s|]|$)`, 'i');
          if (regex.test(adStr)) {
            mvLabels.push(g.labelHe);
          }
        });
  
        return {
          employeeID: (d.employeeID ?? d.EmployeeID ?? null)?.toString() ?? null,
          name: d.name ?? d.Name ?? null,
          adUserName: d.adUserName ?? d.ADUserName ?? null,
          profilePicture: d.profilePicture ?? d.ProfilePicture ?? null,
  
          eitanChameleonADGroupPermision: d.eitanChameleonADGroupPermision ?? d.EitanChameleonADGroupPermision ?? '',
          namerUserActivePermision:       d.namerUserActivePermision ?? d.NAMERUserActivePermision ?? '',
          adActivePermision:              adActive,
  
          ChamelleonGropPermision:           d.ChamelleonGropPermision ?? d.chamelleonGropPermision ?? '',
          ChamelleonRestrictedGropPermision: d.ChamelleonRestrictedGropPermision ?? d.chamelleonRestrictedGropPermision ?? '',
          OnnLineActiveUser:                 d.OnnLineActiveUser ?? d.onnLineActiveUser ?? '',
          EVEActiveUser:                     d.EVEActiveUser ?? d.eveActiveUser ?? '',
  
          endWorkDate: d.endWorkDate ?? d.EndWorkDate ?? null,
  
          description:          d.Description ?? d.description ?? '',
          departnentDescripton: d.DepartnentDescripton ?? d.departnentDescripton ?? '',
          functionDescription:  d.FunctionDescription ?? d.functionDescription ?? '',
  
          // 🔹 NEW: take MetaVision string from backend
          metaVision: d.metaVision ?? d.MetaVision ?? '',
  
          // optional: Hebrew roles derived on the client
          metaVisionRoles: mvLabels.join(', ')
        };
      });
        this.dataSource = rows;
        this.filteredData = [...rows];
        this.matTableDataSource = new MatTableDataSource<Row>(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        this.filterForm.valueChanges
          .pipe(debounceTime(100), distinctUntilChanged())
          .subscribe(() => this.applyFilters());

        this.applyFilters();
        this.loadAdGroups();

      });
  }
  loadAdGroups(): void {
    this.http.get<AdGroupOption[]>(`${environment.apiUrl}/GlobalAppPermission/ad-groups`)
      .subscribe({
        next: res => {
          this.adGroups = res;
        },
        error: err => console.error('Failed to load AD groups', err)
      });
  }
  
  onAdGroupsChange(selectedDescs: string[]): void {
    this.selectedGroupDescs = selectedDescs || [];
  
    const flat = new Set<string>();
  
    for (const desc of this.selectedGroupDescs) {
      const option = this.adGroups.find(g => g.groupDesc === desc);
      if (!option) continue;
  
      (option.groups || '')
        .split(',')
        .map(x => x.trim())
        .filter(x => !!x)
        .forEach(code => flat.add(code.toLowerCase()));
    }
  
    this.selectedGroupsFlat = Array.from(flat);
    this.applyFilters();
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
  
      departnentDescripton: '(onnline)מחלקה',
      functionDescription: '(onnline)תפקיד',
      description: 'סיבת סיום עבודה',
  
      // 🔹 NEW
      metaVision: 'משתמש MV משוייך',
  
      metaVisionRoles: 'תפקידי MetaVision'
    };
    return labels[column] ?? column;
  }
  

  private createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],

      hasEitanOnly: [false],
      hasNamerOnly: [false],
      hasAdActiveOnly: [false],
      hasChameleonOnly: [false],
      hasChameleonRestrictedOnly: [false],

      onlineFilter: ['active'],

      activeToggle: [null as boolean | null],

      hasEveOnly: [false],
      hasEitanPsychOnly: [false],

      // NEW: MetaVision toggle
      hasMetaVisionOnly: [false]
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
      hasMetaVisionOnly
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

      // איתן - פסיכיאטר
      if (hasEitanPsychOnly) {
        const s = (r.eitanChameleonADGroupPermision ?? '').toString();
        const hasPsych = /(^|[,\s;|])U_ChamPsyc([,\s;|]|$)/i.test(s);
        if (!hasPsych) return false;
      }

      // NEW: MetaVision – at least one U_MV_* group in ADActivePermision
      if (hasMetaVisionOnly) {
        const adStr = (r.adActivePermision ?? '').toString();
        const hasMv = METAVISION_GROUPS.some(g =>
          new RegExp(`(^|[;,\\s|])${g.adGroup}([;,\\s|]|$)`, 'i').test(adStr)
        );
        if (!hasMv) return false;
      }

      // Active/Inactive toggle (EndWorkDate)
      if (activeToggle === true && r.endWorkDate !== null) return false;
      if (activeToggle === false && r.endWorkDate === null) return false;

      // Online dropdown
      if (onlineFilter !== 'all') {
        const onlineParsed = this.parseBoolish(r.OnnLineActiveUser);
        if (onlineFilter === 'active' && onlineParsed !== true) return false;
        if (onlineFilter === 'inactive' && onlineParsed !== false) return false;
      }
    // 🔹 New: filter by selected AD group families (איתן etc.)
    if (this.selectedGroupsFlat && this.selectedGroupsFlat.length > 0) {
      const adStr = (r.adActivePermision ?? '').toString().toLowerCase();

      const matchesAny = this.selectedGroupsFlat.some(code =>
        adStr.includes(code)
      );

      if (!matchesAny) return false;
    }

      // Global text filter across visible columns
      if (!gf) return true;
      return this.columns.some(c =>
        (r as any)[c]?.toString().toLowerCase().includes(gf)
      );
    });

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

  /** Reset all filters */
  resetAllFilters(): void {
    this.filterForm.reset({
      globalFilter: '',
      hasEitanOnly: false,
      hasNamerOnly: false,
      hasAdActiveOnly: false,
      hasChameleonOnly: false,
      hasChameleonRestrictedOnly: false,
      onlineFilter: 'all',
      activeToggle: null,
      hasEveOnly: false,
      hasEitanPsychOnly: false,
      hasMetaVisionOnly: false
    });
    this.applyFilters();
  }

  goToHome(): void {
    this.router.navigate(['/MainPageReports']);
  }
}
