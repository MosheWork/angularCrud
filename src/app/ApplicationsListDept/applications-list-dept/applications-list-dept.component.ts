import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { ApplicationsListDeptDialogComponent } from '../applications-list-dept-dialog/applications-list-dept-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-applications-list-dept',
  templateUrl: './applications-list-dept.component.html',
  styleUrls: ['./applications-list-dept.component.scss']
})
export class ApplicationsListDeptComponent implements OnInit {
  title: string = 'רשימת מערכות לפי מחלקות';
  totalResults = 0;

  // counters
  totalApps = 0;
  appsWithGuides = 0;
  filteredApps = 0;
  filteredWithGuides = 0;

  // missing counters
  missingTotal = 0;
  missingFiltered = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  // 🔑 lower-first keys
  columns: string[] = [
    'appName',
    'appDescription',
    'primaryReference',
    'secondaryReference',
    'remarks',
    'phones',
    'guides',
    'companyName'
  ];

  constructor(private http: HttpClient, private fb: FormBuilder, public dialog: MatDialog) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchData();

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  fetchData(): void {
    this.http.get<any[]>(environment.apiUrl + 'ApplicationsListDept/GetAll').subscribe(raw => {
      const data = raw.map(r => this.computeGuideFields(r));
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource.data = this.filteredData;
      this.totalResults = data.length;
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      this.computeStats();
      this.computeMissingStats();
    });
  }

  /** compute guideUrl/guideLabel/icon using lower-first keys */
  private computeGuideFields(r: any) {
    const guides = r.guides || '';
    const isAbsolute = /^https?:\/\//i.test(guides);

    const guideUrl = guides
      ? (isAbsolute
          ? guides
          : `${environment.apiUrl}ApplicationsListDept/Guide?fileName=${encodeURIComponent(guides)}`)
      : '';

    const lastSeg = (guides.split('/').pop() || guides);
    let guideLabel: string;
    try { guideLabel = decodeURIComponent(lastSeg); } catch { guideLabel = lastSeg; }

    const ext = (lastSeg.split('.').pop() || '').toLowerCase();
    const guideIcon = this.iconForExt(ext);

    // display appName as label if present
    const displayLabel = r.appName || guideLabel;

    return { ...r, guideUrl, guideLabel: displayLabel, guideIcon, _guideExt: ext };
  }

  private iconForExt(ext: string) {
    if (ext === 'pdf') return '../../../assets/pdf.png';
    if (ext === 'doc' || ext === 'docx') return '../../../assets/word.png';
    return '';
  }

  private createFilterForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach(col => formControls[col] = new FormControl(''));
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    const global = (filters['globalFilter'] || '').toLowerCase();

    this.filteredData = this.dataSource.filter(item =>
      // per-column filters
      this.columns.every(col =>
        !filters[col] || ((item[col] || '').toString().toLowerCase().includes(filters[col].toLowerCase()))
      )
      // global filter
      && (global === '' || this.columns.some(col => ((item[col] || '') + '').toLowerCase().includes(global)))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;

    this.computeStats();
    this.computeMissingStats();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  exportToExcel(): void {
    const headers = {
      appName: 'שם',
      appDescription: 'הסבר על המערכת',
      primaryReference: 'רפרנט ראשי',
      secondaryReference: 'רפרנט משני',
      remarks: 'הערות',
      phones: 'טלפונים',
      guides: 'מדריכים',
      companyName: 'חברה'
    };

    const exportData = this.filteredData.map(item => ({
      [headers.appName]: item.appName,
      [headers.appDescription]: item.appDescription,
      [headers.primaryReference]: item.primaryReference,
      [headers.secondaryReference]: item.secondaryReference,
      [headers.remarks]: item.remarks,
      [headers.phones]: item.phones,
      [headers.guides]: item.guides,
      [headers.companyName]: item.companyName
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'רשימה': worksheet }, SheetNames: ['רשימה'] };
    XLSX.writeFile(workbook, 'ApplicationsListDept.xlsx');
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(ApplicationsListDeptDialogComponent, {
      width: '500px',
      data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.fetchData();
    });
  }

  openEditDialog(row: any) {
    const dialogRef = this.dialog.open(ApplicationsListDeptDialogComponent, {
      width: '500px',
      data: row
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.fetchData();
    });
  }

  getColumnLabel(column: string): string {
    switch (column) {
      case 'appName': return 'שם';
      case 'appDescription': return 'הסבר על המערכת';
      case 'primaryReference': return 'רפרנט ראשי';
      case 'secondaryReference': return 'רפרנט משני';
      case 'remarks': return 'הערות';
      case 'phones': return 'טלפונים';
      case 'guides': return 'מדריכים';
      case 'companyName': return 'חברה';
      default: return column;
    }
  }

  private computeStats() {
    // totals across ALL data
    this.totalApps = this.dataSource.length;
    this.appsWithGuides = this.dataSource.filter(x =>
      !!x.guides || !!x.guideUrl
    ).length;

    // totals for CURRENT filtered view
    this.filteredApps = this.filteredData.length;
    this.filteredWithGuides = this.filteredData.filter(x =>
      !!x.guides || !!x.guideUrl
    ).length;
  }

  private computeMissingFields(r: any): string[] {
    const m: string[] = [];
    if (!(`${r.primaryReference || ''}`.trim())) m.push('רפרנט ראשי');
    if (!(`${r.phones || ''}`.trim()))          m.push('טלפונים');
    if (!(`${r.companyName || ''}`.trim()))     m.push('חברה');
    if (!(`${r.appDescription || ''}`.trim()))  m.push('הסבר על המערכת');
    return m;
  }

  private decorateRow(r: any) {
    const _missing = this.computeMissingFields(r);
    return { ...r, _missing };
  }

  private computeMissingStats(): void {
    this.missingTotal = this.dataSource.filter(r => this.hasMissing(r)).length;
    this.missingFiltered = this.filteredData.filter(r => this.hasMissing(r)).length;
  }

  // treat empty/null/placeholder values as missing
  private isEmpty(v: any): boolean {
    const s = `${v ?? ''}`.replace(/\u00A0/g, ' ').trim(); // handles &nbsp;
    return s === '' || s === '-' || s === '—' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined';
  }

  // does a row miss at least one required field?
  private hasMissing(r: any): boolean {
    return this.isEmpty(r.primaryReference)
        || this.isEmpty(r.phones)
        || this.isEmpty(r.companyName)
        || this.isEmpty(r.appDescription);
  }
}
