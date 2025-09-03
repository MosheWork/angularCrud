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
  selector: 'app-drugs-report',
  templateUrl: './drugs-report-component.component.html',
  styleUrls: ['./drugs-report-component.component.scss']
})
export class DrugsReportComponent implements OnInit {
  titleUnit: string = 'דו"ח תרופות';
  Title1: string = 'סך הכל תוצאות:';
  totalResults: number = 0;

  // 🔑 lower-first keys expected from backend
  columns: string[] = [
    'idNum',
    'firstName',
    'lastName',
    'entryDate',
    'drugName',
    'fromHomeDrugs',
    'activeDrugs'
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
    this.fetchDrugsReportData();
    this.setupFormValueChanges();
  }

  // Fetch data from backend API
  fetchDrugsReportData() {
    this.http.get<any[]>(`${environment.apiUrl}/DrugsReport`).subscribe(
      (data) => {
        // use as-is assuming lower-first keys
        this.dataSource = data || [];
        this.filteredData = [...this.dataSource];
        this.totalResults = this.filteredData.length;
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.applyFilters();
      },
      (error) => {
        console.error('Error fetching drugs report data:', error);
      }
    );
  }

  // Create form group with filters
  createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],
      startEntryDate: [''],
      endEntryDate: [''],
    });
  }

  // Set up form value changes for live filtering
  setupFormValueChanges() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
        if (this.paginator) this.paginator.firstPage();
      });
  }

  // Apply global and date range filters
  applyFilters() {
    const { globalFilter, startEntryDate, endEntryDate } = this.filterForm.value;
    const global = (globalFilter || '').toLowerCase();
    const start = startEntryDate ? new Date(startEntryDate) : null;
    const end = endEntryDate ? new Date(endEntryDate) : null;

    this.filteredData = this.dataSource.filter((item) => {
      // Global filter across displayed columns
      const globalMatch =
        global === '' ||
        this.columns.some((col) => String(item[col] ?? '').toLowerCase().includes(global));

      // Date range on entryDate
      let dateMatch = true;
      if (start || end) {
        const d = new Date(item.entryDate);
        if (start && d < start) dateMatch = false;
        if (end && d > end) dateMatch = false;
      }

      return globalMatch && dateMatch;
    });

    // Update the table and total results count
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  // Reset all filters
  resetFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  // Export table data to Excel
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, 'drugs_report.xlsx');
  }


}
