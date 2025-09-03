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
  selector: 'app-patient-guidance-report',
  templateUrl: './patient-guidance-report.component.html',
  styleUrls: ['./patient-guidance-report.component.scss']
})
export class PatientGuidanceReportComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'דוח הנחיות למטופלים ';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';

  showGraph: boolean = false;
  graphData: any[] = [];

  // 🔑 first-letter-lowercase keys
  columns: string[] = [
    'first_Name',
    'last_Name',
    'id_Num',
    'admission_No'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'PatientGuidanceReportAPI').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      // subscribe per-column filters
      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => this.applyFilters());
      });

      // global filter
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });

      this.applyFilters();
    });
  }

  private createFilterForm(): FormGroup {
    const formControls: any = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];

        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;

        return (!filterString || stringValue.includes(filterString)) &&
               (!globalFilter || this.columns.some((col) => String(item[col]).toLowerCase().includes(globalFilter)));
      })
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'patient_guidance_report.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }


}
