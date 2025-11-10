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

type Row = {
  employeeID: string | null;
  name: string | null;
  adUserName: string | null;
  profilePicture: string | null;
  eitanChameleonADGroupPermision: string; // raw string from DB (may be empty)
  namerUserActivePermision: string;       // raw string from DB (may be empty)
  adActivePermision: string;              // raw string from DB (may be long)
};

interface FormControls {
  [key: string]: FormControl;
}

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

  filterForm: FormGroup;
  dataSource: Row[] = [];
  filteredData: Row[] = [];
  matTableDataSource: MatTableDataSource<Row>;

  // Keep the same class-based structure; columns are adapted for this grid
  columns: string[] = [
    'profilePicture',
    'employeeID',
    'name',
    'adUserName',
    'eitanChameleonADGroupPermision',
    'namerUserActivePermision',
    'adActivePermision'
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<Row>([]);
  }

  ngOnInit(): void {
    this.http.get<any[]>(environment.apiUrl + 'GlobalAppPermission/all')
      .subscribe(data => {
        const rows: Row[] = data.map(d => ({
          employeeID: (d.employeeID ?? d.EmployeeID ?? null)?.toString() ?? null,
          name: d.name ?? d.Name ?? null,
          adUserName: d.adUserName ?? d.ADUserName ?? null,
          profilePicture: d.profilePicture ?? d.ProfilePicture ?? null,
          eitanChameleonADGroupPermision: d.eitanChameleonADGroupPermision ?? d.EitanChameleonADGroupPermision ?? '',
          namerUserActivePermision: d.namerUserActivePermision ?? d.NAMERUserActivePermision ?? '',
          adActivePermision: d.adActivePermision ?? d.ADActivePermision ?? ''
        }));

        this.dataSource = rows;
        this.filteredData = [...rows];
        this.matTableDataSource = new MatTableDataSource<Row>(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        // any change on the form re-applies filters
        this.filterForm.valueChanges
          .pipe(debounceTime(100), distinctUntilChanged())
          .subscribe(() => this.applyFilters());

        this.applyFilters();
      });
  }

  getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      employeeID: 'מס׳ עובד',
      name: 'שם',
      adUserName: 'AD משתמש',
      profilePicture: 'תמונת פרופיל',
      eitanChameleonADGroupPermision: 'קבוצה באיתן',
      namerUserActivePermision: 'NAMER  ',
      adActivePermision: 'AD קבוצות'
    };
    return labels[column] ?? column;
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],
      hasEitanOnly: [false],
      hasNamerOnly: [false],
      hasAdActiveOnly: [false]
    });
  }
  private hasValue(v: any): boolean {
    if (v === null || v === undefined) return false;
    const s = String(v).trim();
    return s.length > 0; // treat any non-empty string as “has value”
  }

  getFormControl(column: string): FormControl {
    return (this.filterForm.get(column) as FormControl) || new FormControl('');
  }

  applyFilters(): void {
    const { globalFilter, hasEitanOnly, hasNamerOnly, hasAdActiveOnly } = this.filterForm.value;
    const gf = (globalFilter || '').toString().toLowerCase();

    this.filteredData = this.dataSource.filter(r => {
      // checkbox filters (keep rows that HAVE a value when checked)
      if (hasEitanOnly && !this.hasValue(r.eitanChameleonADGroupPermision)) return false;
      if (hasNamerOnly && !this.hasValue(r.namerUserActivePermision)) return false;
      if (hasAdActiveOnly && !this.hasValue(r.adActivePermision)) return false;

      // global text filter across visible columns
      if (!gf) return true;
      return this.columns.some(c => (r as any)[c]?.toString().toLowerCase().includes(gf));
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  exportToExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.filteredData);
    const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'GlobalAppPermission.xlsx';
    link.click();
  }

  goToHome(): void {
    this.router.navigate(['/MainPageReports']);
  }
}
