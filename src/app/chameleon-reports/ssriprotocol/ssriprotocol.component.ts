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
  selector: 'app-ssri-protocol',
  templateUrl: './ssriprotocol.component.html',
  styleUrls: ['./ssriprotocol.component.scss']
})
export class SSRIProtocolComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'SSRI Protocol Report';
  Title1: string = 'Total Records: ';
  Title2: string = '';

  // 🔑 lower-first keys expected from backend
  columns: string[] = ['idNum', 'admissionNo', 'firstName', 'lastName', 'orderStartDate'];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;
  icd9Code: FormControl;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.icd9Code = new FormControl('');
  }

  ngOnInit() {
    this.fetchSSRIProtocolData();
    this.setupFormValueChanges();
  }

  fetchSSRIProtocolData() {
    this.http.get<any[]>(`${environment.apiUrl}SSRIprotocol`).subscribe(
      (data) => {
        // data is used as-is with lower-first keys
        this.dataSource = data || [];
        this.filteredData = [...this.dataSource];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.applyFilters();
      },
      (error) => {
        console.error('Error fetching SSRI protocol data:', error);
      }
    );
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],
      startEntryDate: [''], // from-date
      endEntryDate: [''],   // to-date
    });
  }

  setupFormValueChanges() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
        if (this.paginator) this.paginator.firstPage();
      });
  }

  applyFilters() {
    const { globalFilter, startEntryDate, endEntryDate } = this.filterForm.value;
    const global = (globalFilter || '').toLowerCase();
    const start = startEntryDate ? new Date(startEntryDate) : null;
    const end = endEntryDate ? new Date(endEntryDate) : null;

    this.filteredData = this.dataSource.filter((item) => {
      // global search across defined columns
      const globalMatch =
        global === '' ||
        this.columns.some((col) => String(item[col] ?? '').toLowerCase().includes(global));

      // date range on orderStartDate
      let dateMatch = true;
      if (start || end) {
        const entryDate = new Date(item.orderStartDate);
        if (start && entryDate < start) dateMatch = false;
        if (end && entryDate > end) dateMatch = false;
      }

      return globalMatch && dateMatch;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  resetFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'ssri_protocol_report.xlsx';
    link.click();
  }

 
}
