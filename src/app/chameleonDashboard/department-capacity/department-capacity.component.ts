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
  selector: 'app-department-capacity',
  templateUrl: './department-capacity.component.html',
  styleUrls: ['./department-capacity.component.scss'],
})
export class DepartmentCapacityComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'דאשבורד';
  Title1: string = 'סה\"כ רשומות: ';
  Title2: string = '';

  showGraph: boolean = false;
  graphData: any[] = [];

  columns: string[] = [
    'Id_Num',
    'First_Name',
    'Last_Name',
    'Admission_No',
    'Admission_Date',
    'Hospitalization_Status',
    'Medical_Department','Nursing_Department','Status'
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  gaugeValue: number = 0;
  totalPatients: number = 0;
  totalOnLifeSupport: number = 0;
  totalQuarantineDef: number = 0;
  totalQuarantineAirAndTouch: number = 0;
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.http.get<any[]>(environment.apiUrl + 'DepartmentCapacity').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;

      // Add value changes listener to all form controls
      this.columns.forEach((column) => {
        this.filterForm.get(column)?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.applyFilters());
      });

      // Global filter value change listener
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage(); // Reset to first page after filtering
      });

      // Initial filter application
      this.applyFilters();
    });
    this.fetchData();

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
  
    // Apply filters to the data source
    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];
  
        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;
  
        // Filter based on individual column filters and the global search filter
        return (!filterString || stringValue.includes(filterString)) &&
               (!globalFilter || this.columns.some((col) => String(item[col]).toLowerCase().includes(globalFilter)));
      })
    );
  
    // Update total results and table data
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.graphData = this.filteredData;  // Update graph data
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
    link.download = 'department_capacity.xlsx';
    link.click();
  }

  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  fetchData(): void {
    this.http.get<any[]>(`${environment.apiUrl}DepartmentCapacity`).subscribe(
      (data) => {
        this.dataSource = data;
        this.matTableDataSource.data = this.dataSource;
        this.matTableDataSource.paginator = this.paginator;
        this.matTableDataSource.sort = this.sort;
        this.calculateMetrics();
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }

  calculateMetrics(): void {
    this.totalPatients = this.dataSource.length;
    console.log(this.totalPatients )
    this.totalOnLifeSupport = this.dataSource.reduce((sum, item) => sum + (item.onLifeSupport || 0), 0);
    this.totalQuarantineDef = this.dataSource.reduce((sum, item) => sum + (item.quarantineDef || 0), 0);
    this.totalQuarantineAirAndTouch = this.dataSource.reduce((sum, item) => sum + (item.quarantineAirAndTouch || 0), 0);

    const totalBeds = 40;//this.dataSource.reduce((sum, item) => sum + (item.totalBeds || 0), 0);
    this.gaugeValue = totalBeds > 0 ? (this.totalPatients / totalBeds) * 100 : 0;
  }

  getGaugeColor(value: number): string {
    if (value > 100) {
      return '#f44336'; // Red
    } else if (value >= 80) {
      return '#ff9800'; // Orange
    } else {
      return '#4caf50'; // Green
    }
  }
  }


