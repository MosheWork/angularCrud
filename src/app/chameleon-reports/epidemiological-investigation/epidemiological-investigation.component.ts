import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';



@Component({
  selector: 'app-epidemiological-investigation',
  templateUrl: './epidemiological-investigation.component.html',
  styleUrls: ['./epidemiological-investigation.component.scss'],
})
export class EpidemiologicalInvestigationComponent implements OnInit {
  titleUnit: string = 'חקירה אפידמיולוגית';
  totalResults: number = 0;
  
  timelineEvents: any[] = []; // For the timeline display

  columns: string[] = ['MedicalRecord', 'EntryDate', 'EntryUserName', 'Heading', 'UnitName', 'Source'];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;
  idNumControl: FormControl;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.idNumControl = new FormControl('');
  }

  ngOnInit() {
    this.setupFormValueChanges();
  }

  // Fetch table and timeline data
  fetchData() {
    const idNum = this.idNumControl.value?.trim();

    if (!idNum) {
      this.snackBar.open('יש להזין מספר מזהה', 'סגור', { duration: 3000 });
      return;
    }

    this.http
      .get<any[]>(`${environment.apiUrl}EpidemiologicalInvestigation/investigate`, { params: { idNum } })
      .subscribe(
        (data) => {
          // Update table data
          this.dataSource = data;
          this.filteredData = [...this.dataSource];
          this.matTableDataSource = new MatTableDataSource(this.filteredData);
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort = this.sort;
          this.applyFilters();
          this.totalResults = this.dataSource.length;

          // Populate timeline events
          this.populateTimeline(data);
        },
        (error) => {
          console.error('Error fetching data:', error);
          this.snackBar.open('שגיאה בטעינת נתונים', 'סגור', { duration: 3000 });
        }
      );
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      globalFilter: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  setupFormValueChanges() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters.globalFilter || '').toLowerCase();
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    this.filteredData = this.dataSource.filter((item) => {
      // Apply global filter
      const globalMatch = this.columns.some((column) => {
        const value = (item[column] || '').toString().toLowerCase();
        return value.includes(globalFilter);
      });

      // Apply date filter
      let dateMatch = true;
      if (startDate || endDate) {
        const entryDate = new Date(item.EntryDate);
        if (startDate && entryDate < startDate) {
          dateMatch = false;
        }
        if (endDate && entryDate > endDate) {
          dateMatch = false;
        }
      }

      return (globalFilter === '' || globalMatch) && dateMatch;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }

  resetFilters() {
    this.filterForm.reset();
    this.idNumControl.reset();
    this.filteredData = [...this.dataSource];
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'epidemiological_investigation.xlsx';
    link.click();
  }

  // Populate timeline events
  populateTimeline(data: any[]) {
    this.timelineEvents = data.map((item) => ({
      timestamp: item.EntryDate,
      title: item.EntryUserName,
      UnitName: item.UnitName,
      description: item.Heading || 'No details available',
    }));
  }

  // Handle tab change
  onTabChange(index: number) {
    if (index === 1) {
      // Reload timeline data when switching to the timeline tab
      console.log('Timeline tab selected. Events:', this.timelineEvents);
    }
  }
}
