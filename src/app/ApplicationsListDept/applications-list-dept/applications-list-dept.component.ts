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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  columns: string[] = [
    'AppName',
    'AppDescription',
    'PrimaryReference',
    'SecondaryReference',
    'Remarks',
    'Phones',
    'Guides',
    'companyName'
  ];

  constructor(private http: HttpClient, private fb: FormBuilder, public dialog: MatDialog) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchData(); // <- do the mapped load
  
    // set up reactive filters once
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }
  
  fetchData(): void {
    this.http.get<any[]>(environment.apiUrl + 'ApplicationsListDept/GetAll')
      .subscribe(raw => {
        const data = raw.map(r => this.computeGuideFields(r)); // <-- shared mapping
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.totalResults = data.length;
      });
  }
  /** One place to compute guideUrl/guideLabel (and icon) */
private computeGuideFields(r: any) {
  const guides = r.Guides || '';
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

  // (optional) display AppName as label instead of filename
  const displayLabel = r.AppName || guideLabel;

  return { ...r, guideUrl, guideLabel: displayLabel, guideIcon, _guideExt: ext };
}

private iconForExt(ext: string) {
  if (ext === 'pdf') return '../../../assets/pdf.png';
  if (ext === 'doc' || ext === 'docx') return '../../../assets/word.png';
  return 'assets/icons/file.svg';
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
      this.columns.every(col => !filters[col] || ((item[col] || '').toString().toLowerCase().includes(filters[col].toLowerCase()))) &&
      (global === '' || this.columns.some(col => ((item[col] || '') + '').toLowerCase().includes(global)))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  exportToExcel(): void {
    const headers = {
      AppName: 'שם',
      AppDescription: 'הסבר על המערכת',
      PrimaryReference: 'רפרנט ראשי',
      SecondaryReference: 'רפרנט משני',
      Remarks: 'הערות',
      Phones: 'טלפונים',
      Guides: 'מדריכים',
      companyName: 'חברה'
    };

    const exportData = this.filteredData.map(item => ({
      [headers.AppName]: item.AppName,
      [headers.AppDescription]: item.AppDescription,
      [headers.PrimaryReference]: item.PrimaryReference,
      [headers.SecondaryReference]: item.SecondaryReference,
      [headers.Remarks]: item.Remarks,
      [headers.Phones]: item.Phones,
      [headers.Guides]: item.Guides,       // single URL string
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
      case 'AppName': return 'שם';
      case 'AppDescription': return 'הסבר על המערכת';
      case 'PrimaryReference': return 'רפרנט ראשי';
      case 'SecondaryReference': return 'רפרנט משני';
      case 'Remarks': return 'הערות';
      case 'Phones': return 'טלפונים';
      case 'Guides': return 'מדריכים';
      case 'companyName': return 'חברה';
      default: return column;
    }
  }
}

