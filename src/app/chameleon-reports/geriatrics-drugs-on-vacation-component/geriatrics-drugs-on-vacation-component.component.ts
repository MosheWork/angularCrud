import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-geriatrics-drugs-on-vacation',
  templateUrl: './geriatrics-drugs-on-vacation-component.component.html',
  styleUrls: ['./geriatrics-drugs-on-vacation-component.component.scss'],
})
export class GeriatricsDrugsOnVacationComponent implements OnInit {
  titleUnit: string = 'תרופות לגריאטרים';
  Title1: string = ' רשימת תרופות ';
  Title2: string = 'סה"כ תוצאות ';
  totalResults: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  columns: string[] = ['Id_Num', 'First_Name', 'Last_Name'];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    // Fetch data from API
    this.http.get<any[]>(`${environment.apiUrl}GeriatricsDrugsOnVacation/GetAllPatients`).subscribe(
      (data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;

        // Add listeners for each column's filter
        this.columns.forEach((column) => {
          this.getFormControl(column).valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(() => this.applyFilters());
        });

        // Global filter
        this.filterForm.get('globalFilter')?.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => this.applyFilters());

        this.applyFilters();
      },
      (error) => console.error('Error fetching data:', error)
    );
  }

  private createFilterForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter']?.toLowerCase() || '';

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const columnFilter = filters[column]?.toLowerCase() || '';
        const value = String(item[column] || '').toLowerCase();
        return !columnFilter || value.includes(columnFilter);
      }) &&
      (globalFilter === '' ||
        this.columns.some((column) => String(item[column] || '').toLowerCase().includes(globalFilter)))
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      Id_Num: 'תעודת זהות',
      First_Name: 'שם פרטי',
      Last_Name: 'שם משפחה',
    };
    return columnLabels[column] || column;
  }

  getFormControl(column: string): FormControl {
    return this.filterForm.get(column) as FormControl;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

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
    link.download = 'GeriatricsDrugsOnVacation.xlsx';
    link.click();
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }
}
