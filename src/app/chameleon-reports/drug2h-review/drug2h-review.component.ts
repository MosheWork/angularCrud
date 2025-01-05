import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-drug2h-review',
  templateUrl: './drug2h-review.component.html',
  styleUrls: ['./drug2h-review.component.scss'],
})
export class Drug2hReviewComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = ' דוח בקרת תרופות ברות סיכון';
  Title1: string = 'סה"כ רשומות: ';
  Title2: string = '';

  showGraph: boolean = false;
  graphData: any[] = [];
  bestPerformers: any[] = [];
  worstPerformers: any[] = [];
  columns: string[] = [
    'Unit_Name',
    'Next_Execution_Not_Null',
    'Count_Above_2_10H',
    'Count_Below_2_10H',
    'Percent_Below_2_10H',
  ];

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  filterForm: FormGroup;

  gaugeValue: number = 0;
  totalUnits: number = 0;
  totalAbove210: number = 0;
  totalBelow210: number = 0;
  percentBelow210: number = 0;

  // Define availableYears and availableQuarters
  availableYears: number[] = [2023,2024,2025,2026];
  availableQuarters: number[] = [1, 2, 3, 4];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.filterForm = this.fb.group({
      globalFilter: [''],
      year: [null],
      quarter: [null]
    });

  }
  ngOnInit(): void {
    this.matTableDataSource.filterPredicate = (data: any, filter: string) => {
      const formattedFilter = filter.trim().toLowerCase();
      return this.columns.some((column) => {
        const columnValue = data[column] ? data[column].toString().toLowerCase() : '';
        return columnValue.includes(formattedFilter);
      });
    };
  
    this.fetchData();
  }
  

  private createFilterForm(): FormGroup {
    return this.fb.group({
      year: new FormControl(null), // Year filter
      quarter: new FormControl(null), // Quarter filter
      globalFilter: new FormControl(''),
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    const globalFilter = filters.globalFilter ? filters.globalFilter.trim().toLowerCase() : '';
    const year = filters.year;
    const quarter = filters.quarter;
    console.log('Apply Filters button clicked');
  this.fetchData(filters.year, filters.quarter);
    // Apply global filtering
    this.matTableDataSource.filter = globalFilter;
  
    // Filter by year and quarter if specified
    let filteredData = this.dataSource;
    if (year || quarter) {
      filteredData = this.dataSource.filter((item) => {
        const matchesYear = year ? item.year === year : true;
        const matchesQuarter = quarter ? item.quarter === quarter : true;
        return matchesYear && matchesQuarter;
      });
    }
  
    // Update the table data
    this.matTableDataSource.data = filteredData;
  
    // Update best and worst performers
    this.bestPerformers = [...filteredData]
      .sort((a, b) => b.Percent_Below_2_10H - a.Percent_Below_2_10H)
      .slice(0, 5);
  
    this.worstPerformers = [...filteredData]
      .sort((a, b) => a.Percent_Below_2_10H - b.Percent_Below_2_10H)
      .slice(0, 5);
  
    // Recalculate metrics
    this.calculateMetrics();
  }
  
  resetFilters() {
    this.filterForm.reset();
    this.fetchData(); // Fetch all data
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'drug2h_review.xlsx';
    link.click();
  }
  fetchData(year?: number, quarter?: number): void {
    const params: any = {};
    if (year) params.year = year;
    if (quarter) params.quarter = quarter;
  
    console.log('Sending request with params:', params); // Debug request params
  
    this.http.get<any[]>(`${environment.apiUrl}Drug2hReview`, { params }).subscribe(
      (data) => {
        console.log('Response from backend:', data); // Debug backend response
        this.dataSource = data;
        this.matTableDataSource.data = [...this.dataSource];
  
        // Update best and worst performers
        this.bestPerformers = [...this.dataSource]
          .sort((a, b) => b.Percent_Below_2_10H - a.Percent_Below_2_10H)
          .slice(0, 5);
  
        this.worstPerformers = [...this.dataSource]
          .sort((a, b) => a.Percent_Below_2_10H - b.Percent_Below_2_10H)
          .slice(0, 5);
  
        // Recalculate metrics
        this.calculateMetrics();
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }
  
  
  


  calculateMetrics(): void {
    const filteredData = this.matTableDataSource.data;
  
    this.totalUnits = filteredData.length;
    this.totalAbove210 = filteredData.reduce((sum, item) => sum + (item.Count_Above_2_10H || 0), 0);
    this.totalBelow210 = filteredData.reduce((sum, item) => sum + (item.Count_Below_2_10H || 0), 0);
  
    const totalExecutions = this.totalAbove210 + this.totalBelow210;
    this.percentBelow210 = totalExecutions > 0 ? (this.totalBelow210 / totalExecutions) * 100 : 0;
  
    this.gaugeValue = this.percentBelow210;
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
  private initializeAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    // Populate years starting from the last 5 years up to the current year
    this.availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

}
